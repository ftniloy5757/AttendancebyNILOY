import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { headers } from 'next/headers';
import nodemailer from 'nodemailer';

const ADMIN_PASS = 'admin123';

function authenticate(req: Request) {
    const authHeader = req.headers.get('authorization');
    return authHeader === `Bearer ${ADMIN_PASS}`;
}

async function getClientIp() {
    const headersList = await headers();
    let realIp = headersList.get('x-real-ip') || headersList.get('x-forwarded-for') || 'Unknown';
    if (realIp.includes(',')) realIp = realIp.split(',')[0].trim();
    return realIp;
}

export async function GET(req: Request) {
    if (!authenticate(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = readDb();
    const adminIp = await getClientIp();
    return NextResponse.json({ ...db.config, adminIp });
}

export async function POST(req: Request) {
    if (!authenticate(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const db = readDb();
        const adminIp = await getClientIp();

        if (body.action === 'start') {
            const timeLimitMs = (body.timeLimitMins || 5) * 60 * 1000;
            db.config.sessionActive = true;
            db.config.endTime = Date.now() + timeLimitMs;
        } else if (body.action === 'stop') {
            db.config.sessionActive = false;
            db.config.endTime = 0;

            // Generate CSV
            if (db.attendance.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const csvContent = "Student ID,Email,Time,IP Address\n"
                    + db.attendance.map(e => `${e.studentId},${e.email},${new Date(e.timestamp).toLocaleTimeString()},${e.ip}`).join("\n");

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
                        to: body.adminEmail || process.env.EMAIL_USER, // Try to send to provided email or fallback to sender
                        subject: 'Attendance Report CSV',
                        text: 'Please find attached the latest attendance report.',
                        attachments: [
                            {
                                filename: `attendance_${new Date().toISOString().split('T')[0]}.csv`,
                                content: csvContent,
                            },
                        ],
                    });
                    console.log("Email sent successfully.");
                } catch (emailErr) {
                    console.error("Failed to send email:", emailErr);
                }
            }
        } else if (body.action === 'update_ip') {
            db.config.allowedIpPrefix = body.allowedIpPrefix || '';
        } else if (body.action === 'clear_attendance') {
            db.attendance = [];
        }

        writeDb(db);
        return NextResponse.json({ ...db.config, adminIp });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
