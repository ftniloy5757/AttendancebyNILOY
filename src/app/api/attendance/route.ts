import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    try {
        const db = readDb();

        // 1. Session check
        if (!db.config.sessionActive || Date.now() > db.config.endTime) {
            // Auto-stop if expired
            if (db.config.sessionActive && Date.now() > db.config.endTime) {
                db.config.sessionActive = false;
                writeDb(db);
            }
            return NextResponse.json({ error: 'No active attendance session.' }, { status: 403 });
        }

        // 2. IP check
        const headersList = await headers();
        const realIp = headersList.get('x-real-ip') || 'Unknown';
        const allowedPrefix = db.config.allowedIpPrefix.trim();

        if (allowedPrefix && !realIp.startsWith(allowedPrefix)) {
            return NextResponse.json({ error: 'You are not on the classroom network (IP Mismatch).' }, { status: 403 });
        }

        const { studentId, email } = await req.json();

        if (!studentId || !email) {
            return NextResponse.json({ error: 'Student ID and Email are required.' }, { status: 400 });
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
    // We can let students see if a session is currently active
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
