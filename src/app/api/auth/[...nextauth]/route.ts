import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                if (profile?.email && profile.email.endsWith("@g.bracu.ac.bd")) {
                    return true; // Accept bracu domain
                }
                return "/?error=Access+Denied.+Please+use+your+@g.bracu.ac.bd+email."; // Reject others
            }
            return false;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development",
    pages: {
        error: '/', // Error code passed in query string as ?error=
    }
});

export { handler as GET, handler as POST };
