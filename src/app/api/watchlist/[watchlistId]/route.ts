import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ watchlistId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { watchlistId } = await params

    if (!watchlistId) {
        return NextResponse.json({ error: "Watchlist ID is required" }, { status: 400 })
    }

    try {
        await prisma.watchlistItem.delete({
            where: {
                id: watchlistId,
                userId: session.user?.id
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete watchlist item" }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ watchlistId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { watchlistId } = await params

    try {
        const { watched } = await request.json()

        // Get the watchlist item first to get movie details
        const watchlistItem = await prisma.watchlistItem.findUnique({
            where: {
                id: watchlistId,
                userId: session.user.id,
            },
        })

        if (!watchlistItem) {
            return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 })
        }
        const updatedItem = await prisma.watchlistItem.update({
            where: {
                id: watchlistId,
                userId: session.user?.id
            },
            data: {
                watched,
                watchedAt: watched ? new Date() : null
            },
        })

        // If marking as watched, add to recently viewed
        if (watched) {
            try {
                await prisma.recentlyViewed.upsert({
                    where: {
                        userId_movieId_mediaType: {
                            userId: session.user.id,
                            movieId: watchlistItem.movieId,
                            mediaType: watchlistItem.mediaType,
                        },
                    },
                    update: {
                        viewedAt: new Date(),
                    },
                    create: {
                        userId: session.user.id,
                        movieId: watchlistItem.movieId,
                        mediaType: watchlistItem.mediaType,
                        movieTitle: watchlistItem.movieTitle,
                        moviePoster: watchlistItem.moviePoster,
                        movieYear: watchlistItem.movieYear,
                        rating: watchlistItem.rating || 0,
                        genre: watchlistItem.genre || "",
                    },
                })
            } catch (error) {
                console.error("Error adding to recently viewed:", error)
                // Don't fail the main request if recently viewed fails
            }
        }

        return NextResponse.json(updatedItem)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update watchlist item" }, { status: 500 })
    }
}