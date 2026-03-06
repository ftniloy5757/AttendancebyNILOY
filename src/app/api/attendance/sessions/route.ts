import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = readDb();
        const activeSessions = db.sessions
            .filter(s => s.active)
            .map(s => ({
                _id: s._id,
                className: s.className,
                teacherEmail: s.teacherEmail,
                allowedIp: s.allowedIp,
                createdAt: s.createdAt
            }))
            .sort((a, b) => b.createdAt - a.createdAt);

        return NextResponse.json({ sessions: activeSessions });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
