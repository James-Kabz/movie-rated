import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account", // Re-enabled for account switching
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl })

      // Check if the URL is exactly the mobile callback page, or if the callbackUrl parameter points to it.
      // This is more precise than just `includes` to prevent unintended loops.
      const isMobileCallbackTarget = url === `${baseUrl}/auth/mobile-callback`
      let isMobileCallbackParam = false
      try {
        const urlObj = new URL(url)
        const callbackParam = urlObj.searchParams.get("callbackUrl")
        if (callbackParam && callbackParam === `${baseUrl}/auth/mobile-callback`) {
          isMobileCallbackParam = true
        }
      } catch (e) {
        console.error("Error parsing URL in redirect callback:", e)
      }

      if (isMobileCallbackTarget || isMobileCallbackParam) {
        return `${baseUrl}/auth/mobile-callback`
      }

      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }

      // Allow callback URLs from the same origin
      try {
        if (new URL(url).origin === baseUrl) {
          return url
        }
      } catch (error) {
        console.error("Error parsing URL:", error)
      }

      // Default fallback
      return baseUrl
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },

    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    // signIn: "/api/auth/signin", // Removed as it's not explicitly needed for the mobile flow
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
}
