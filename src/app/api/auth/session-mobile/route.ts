import { NextResponse } from "next/server"
import jsonwebtoken from "jsonwebtoken"

export async function POST(request: Request) {
    try {
        console.log("Mobile session API called")

        const requestBody = await request.text()
        console.log("Raw request body:", requestBody)

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

        // Verify and decode the token
        let decoded: any
        try {
            decoded = jsonwebtoken.verify(token, process.env.NEXTAUTH_SECRET!)
            console.log("Token verified successfully")
        } catch (error) {
            console.error("Token verification failed:", error)
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
        }

        // Return session data from the token
        const session = {
            user: {
                id: decoded.userId,
                name: decoded.name,
                email: decoded.email,
                image: decoded.image,
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        }

        console.log("Returning session for user:", decoded.email)
        return NextResponse.json(session)
    } catch (error) {
        console.error("Mobile session API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Mobile session endpoint is working",
        timestamp: new Date().toISOString(),
    })
}
