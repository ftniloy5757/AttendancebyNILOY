import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

const ADMIN_PASS = 'admin123';

function authenticate(req: Request) {
    const authHeader = req.headers.get('authorization');
    return authHeader === `Bearer ${ADMIN_PASS}`;
}

export async function GET(req: Request) {
    if (!authenticate(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = readDb();
    return NextResponse.json(db.config);
}

export async function POST(req: Request) {
    if (!authenticate(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const db = readDb();

        if (body.action === 'start') {
            const timeLimitMs = (body.timeLimitMins || 5) * 60 * 1000;
            db.config.sessionActive = true;
            db.config.endTime = Date.now() + timeLimitMs;
        } else if (body.action === 'stop') {
            db.config.sessionActive = false;
            db.config.endTime = 0;
        } else if (body.action === 'update_ip') {
            db.config.allowedIpPrefix = body.allowedIpPrefix || '';
        } else if (body.action === 'clear_attendance') {
            db.attendance = [];
        }

        writeDb(db);
        return NextResponse.json(db.config);
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
