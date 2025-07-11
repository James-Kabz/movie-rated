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

      // Always redirect mobile auth to the mobile callback page
      if (url.includes("mobile-callback") || url.includes("auth-callback")) {
        return `${baseUrl}/auth/mobile-callback`
      }

      // For any callback URL, redirect to mobile callback for mobile users
      if (url.includes("callbackUrl") && url.includes("mobile-callback")) {
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
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
}
