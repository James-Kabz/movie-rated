import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google"
import prisma from "./db";


export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }),
        // ...add more providers
    ],
    callbacks: {
        session: async ({ session, token }) => {
            if (session.user) {
                session.user.id = token.sub!
            }
            return session
        },
        jwt: async ({ user ,token }) => {
            if (user) {
                token.uid = user.id
            }
            return token
        },
    },
    session: {
        strategy: "jwt"
    }
}