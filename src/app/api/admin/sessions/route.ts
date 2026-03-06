import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Session from '@/models/Session';
import Admin from '@/models/Admin';
import { headers } from 'next/headers';
import nodemailer from 'nodemailer';

async function getClientIp() {
    const headersList = await headers();
    let realIp = headersList.get('x-real-ip') || headersList.get('x-forwarded-for') || 'Unknown';
    if (realIp.includes(',')) realIp = realIp.split(',')[0].trim();
    return realIp;
}

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;
    if (session.user.email === "islamproloy@gmail.com") return session.user.email;

    await dbConnect();
    const isAdmin = await Admin.findOne({ email: session.user.email.toLowerCase() });
    if (isAdmin) return session.user.email;

    return null;
}

export async function GET(req: Request) {
    const email = await verifyAdmin();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const sessions = await Session.find({ active: true }).sort({ createdAt: -1 });
    const adminIp = await getClientIp();

    return NextResponse.json({ sessions, adminIp });
}

export async function POST(req: Request) {
    const email = await verifyAdmin();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await dbConnect();
        const body = await req.json();
        const adminIp = await getClientIp();

        if (body.action === 'start') {
            const newSession = await Session.create({
                className: body.className || 'General Class',
                teacherEmail: email,
                allowedIp: adminIp,
                active: true,
            });
            return NextResponse.json({ success: true, session: newSession });
        }

        if (body.action === 'stop') {
            const session = await Session.findById(body.sessionId);
            if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            session.active = false;
            session.endTime = new Date();
            await session.save();

            // Generate CSV
            if (session.attendance.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const csvContent = "Student ID,Email,Section,Time,IP Address\n"
                    + session.attendance.map((e: any) => `${e.studentId},${e.email},${e.section},${new Date(e.timestamp).toLocaleTimeString()},${e.ip}`).join("\n");

                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    });

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: session.teacherEmail,
                        subject: `Attendance Report - ${session.className}`,
                        text: `Please find attached the attendance report for ${session.className}.`,
                        attachments: [
                            {
                                filename: `attendance_${session.className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
                                content: csvContent,
                            },
                        ],
                    });
                } catch (emailErr) {
                    console.error("Failed to send email:", emailErr);
                }
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
