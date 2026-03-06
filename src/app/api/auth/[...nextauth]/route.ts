import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { readDb } from "@/lib/db";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                const email = (user?.email || profile?.email || "").toLowerCase();

                // Allow master admin instantly
                if (email === "islamproloy@gmail.com") return true;

                try {
                    const db = readDb();
                    if (db.admins.includes(email)) return true;
                } catch (err) {
                    console.error("DB lookup failed in NextAuth:", err);
                }

                // If not admin, check if valid student account
                if (email.endsWith("@g.bracu.ac.bd")) {
                    return true;
                }

                return "/login?error=Access+Denied.+Only+BRACU+or+Admin+emails+allowed.";
            }
            return false;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development",
    pages: {
        signIn: '/login',
        error: '/login',
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
