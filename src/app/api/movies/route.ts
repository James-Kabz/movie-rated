import { type NextRequest, NextResponse } from "next/server"
import { tmdbService } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const category = searchParams.get("category") || "popular"
  const page = Number.parseInt(searchParams.get("page") || "1")

  try {
    let movies

    if (query) {
      movies = await tmdbService.searchMovies(query, page)
    } else {
      switch (category) {
        case "top_rated":
          movies = await tmdbService.getTopRatedMovies(page)
          break
        case "now_playing":
          movies = await tmdbService.getNowPlayingMovies(page)
          break
        case "upcoming":
          movies = await tmdbService.getUpcomingMovies(page)
          break
        default:
          movies = await tmdbService.getPopularMovies(page)
      }
    }

    return NextResponse.json(movies)
  } catch (error) {
    console.error("Error fetching movies:", error)
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 })
  }
}
