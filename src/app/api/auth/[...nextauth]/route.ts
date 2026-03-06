import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    hd: "g.bracu.ac.bd",
                }
            }
        }),
        CredentialsProvider({
            name: "Email Address",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "student@g.bracu.ac.bd" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const email = credentials.email.toLowerCase();
                if (email.endsWith("@g.bracu.ac.bd")) {
                    return { id: email, email: email };
                }
                return null;
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                const email = user?.email || profile?.email;
                if (email && email.toLowerCase().endsWith("@g.bracu.ac.bd")) {
                    return true; // Accept bracu domain
                }
                return "/login?error=Access+Denied.+Please+use+your+@g.bracu.ac.bd+email."; // Reject others
            }
            if (account?.provider === "credentials") {
                return true; // Already verified in authorize
            }
            return false;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development",
    pages: {
        signIn: '/login',
        error: '/login',
    }
});

export { handler as GET, handler as POST };
