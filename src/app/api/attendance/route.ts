import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized: You must be logged in with your varsity account.' }, { status: 401 });
        }

        const email = session.user.email; // Extracted safely from the server

        if (!email.endsWith("@g.bracu.ac.bd")) {
            return NextResponse.json({ error: 'Unauthorized: Only @g.bracu.ac.bd accounts allowed.' }, { status: 403 });
        }

        const db = readDb();

        // 1. Session check
        if (!db.config.sessionActive || Date.now() > db.config.endTime) {
            if (db.config.sessionActive && Date.now() > db.config.endTime) {
                db.config.sessionActive = false;
                writeDb(db);
            }
            return NextResponse.json({ error: 'No active attendance session.' }, { status: 403 });
        }

        // 2. IP check
        const headersList = await headers();
        let realIp = headersList.get('x-real-ip') || headersList.get('x-forwarded-for') || 'Unknown';
        if (realIp.includes(',')) realIp = realIp.split(',')[0].trim();

        const allowedPrefix = db.config.allowedIpPrefix.trim();

        if (allowedPrefix && !realIp.startsWith(allowedPrefix)) {
            return NextResponse.json({ error: 'You are not on the classroom network (IP Mismatch).' }, { status: 403 });
        }

        const { studentId } = await req.json();

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
        }

        // 3. Duplicate check
        const existing = db.attendance.find(r => r.studentId === studentId || r.email === email);
        if (existing) {
            return NextResponse.json({ error: 'Attendance already recorded.' }, { status: 409 });
        }

        // 4. Save record
        db.attendance.push({
            studentId,
            email,
            timestamp: Date.now(),
            ip: realIp
        });

        writeDb(db);

        return NextResponse.json({ success: true, message: 'Attendance recorded successfully!' });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    const db = readDb();
    let status = "Inactive";
    if (db.config.sessionActive) {
        if (Date.now() <= db.config.endTime) {
            status = "Active";
        } else {
            status = "Expired";
        }
    }

    return NextResponse.json({
        sessionActive: status === "Active",
        endTime: db.config.endTime
    });
}
