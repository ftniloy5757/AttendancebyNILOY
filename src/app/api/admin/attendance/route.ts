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
    return NextResponse.json(db.attendance);
}

export async function DELETE(req: Request) {
    if (!authenticate(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });

        const db = readDb();
        db.attendance = db.attendance.filter(r => r.studentId !== studentId);
        writeDb(db);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
