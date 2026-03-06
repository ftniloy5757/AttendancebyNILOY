"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function StudentAttendanceContent() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  // We no longer manually ask for email. We use the one from the session.
  const [studentId, setStudentId] = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string }>({ type: "idle" });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/attendance");
        const data = await res.json();
        setSessionActive(data.sessionActive);
      } catch (err) {
        setSessionActive(false);
      }
    };
    checkSession();
    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email || !studentId) return;

    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Notice we don't send email here from the form. 
        // We still send it just in case, but the server will override it securely.
        body: JSON.stringify({ studentId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: "Attendance recorded successfully!" });
        setStudentId("");
      } else {
        setStatus({ type: "error", message: data.error || "Failed to record attendance." });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error. Please try again." });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Class Attendance</h1>
          <p className="text-white/80 text-sm">Submit your attendance for today's lecture</p>
        </div>

        {authError && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
            <p className="text-red-100 font-medium tracking-wide">Login Failed</p>
            <p className="text-red-200/80 text-sm mt-1">{authError}</p>
          </div>
        )}

        {/* Not Logged In - Redirect */}
        {authStatus !== "loading" && !session && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-white/90 text-sm mb-4">
                You must login with your university email to verify your identity.
              </p>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full py-3.5 bg-white text-indigo-900 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                Go to Login Page
              </button>
            </div>
          </div>
        )}

        {/* Logged in, but no active session from Admin */}
        {session && !sessionActive && status.type !== "success" && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
            <p className="text-red-100 font-medium tracking-wide">
              No active session right now.
            </p>
            <p className="text-red-200/80 text-xs mt-1 mb-4">
              Please wait for your instructor to start the attendance timer.
            </p>
            <button onClick={() => signOut()} className="text-xs text-white/50 hover:text-white/80 underline decoration-white/30">
              Sign out ({session.user?.email})
            </button>
          </div>
        )}

        {/* Logged in AND active session */}
        {session && sessionActive && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
              <div className="overflow-hidden">
                <p className="text-xs text-white/60 mb-0.5">Logged in as</p>
                <p className="text-sm font-medium text-white truncate">{session.user?.email}</p>
              </div>
              <button type="button" onClick={() => signOut()} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                Sign out
              </button>
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-white/90 mb-1.5 ml-1">
                Student ID
              </label>
              <input
                type="text"
                id="studentId"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 20260010"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                disabled={status.type === "loading" || status.type === "success"}
              />
            </div>

            {status.type === "error" && (
              <div className="text-red-200 text-sm bg-red-500/20 px-3 py-2 rounded-lg border border-red-500/30">
                {status.message}
              </div>
            )}

            {status.type === "success" && (
              <div className="text-green-200 text-sm bg-green-500/20 px-3 py-3 rounded-xl border border-green-500/30 text-center font-medium">
                {status.message}
              </div>
            )}

            {status.type !== "success" && (
              <button
                type="submit"
                disabled={status.type === "loading"}
                className={`w-full py-3.5 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 ${status.type === "loading"
                  ? "bg-white/20 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/25 active:scale-[0.98]"
                  }`}
              >
                {status.type === "loading" ? "Submitting..." : "Mark Present"}
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default function StudentAttendance() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold">Loading...</div>}>
      <StudentAttendanceContent />
    </Suspense>
  );
}
