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
          prompt: "select_account", // Added to allow account switching
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl })

      // Check if this is a mobile callback request
      if (url.includes("mobile-callback") || url.includes("auth-callxqback")) {
        return `${baseUrl}/auth/mobile-callback`
      }

      // Handle custom scheme URLs (deep links) by redirecting to mobile callback
      if (url.startsWith("cinetaste://")) {
        console.log("Custom scheme detected, redirecting to mobile callback")
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
    signIn: "/api/auth/signin",
    error: "/auth/error", // Added to help with account switching
  },
  debug: process.env.NODE_ENV === "development",
}
