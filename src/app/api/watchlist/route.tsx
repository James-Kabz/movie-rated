import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWatchListEmail } from "@/lib/email";
import { tmdbService } from "@/lib/tmdb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const watchList = await prisma.watchlistItem.findMany({
            where: { userId: session.user?.id},
            orderBy: { addedAt: "desc" }
        })

        return NextResponse.json(watchList)
    } catch (error) {
        return NextResponse.json({ error: "Failed To Fetch Watchlist" }, { status: 500 })
    }
}


export async function POST (request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { movieId ,sendmail } = await request.json();

        // get movie details from tmdb
        const movieDetails = await tmdbService.getMovieDetails(Number.parseInt(movieId))

        // check if movie is in watchlist
        const existing = await prisma.watchlistItem.findUnique({
            where: {
                userId_movieId: {
                    userId: session.user?.id,
                    movieId: movieId
                },
            },
        })

        if (existing) {
            return NextResponse.json({ error: "Movie already in watchlist" }, { status: 400 })
        }

        // add movie to watchlist

        const watchlistItem = await prisma.watchlistItem.create({
            data: {
                userId: session.user?.id,
                movieId: movieId,
                movieTitle: movieDetails.title,
                moviePoster: tmdbService.getImageUrl(movieDetails.poster_path),
                movieYear: movieDetails.release_date?.split("-")[0] || "",
                rating: movieDetails.vote_average,
                genre: movieDetails.genres[0]?.name || "",
                addedAt: new Date()
            },
        })

        // send email if requested
        if (sendmail && session.user.email && session.user.name) {
            await sendWatchListEmail(
                session.user.email,
                session.user.name,
                movieDetails.title,
                tmdbService.getImageUrl(movieDetails.poster_path),
            )
        }

        return NextResponse.json(watchlistItem)
    } catch (error) {
        console.error("Error adding to watch list",error);
        return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
    }

}