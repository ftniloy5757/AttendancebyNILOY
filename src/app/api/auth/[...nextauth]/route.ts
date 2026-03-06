import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { readDb } from "@/lib/db";

const MASTER_ADMINS = ['islamproloy@gmail.com', 'ftniloy5757@gmail.com', 'jannat.taposhi@bracu.ac.bd'];

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "your.email@g.bracu.ac.bd" }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;
                const email = credentials.email.toLowerCase().trim();

                // 1. Check if Master Admin
                if (MASTER_ADMINS.includes(email)) {
                    return { id: email, email, role: 'admin' };
                }

                // 2. Check if dynamically added admin
                try {
                    const db = readDb();
                    if (db.admins.includes(email)) {
                        return { id: email, email, role: 'admin' };
                    }
                } catch (err) {
                    console.error("DB lookup failed in NextAuth:", err);
                }

                // 3. Check if Bracu Student
                if (email.endsWith("@g.bracu.ac.bd")) {
                    return { id: email, email, role: 'student' };
                }

                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                // @ts-ignore
                session.user.role = token.role;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development",
    pages: {
        signIn: '/login',
        error: '/login',
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
