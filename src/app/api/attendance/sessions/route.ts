import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Session from '@/models/Session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        // Fetch only active sessions
        const sessions = await Session.find({ active: true }, 'className teacherEmail allowedIp createdAt').sort({ createdAt: -1 });
        return NextResponse.json({ sessions });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
