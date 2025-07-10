import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import jsonwebtoken from "jsonwebtoken"

export async function POST(request: Request) {
    try {
        // Get the current session
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "No active session" }, { status: 401 })
        }

        // Create a token with session data
        const token = jsonwebtoken.sign(
            {
                userId: session.user.id,
                email: session.user.email,
                name: session.user.name,
                image: session.user.image,
                timestamp: Date.now(),
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: "5m" },
        )

        console.log("Created mobile token for user:", session.user.email)

        return NextResponse.json({ token })
    } catch (error) {
        console.error("Mobile token creation error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
