import { NextResponse } from "next/server"
import jsonwebtoken from "jsonwebtoken"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const { token } = await request.json()

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 })
        }

        // Verify and decode the token
        let decoded: any
        try {
            decoded = jsonwebtoken.verify(token, process.env.NEXTAUTH_SECRET!)
        } catch (error) {
            console.error("Token verification failed:", error)
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
        }

        // Get user from database to ensure they still exist
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Return user data
        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
            },
        })
    } catch (error) {
        console.error("Mobile token verification error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
