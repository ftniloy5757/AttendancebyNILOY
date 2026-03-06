import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { readDb, writeDb } from '@/lib/db';
import { headers } from 'next/headers';
import nodemailer from 'nodemailer';

async function getClientIp() {
    const headersList = await headers();
    let realIp = headersList.get('x-real-ip') || headersList.get('x-forwarded-for') || 'Unknown';
    if (realIp.includes(',')) realIp = realIp.split(',')[0].trim();
    return realIp;
}

const MASTER_ADMINS = ['islamproloy@gmail.com', 'ftniloy5757@gmail.com', 'jannat.taposhi@bracu.ac.bd'];

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;
    if (MASTER_ADMINS.includes(session.user.email)) return session.user.email;

    const db = readDb();
    if (db.admins.includes(session.user.email.toLowerCase())) return session.user.email;

    return null;
}

export async function GET(req: Request) {
    const email = await verifyAdmin();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = readDb();
    const activeSessions = db.sessions.filter(s => s.active).sort((a, b) => b.createdAt - a.createdAt);
    const adminIp = await getClientIp();

    return NextResponse.json({ sessions: activeSessions, adminIp });
}

export async function POST(req: Request) {
    const email = await verifyAdmin();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const adminIp = await getClientIp();
        const db = readDb();

        if (body.action === 'start') {
            const newSession = {
                _id: Date.now().toString(),
                className: body.className || 'General Class',
                teacherEmail: email,
                allowedIp: adminIp,
                active: true,
                createdAt: Date.now(),
                endTime: 0,
                attendance: []
            };
            db.sessions.push(newSession);
            writeDb(db);
            return NextResponse.json({ success: true, session: newSession });
        }

        if (body.action === 'stop') {
            const sessionIndex = db.sessions.findIndex(s => s._id === body.sessionId);
            if (sessionIndex === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const session = db.sessions[sessionIndex];
            session.active = false;
            session.endTime = Date.now();

            // Generate CSV
            let csvContent = "";
            if (session.attendance.length > 0) {
                csvContent = "Student ID,Email,Section,Time,IP Address\n"
                    + session.attendance.map((e: any) => `${e.studentId},${e.email},${e.section},${new Date(e.timestamp).toLocaleTimeString()},${e.ip}`).join("\n");
            }
            writeDb(db);
            return NextResponse.json({ success: true, csv: csvContent, filename: `attendance_${session.className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv` });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
