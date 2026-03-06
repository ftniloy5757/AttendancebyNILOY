"use client";

import { useState, useEffect } from "react";

export default function StudentAttendance() {
  const [email, setEmail] = useState("");
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
    if (!email || !studentId) return;

    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, studentId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: "Attendance recorded successfully!" });
        setEmail("");
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

        {!sessionActive && status.type !== "success" ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
            <p className="text-red-100 font-medium tracking-wide">
              No active session right now.
            </p>
            <p className="text-red-200/80 text-xs mt-1">
              Please wait for your instructor to start the attendance timer.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1.5 ml-1">
                University Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                disabled={status.type === "loading" || status.type === "success"}
              />
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
