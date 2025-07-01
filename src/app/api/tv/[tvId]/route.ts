import { tmdbService } from "@/lib/tmdb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ tvId: string }> }) {
  try {
    const { tvId } = await params

    if (!tvId) {
      return NextResponse.json({ error: "TV show ID is required" }, { status: 400 })
    }

    const tvIdNum = Number.parseInt(tvId)
    if (isNaN(tvIdNum)) {
      return NextResponse.json({ error: "Invalid TV show ID" }, { status: 400 })
    }

    const [tv, credits, recommendations] = await Promise.all([
      tmdbService.getTVShowDetails(tvIdNum),
      tmdbService.getTVShowCredits(tvIdNum),
      tmdbService.getTVShowRecommendations(tvIdNum),
    ])

    return NextResponse.json({
      tv,
      credits,
      recommendations,
    })
  } catch (error) {
    console.error("Error fetching TV show details:", error)
    return NextResponse.json({ error: "Failed to fetch TV show details" }, { status: 500 })
  }
}
