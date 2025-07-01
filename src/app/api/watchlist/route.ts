import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendWatchListEmail } from "@/lib/email"
import { tmdbService } from "@/lib/tmdb"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
    })

    return NextResponse.json(watchlist)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
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
          userId: session.user.id,
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
        userId: session.user.id,
        movieId: movieId,
        mediaType: mediaType,
        movieTitle: title,
        moviePoster: tmdbService.getImageUrl(posterPath),
        movieYear: releaseDate?.split("-")[0] || "",
        rating: contentDetails.vote_average || 0,
        genre: genres[0]?.name || "",
      },
    })

    // Send email if requested
    if (sendEmail && session.user.email && session.user.name) {
      await sendWatchListEmail(session.user.email, session.user.name, title, tmdbService.getImageUrl(posterPath))
    }

    return NextResponse.json(watchlistItem)
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 })
  }
}
