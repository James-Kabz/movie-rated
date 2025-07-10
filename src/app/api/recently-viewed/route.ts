import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { tmdbService } from "@/lib/tmdb"
import prisma from "@/lib/prisma"
import jsonwebtoken from "jsonwebtoken"

export async function GET(request: NextRequest) {
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
    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 20, // Limit to last 20 items
    })

    return NextResponse.json(recentlyViewed)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recently viewed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
        // userEmail = decoded.email
        // userName = decoded.name
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
    const { movieId, mediaType = "movie", fromWatchlist = false } = await request.json()

    // Validate mediaType
    if (!["movie", "tv"].includes(mediaType)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 })
    }

    // If this is from watchlist (marking as watched), we need the content details
    let contentDetails: any
    let title: string
    let posterPath: string | null
    let releaseDate: string
    let genres: any[]

    if (fromWatchlist) {
      // Get content details from TMDB based on media type
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

      // Upsert recently viewed item (update viewedAt if exists, create if not)
      const recentlyViewedItem = await prisma.recentlyViewed.upsert({
        where: {
          userId_movieId_mediaType: {
            userId,
            movieId: movieId,
            mediaType: mediaType,
          },
        },
        update: {
          viewedAt: new Date(),
        },
        create: {
          userId,
          movieId: movieId,
          mediaType: mediaType,
          movieTitle: title,
          moviePoster: tmdbService.getImageUrl(posterPath),
          movieYear: releaseDate?.split("-")[0] || "",
          rating: contentDetails.vote_average || 0,
          genre: genres[0]?.name || "",
        },
      })

      return NextResponse.json(recentlyViewedItem)
    } else {
      // This is just a page view, only track if we don't already have it
      const existing = await prisma.recentlyViewed.findUnique({
        where: {
          userId_movieId_mediaType: {
            userId,
            movieId: movieId,
            mediaType: mediaType,
          },
        },
      })

      if (existing) {
        // Just update the viewed time
        const updated = await prisma.recentlyViewed.update({
          where: { id: existing.id },
          data: { viewedAt: new Date() },
        })
        return NextResponse.json(updated)
      }

      // Get content details for new entry
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

      // Create new recently viewed item
      const recentlyViewedItem = await prisma.recentlyViewed.create({
        data: {
          userId ,
          movieId: movieId,
          mediaType: mediaType,
          movieTitle: title,
          moviePoster: tmdbService.getImageUrl(posterPath),
          movieYear: releaseDate?.split("-")[0] || "",
          rating: contentDetails.vote_average || 0,
          genre: genres[0]?.name || "",
        },
      })

      return NextResponse.json(recentlyViewedItem)
    }
  } catch (error) {
    console.error("Error adding to recently viewed:", error)
    return NextResponse.json({ error: "Failed to add to recently viewed" }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.recentlyViewed.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear recently viewed" }, { status: 500 })
  }
}
