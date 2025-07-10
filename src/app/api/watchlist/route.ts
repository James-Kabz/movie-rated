import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { tmdbService } from "@/lib/tmdb"
// import { sendWatchListEmail } from "@/emails/sendWatchListEmail"
import jsonwebtoken from "jsonwebtoken"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // Try NextAuth session first (for web)
  const session = await getServerSession(authOptions)
  let userId: string | null = session?.user?.id || null

  // If no NextAuth session, try mobile token
  if (!userId) {
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)

      try {
        const decoded = jsonwebtoken.verify(token, process.env.NEXTAUTH_SECRET!) as any
        userId = decoded.userId
        console.log("Mobile auth successful for user:", decoded.email)
      } catch (error) {
        console.error("Mobile token verification failed:", error)
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
    })

    console.log(`Found ${watchlist.length} watchlist items for user ${userId}`)
    return NextResponse.json(watchlist)
  } catch (error) {
    console.error("Error fetching watchlist:", error)
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Try NextAuth session first (for web)
  const session = await getServerSession(authOptions)
  let userId: string | null = session?.user?.id || null
  let userEmail: string | null = session?.user?.email || null
  let userName: string | null = session?.user?.name || null

  // If no NextAuth session, try mobile token
  if (!userId) {
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)

      try {
        const decoded = jsonwebtoken.verify(token, process.env.NEXTAUTH_SECRET!) as any
        userId = decoded.userId
        userEmail = decoded.email
        userName = decoded.name
        console.log("Mobile auth successful for user:", decoded.email)
      } catch (error) {
        console.error("Mobile token verification failed:", error)
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { movieId, sendEmail, mediaType = "movie" } = await request.json()

    // Validate mediaType
    if (!["movie", "tv"].includes(mediaType)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 })
    }

    // Get content details from TMDB based on media type
    let contentDetails: any
    let title: string
    let posterPath: string | null
    let releaseDate: string
    let genres: any[]

    try {
      if (mediaType === "tv") {
        contentDetails = await tmdbService.getTVShowDetails(movieId)
        title = contentDetails.name
        posterPath = contentDetails.poster_path
        releaseDate = contentDetails.first_air_date
        genres = contentDetails.genres || []
      } else {
        contentDetails = await tmdbService.getMovieDetails(movieId)
        title = contentDetails.title
        posterPath = contentDetails.poster_path
        releaseDate = contentDetails.release_date
        genres = contentDetails.genres || []
      }
    } catch (tmdbError) {
      console.error("TMDB API error:", tmdbError)
      return NextResponse.json(
        { error: `Failed to fetch ${mediaType === "tv" ? "TV show" : "movie"} details from TMDB` },
        { status: 404 },
      )
    }

    // Check if already in watchlist (now includes mediaType in the check)
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_movieId_mediaType: {
          userId: userId,
          movieId: movieId,
          mediaType: mediaType,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `${mediaType === "tv" ? "TV show" : "Movie"} already in watchlist` },
        { status: 400 },
      )
    }

    // Add to watchlist with mediaType
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        userId: userId,
        movieId: movieId,
        mediaType: mediaType,
        movieTitle: title,
        moviePoster: tmdbService.getImageUrl(posterPath),
        movieYear: releaseDate?.split("-")[0] || "",
        rating: contentDetails.vote_average || 0,
        genre: genres[0]?.name || "",
      },
    })
    console.log("Watchlist item created:", watchlistItem)
    return NextResponse.json(watchlistItem)
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 })
  }
}
