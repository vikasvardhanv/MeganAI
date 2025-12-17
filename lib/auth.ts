import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            plan: string
            credits: number
        }
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db) as any,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",

        error: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null
                    }

                    const user = await db.user.findUnique({
                        where: { email: credentials.email },
                    })

                    if (!user || !user.password) {
                        return null
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password)

                    if (!isValid) {
                        return null
                    }

                    return user
                } catch (e) {
                    console.error("Auth error:", e)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (trigger === "update" && session?.user) {
                return { ...token, ...session.user }
            }

            if (user) {
                token.id = user.id
                // @ts-ignore - user type from prisma
                token.plan = user.plan
                // @ts-ignore
                token.credits = user.credits
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.plan = token.plan as string
                session.user.credits = token.credits as number
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
