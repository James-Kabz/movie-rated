
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "./prisma"
import jsonwebtoken from 'jsonwebtoken';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl })

      // Handle your app's deep links
      if (url.startsWith("cinetaste://")) {
        return url
      }

      // Handle Expo development URLs - convert to deep link with session data
      if (url.startsWith("exp://")) {
        // Create a temporary token for mobile session
        const token = jsonwebtoken.sign({ timestamp: Date.now() }, process.env.NEXTAUTH_SECRET!, { expiresIn: "5m" })
    
        return `cinetaste://auth-callback?success=true&token=${token}`

      }

      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }

      // Allow callback URLs from the same origin
      if (new URL(url).origin === baseUrl) {
        return url
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
  debug: process.env.NODE_ENV === "development",
}
