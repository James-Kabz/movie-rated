import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import jsonwebtoken from "jsonwebtoken"

export async function POST(request: Request) {
    try {
        // Get the request body as text first for debugging
        const requestBody = await request.text()
        console.log("Raw request body:", requestBody)

        // Check if body is empty
        if (!requestBody || requestBody.trim() === "") {
            return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
        }

        let jsonData
        try {
            jsonData = JSON.parse(requestBody)
        } catch (parseError: unknown) {
            const syntaxError = parseError as SyntaxError;
            console.error("JSON parse error:", syntaxError)
            console.error("Request body that failed to parse:", requestBody)
            return NextResponse.json(
                {
                    error: "Invalid JSON format",
                    details: syntaxError.message,
                    receivedBody: requestBody,
                },
                { status: 400 },
            )
        }

        const { token } = jsonData

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 })
        }

        // Verify the temporary token
        try {
            jsonwebtoken.verify(token, process.env.NEXTAUTH_SECRET!)
            console.log("Token verified successfully")
        } catch (error) {
            console.error("Token verification failed:", error)
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
        }

        // Get the current session
        const session = await getServerSession(authOptions)
        console.log("Retrieved session:", session)

        if (!session) {
            return NextResponse.json({ error: "No session found" }, { status: 401 })
        }

        return NextResponse.json(session)
    } catch (error) {
        console.error("Mobile session API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Add a GET method for testing
export async function GET() {
    return NextResponse.json({
        message: "Mobile session endpoint is working",
        timestamp: new Date().toISOString(),
    })
}
