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
    ],
    callbacks: {
        async redirect({ url, baseUrl }) {
            console.log('Redirect callback:', { url, baseUrl });
            
            // Handle your app's deep links
            if (url.startsWith("cinetaste://")) {
                return url;
            }
            
            // Handle Expo development URLs
            if (url.startsWith("exp://")) {
                // Convert to your app's deep link with success indicator
                return `cinetaste://auth-callback?success=true`;
            }
            
            // Allow relative callback URLs
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            
            // Allow callback URLs from the same origin
            if (new URL(url).origin === baseUrl) {
                return url;
            }
            
            // Default fallback
            return baseUrl;
        },
        session: async ({ session, token }) => {
            if (session.user) {
                session.user.id = token.sub!;
            }
            return session;
        },
        jwt: async ({ user, token }) => {
            if (user) {
                token.uid = user.id;
            }
            return token;
        },
    },
    session: {
        strategy: "jwt"
    },
    debug: process.env.NODE_ENV === 'development',
}