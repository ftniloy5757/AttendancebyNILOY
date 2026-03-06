"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
    const searchParams = useSearchParams();
    const authError = searchParams.get("error");
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await signIn("credentials", {
            redirect: false,
            email,
            callbackUrl
        });

        if (res?.error) {
            setLoading(false);
            // We use Next.js routing to reload the query string or show local error
            window.location.href = `/login?error=Access+Denied.+Invalid+Email.`;
        } else {
            window.location.href = callbackUrl;
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome</h1>
                    <p className="text-white/80 text-sm">Please sign in with your email</p>
                </div>

                {authError && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
                        <p className="text-red-100 font-medium tracking-wide">Login Failed</p>
                        <p className="text-red-200/80 text-sm mt-1">Access Denied. Ensure your email is authorized.</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-1.5 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. your_id@g.bracu.ac.bd"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-white text-indigo-900 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Continue"}
                    </button>

                    <p className="text-center text-xs text-white/60 mt-4 leading-relaxed">
                        Teachers log in with their assigned admin email.<br />
                        Students must login with their <span className="font-semibold text-white/80">@g.bracu.ac.bd</span> account.
                    </p>
                </form>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold">Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
