import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(request: Request, {params} : {params: Promise<{watchlistId: string}>}) {
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

        return NextResponse.json({ success: true})
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete watchlist item" }, { status: 500 })
    }
}

export async function PUT(request: Request, {params} : {params: Promise<{watchlistId: string}>}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { watchlistId } = await params

    try {
        const { watched } = await request.json()

        const watchlistItem = await prisma.watchlistItem.update({
            where: {
                id: watchlistId,
                userId: session.user?.id
            },
            data: { 
                watched,
                watchedAt: watched ? new Date() : null
            },
        })

        return NextResponse.json(watchlistItem)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update watchlist item" }, { status: 500 })
    }
}