import { tmdbService } from "@/lib/tmdb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 })
    }

    const movieId = Number.parseInt(id)

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const [movie, credits, recommendations] = await Promise.all([
      tmdbService.getMovieDetails(movieId),
      tmdbService.getMovieCredits(movieId),
      tmdbService.getMovieRecommendations(movieId),
    ])

    return NextResponse.json({
      movie,
      credits,
      recommendations,
    })
  } catch (error) {
    console.error("Error fetching movie details:", error)
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 500 })
  }
}
