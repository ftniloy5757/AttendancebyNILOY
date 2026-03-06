"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "admin123") {
            localStorage.setItem("admin_token", "admin123");
            router.push("/admin/dashboard");
        } else {
            setError("Incorrect password");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
            <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
                <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Enter admin password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        </main>
    );
}
