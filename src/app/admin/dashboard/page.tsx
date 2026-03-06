"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [adminIp, setAdminIp] = useState("");
    const [sessions, setSessions] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);

    const [className, setClassName] = useState("");
    const [newAdminEmail, setNewAdminEmail] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?error=Unauthorized");
        }
        if (status === "authenticated") {
            fetchData();
            const interval = setInterval(fetchData, 10000); // 10s auto-refresh
            return () => clearInterval(interval);
        }
    }, [status, router]);

    const fetchData = async () => {
        try {
            const [sessRes, adminRes] = await Promise.all([
                fetch("/api/admin/sessions"),
                fetch("/api/admin/admins")
            ]);
            if (sessRes.ok) {
                const data = await sessRes.json();
                setSessions(data.sessions);
                setAdminIp(data.adminIp);
            }
            if (adminRes.ok) {
                const data = await adminRes.json();
                setAdmins(data.admins);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startSession = async () => {
        if (!className) return alert("Please enter a Class Name");
        await fetch("/api/admin/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start", className })
        });
        setClassName("");
        fetchData();
    };

    const stopSession = async (sessionId: string) => {
        if (!confirm("Are you sure? This will end the session and email you the CSV report.")) return;
        await fetch("/api/admin/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "stop", sessionId })
        });
        fetchData();
    };

    const addAdmin = async () => {
        if (!newAdminEmail) return;
        const res = await fetch("/api/admin/admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: newAdminEmail })
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        setNewAdminEmail("");
        fetchData();
    };

    const removeAdmin = async (email: string) => {
        if (!confirm(`Remove ${email} from admins?`)) return;
        const res = await fetch(`/api/admin/admins?email=${encodeURIComponent(email)}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) alert(data.error);
        fetchData();
    };

    if (status === "loading" || !session) return <div className="text-center p-8 text-black">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Admin Dashboard</h1>
                        <p className="text-slate-500">Logged in as <span className="font-semibold text-indigo-600">{session.user?.email}</span></p>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: '/login' })} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
                        Log out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Class Session Manager */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold border-b border-slate-100 pb-4 mb-4">Start New Session</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Course Code / Class Name</label>
                            <input
                                type="text"
                                placeholder="e.g. CSE110 Section 5"
                                value={className}
                                onChange={e => setClassName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        {adminIp && (
                            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <p className="text-sm font-medium text-indigo-800">Your Current Network IP</p>
                                <p className="text-xs text-indigo-600 mt-1">
                                    The session will be locked to this exact IP address (<strong>{adminIp}</strong>). Students must be on the same WiFi network.
                                </p>
                            </div>
                        )}
                        <div className="mt-auto pt-4">
                            <button onClick={startSession} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2">
                                Start Session & Lock IP
                            </button>
                        </div>
                    </div>

                    {/* Admin Manager */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                        <h2 className="text-xl font-bold border-b border-slate-100 pb-4 mb-4">Manage Admins</h2>
                        <div className="flex gap-2 mb-6">
                            <input
                                type="email"
                                placeholder="e.g. teacher@g.bracu.ac.bd"
                                value={newAdminEmail}
                                onChange={e => setNewAdminEmail(e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button onClick={addAdmin} className="px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-colors">
                                Add
                            </button>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Current Admins</h3>
                        <div className="overflow-y-auto max-h-48 space-y-2 pr-2">
                            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                <span className="font-medium text-sm text-slate-700">islamproloy@gmail.com</span>
                                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">MASTER</span>
                            </div>
                            {admins.map(a => (
                                <div key={a._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                    <span className="font-medium text-sm text-slate-700">{a.email}</span>
                                    <button onClick={() => removeAdmin(a.email)} className="text-red-500 hover:text-red-700 text-sm font-medium px-2">Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Active Sessions */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold border-b border-slate-100 pb-4 mb-6">Active Sessions</h2>

                    {sessions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            No active class sessions right now.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sessions.map(s => (
                                <div key={s._id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{s.className}</h3>
                                            <p className="text-sm text-slate-500">Teacher: {s.teacherEmail}</p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span> Live
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1">
                                        <p className="text-xs text-slate-500 flex justify-between">
                                            <span>Allowed IP:</span> <span className="font-mono text-slate-700">{s.allowedIp}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 flex justify-between">
                                            <span>Attendance:</span> <span className="font-bold text-indigo-600">{s.attendance?.length || 0} presents</span>
                                        </p>
                                        <p className="text-xs text-slate-500 flex justify-between">
                                            <span>Started:</span> <span className="text-slate-700">{new Date(s.createdAt).toLocaleTimeString()}</span>
                                        </p>
                                    </div>
                                    <button onClick={() => stopSession(s._id)} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors border border-red-200">
                                        Stop Session & Send Report
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

