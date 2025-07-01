import { tmdbService } from "@/lib/tmdb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const { personId } = await params

    if (!personId) {
      return NextResponse.json({ error: "Person ID is required" }, { status: 400 })
    }

    const personIdNum = Number.parseInt(personId)
    if (isNaN(personIdNum)) {
      return NextResponse.json({ error: "Invalid person ID" }, { status: 400 })
    }

    const [person, movieCredits, tvCredits] = await Promise.all([
      tmdbService.getPersonDetails(personIdNum),
      tmdbService.getPersonMovieCredits(personIdNum),
      tmdbService.getPersonTVCredits(personIdNum),
    ])

    return NextResponse.json({
      person,
      movieCredits,
      tvCredits,
    })
  } catch (error) {
    console.error("Error fetching person details:", error)
    return NextResponse.json({ error: "Failed to fetch person details" }, { status: 500 })
  }
}
