import { NextResponse } from "next/server"
import admin from "firebase-admin"
import jsonwebtoken from "jsonwebtoken"

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Handle private key newlines
      }),
    })
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error)
  }
}

export async function POST(request: Request) {
  try {
    const { firebaseIdToken } = await request.json()

    if (!firebaseIdToken) {
      return NextResponse.json({ error: "Firebase ID token required" }, { status: 400 })
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken)
    console.log("Firebase ID token verified:", decodedToken.uid)

    // Extract user information from the decoded Firebase token
    const user = {
      id: decodedToken.uid, // Use Firebase UID as internal user ID
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
      image: decodedToken.picture,
    }

    // Generate your internal JWT using NEXTAUTH_SECRET
    // This token will be used by your existing APIs (e.g., /api/watchlist)
    const internalJwt = jsonwebtoken.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        timestamp: Date.now(),
      },
      process.env.NEXTAUTH_SECRET!, // Reusing NEXTAUTH_SECRET for consistency with existing APIs
      { expiresIn: "7d" }, // Token valid for 7 days
    )

    console.log("Internal JWT generated for user:", user.email)

    return NextResponse.json({ token: internalJwt, user })
  } catch (error: any) {
    console.error("Firebase token verification or internal JWT generation error:", error)
    if (error.code === "auth/argument-error" || error.code === "auth/invalid-credential") {
      return NextResponse.json({ error: "Invalid Firebase ID token" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
