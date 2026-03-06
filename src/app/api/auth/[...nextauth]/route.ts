import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { readDb } from "@/lib/db";

const MASTER_ADMINS = ['islamproloy@gmail.com', 'ftniloy5757@gmail.com'];

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
                    return { id: email, email };
                }

                // 2. Check if dynamically added admin
                try {
                    const db = readDb();
                    if (db.admins.includes(email)) {
                        return { id: email, email };
                    }
                } catch (err) {
                    console.error("DB lookup failed in NextAuth:", err);
                }

                // 3. Check if Bracu Student
                if (email.endsWith("@g.bracu.ac.bd")) {
                    return { id: email, email };
                }

                return null;
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development",
    pages: {
        signIn: '/login',
        error: '/login',
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
