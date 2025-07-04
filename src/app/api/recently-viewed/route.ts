import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { tmdbService } from "@/lib/tmdb"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId: session.user.id },
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

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { movieId, mediaType = "movie" } = await request.json()

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

    // Upsert recently viewed item (update viewedAt if exists, create if not)
    const recentlyViewedItem = await prisma.recentlyViewed.upsert({
      where: {
        userId_movieId_mediaType: {
          userId: session.user.id,
          movieId: movieId,
          mediaType: mediaType,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
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

    return NextResponse.json(recentlyViewedItem)
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
