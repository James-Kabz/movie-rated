import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google"
import prisma from "./prisma";


export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile",
                }
            }
        }),
        // ...add more providers
    ],
    callbacks: {

        async redirect({url,baseUrl}) {
            if (url.startsWith("/cinetaste://")) 
                return url;
            // allow relative callback URLs
            if (url.startsWith("/"))
                return `${baseUrl}${url}`
            // allow callback urls from the same origin
            if (new URL(url).origin === baseUrl)
                return url;
            return baseUrl;
        },
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