import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import jsonwebtoken from "jsonwebtoken"

export async function DELETE(request: Request, { params }: { params: Promise<{ watchlistId: string }> }) {
    const session = await getServerSession(authOptions);
    let userId: string | null = session?.user?.id || null

    if (!userId) {
        const authHeader = request.headers.get("authorization")
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.substring(7)

            try {
                const decoded = jsonwebtoken.verify(token, process.env.NEXTAUTH_SECRET!) as any
                userId = decoded.userId
                console.log("Mobile auth successful for user:", decoded.email)
            } catch (error) {
                console.error("Mobile token verification failed:", error)
                return NextResponse.json({ error: "Invalid token" }, { status: 401 })
            }
        }
    }

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
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
    let userId: string | null = session?.user?.id || null

    // If no NextAuth session, try mobile token
    if (!userId) {
        const authHeader = request.headers.get("authorization")
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.substring(7)

            try {
                const decoded = jsonwebtoken.verify(token, process.env.NEXTAUTH_SECRET!) as any
                userId = decoded.userId
                // userEmail = decoded.email
                // userName = decoded.name
                console.log("Mobile auth successful for user:", decoded.email)
            } catch (error) {
                console.error("Mobile token verification failed:", error)
                return NextResponse.json({ error: "Invalid token" }, { status: 401 })
            }
        }
    }

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const { watchlistId } = await params

    try {
        const { watched } = await request.json()

        // Get the watchlist item first to get movie details
        const watchlistItem = await prisma.watchlistItem.findUnique({
            where: {
                id: watchlistId,
                userId,
            },
        })

        if (!watchlistItem) {
            return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 })
        }
        const updatedItem = await prisma.watchlistItem.update({
            where: {
                id: watchlistId,
                userId
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
                            userId,
                            movieId: watchlistItem.movieId,
                            mediaType: watchlistItem.mediaType,
                        },
                    },
                    update: {
                        viewedAt: new Date(),
                    },
                    create: {
                        userId,
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