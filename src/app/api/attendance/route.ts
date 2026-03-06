import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Session from '@/models/Session';

export async function POST(req: Request) {
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession || !authSession.user?.email) {
            return NextResponse.json({ error: 'Unauthorized: You must be logged in with your varsity account.' }, { status: 401 });
        }

        const email = authSession.user.email.toLowerCase();

        if (!email.endsWith("@g.bracu.ac.bd")) {
            return NextResponse.json({ error: 'Unauthorized: Only @g.bracu.ac.bd accounts allowed.' }, { status: 403 });
        }

        const { studentId, section, sessionId } = await req.json();

        if (!studentId || !section || !sessionId) {
            return NextResponse.json({ error: 'Student ID, Section, and Session are required.' }, { status: 400 });
        }

        await dbConnect();
        const session = await Session.findById(sessionId);

        if (!session || !session.active) {
            return NextResponse.json({ error: 'This attendance session is no longer active.' }, { status: 403 });
        }

        // 2. Exact IP Lock Check
        const headersList = await headers();
        let realIp = headersList.get('x-real-ip') || headersList.get('x-forwarded-for') || 'Unknown';
        if (realIp.includes(',')) realIp = realIp.split(',')[0].trim();

        if (session.allowedIp && realIp !== session.allowedIp) {
            return NextResponse.json({ error: `Network IP Mismatch. You must be on the exact same network as the instructor. (Your IP: ${realIp})` }, { status: 403 });
        }

        // 3. Duplicate check within this specific session
        const alreadySubmitted = session.attendance.some(
            (r: any) => r.studentId === studentId || r.email === email
        );

        if (alreadySubmitted) {
            return NextResponse.json({ error: 'Attendance already recorded for this session.' }, { status: 409 });
        }

        // 4. Save record
        session.attendance.push({
            studentId,
            email,
            section,
            ip: realIp,
            timestamp: new Date()
        });

        await session.save();

        return NextResponse.json({ success: true, message: 'Attendance recorded successfully!' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
