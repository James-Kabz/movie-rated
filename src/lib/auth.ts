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
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl })

      // Only redirect to mobile callback if explicitly requested
      if (url === `${baseUrl}/auth/mobile-callback`) {
        return `${baseUrl}/auth/mobile-callback`
      }

      // Check if the callback URL parameter contains mobile-callback
      try {
        const urlObj = new URL(url)
        const callbackUrl = urlObj.searchParams.get("callbackUrl")
        if (callbackUrl && callbackUrl.includes("mobile-callback")) {
          return `${baseUrl}/auth/mobile-callback`
        }
      } catch (error) {
        console.error("Error parsing URL:", error)
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
    signIn: "/api/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
}
