"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Config = { sessionActive: boolean; endTime: number; allowedIpPrefix: string };
type Attendance = { studentId: string; email: string; timestamp: number; ip: string };

export default function AdminDashboard() {
    const [config, setConfig] = useState<Config | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [timerMins, setTimerMins] = useState(5);
    const [ipPrefix, setIpPrefix] = useState("");
    const router = useRouter();

    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/admin/login");
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 5000); // Auto refresh
        return () => clearInterval(interval);
    }, [token, router]);

    const fetchData = async () => {
        const opts = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const [confRes, attRes] = await Promise.all([
                fetch("/api/admin/config", opts),
                fetch("/api/admin/attendance", opts),
            ]);
            if (confRes.status === 401 || attRes.status === 401) {
                localStorage.removeItem("admin_token");
                router.push("/admin/login");
                return;
            }
            setConfig(await confRes.json());
            setAttendance(await attRes.json());
        } catch (e) {
            console.error(e);
        }
    };

    const updateConfig = async (action: string, payload: any = {}) => {
        await fetch("/api/admin/config", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action, ...payload }),
        });
        fetchData();
    };

    const deleteRecord = async (studentId: string) => {
        if (confirm("Remove this record?")) {
            await fetch(`/api/admin/attendance?studentId=${studentId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchData();
        }
    };

    const exportCSV = () => {
        if (attendance.length === 0) return;
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Student ID,Email,Time,IP Address\n"
            + attendance.map(e => `${e.studentId},${e.email},${new Date(e.timestamp).toLocaleTimeString()},${e.ip}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (!config) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Admin Dashboard</h1>
                        <p className="text-slate-500">Manage local network attendance</p>
                    </div>
                    <button onClick={() => { localStorage.removeItem("admin_token"); router.push("/admin/login"); }} className="text-sm font-medium text-slate-500 hover:text-slate-800">
                        Log out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Card 1: Session Control */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 col-span-1 md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4">Session Control</h2>
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Duration (minutes)</label>
                                <input type="number" value={timerMins} onChange={e => setTimerMins(parseInt(e.target.value) || 1)} disabled={config.sessionActive} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 mb-2">Status</p>
                                {config.sessionActive ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        Active (Ends {new Date(config.endTime).toLocaleTimeString()})
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            <div>
                                {!config.sessionActive ? (
                                    <button onClick={() => updateConfig("start", { timeLimitMins: timerMins })} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                                        Start Session
                                    </button>
                                ) : (
                                    <button onClick={() => updateConfig("stop")} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                                        Stop Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 col-span-1">
                        <h2 className="text-lg font-semibold mb-4">Network Config</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Allowed IP Prefix</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="192.168.1." value={ipPrefix || config.allowedIpPrefix} onChange={e => setIpPrefix(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                <button onClick={() => updateConfig("update_ip", { allowedIpPrefix: ipPrefix || config.allowedIpPrefix })} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium">Save</button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Example: <code>192.168.1.</code> matches all IPs starting with it.</p>
                        </div>
                    </div>

                </div>

                {/* Table List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Attendance List ({attendance.length} students)</h2>
                        <div className="space-x-3">
                            <button onClick={() => updateConfig("clear_attendance")} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors">Clear All</button>
                            <button onClick={exportCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">Export CSV</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm">
                                    <th className="p-4 font-medium border-b border-slate-200">Student ID</th>
                                    <th className="p-4 font-medium border-b border-slate-200">Email</th>
                                    <th className="p-4 font-medium border-b border-slate-200">Time</th>
                                    <th className="p-4 font-medium border-b border-slate-200">IP Address</th>
                                    <th className="p-4 font-medium border-b border-slate-200">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 border-b border-slate-100">No attendance recorded yet.</td>
                                    </tr>
                                ) : (
                                    attendance.map(a => (
                                        <tr key={a.studentId} className="hover:bg-slate-50 border-b border-slate-100">
                                            <td className="p-4 font-medium text-slate-800">{a.studentId}</td>
                                            <td className="p-4 text-slate-600">{a.email}</td>
                                            <td className="p-4 text-slate-600">{new Date(a.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-4 text-slate-600">{a.ip}</td>
                                            <td className="p-4">
                                                <button onClick={() => deleteRecord(a.studentId)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
