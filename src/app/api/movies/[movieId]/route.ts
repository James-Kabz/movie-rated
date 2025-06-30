import { tmdbService } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET (request: NextRequest, {params} : {params: Promise<{movieId: string}>}) {
    try {
        const { movieId }= await params

        if (!movieId) {
            return new Response("Movie ID is required", { status: 400 })
        }

        const [movieDetails, credits, recommendations] = await Promise.all([
            tmdbService.getMovieDetails(Number.parseInt(movieId)),
            tmdbService.getMovieCredits(Number.parseInt(movieId)),
            tmdbService.getMovieRecommendations(Number.parseInt(movieId))
        ]);

        return NextResponse.json({
            movieDetails,
            credits,
            recommendations
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

}