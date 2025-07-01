import { type NextRequest, NextResponse } from "next/server"
import { tmdbService } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const data = await tmdbService.searchMulti(query.trim(), 1)

    // Filter and sort results for better suggestions
    const filteredResults = data.results
      ?.filter((item: any) => {
        // Filter out adult content and items without images
        if (item.adult) return false
        if (item.media_type === "person" && !item.profile_path) return false
        if ((item.media_type === "movie" || item.media_type === "tv") && !item.poster_path) return false
        return true
      })
      ?.sort((a: any, b: any) => b.popularity - a.popularity) // Sort by popularity
      ?.slice(0, 8) // Limit to 8 suggestions

    return NextResponse.json({ results: filteredResults || [] })
  } catch (error) {
    console.error("Error fetching search suggestions:", error)
    return NextResponse.json({ results: [] })
  }
}
