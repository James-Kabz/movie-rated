import { type NextRequest, NextResponse } from "next/server"
import { tmdbService } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const category = searchParams.get("category") || "popular"
  const mediaType = searchParams.get("type") || "movie" // movie, tv, or multi
  const page = Number.parseInt(searchParams.get("page") || "1")

  try {
    let data

    if (query) {
      // Multi-search for movies, TV shows, and people
      if (mediaType === "multi") {
        data = await tmdbService.searchMulti(query, page)
      } else if (mediaType === "tv") {
        data = await tmdbService.searchTVShows(query, page)
      } else {
        data = await tmdbService.searchMovies(query, page)
      }
    } else {
      // Category-based fetching
      if (mediaType === "tv") {
        switch (category) {
          case "top_rated":
            data = await tmdbService.getTopRatedTVShows(page)
            break
          case "popular":
          default:
            data = await tmdbService.getPopularTVShows(page)
            break
        }
      } else {
        // Movies
        switch (category) {
          case "top_rated":
            data = await tmdbService.getTopRatedMovies(page)
            break
          case "now_playing":
            data = await tmdbService.getNowPlayingMovies(page)
            break
          case "upcoming":
            data = await tmdbService.getUpcomingMovies(page)
            break
          default:
            data = await tmdbService.getPopularMovies(page)
        }
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}
