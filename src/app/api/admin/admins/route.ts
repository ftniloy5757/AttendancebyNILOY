import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { readDb, writeDb } from '@/lib/db';

const MASTER_ADMINS = ['islamproloy@gmail.com', 'ftniloy5757@gmail.com'];

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;
    if (MASTER_ADMINS.includes(session.user.email)) return true;

    const db = readDb();
    if (db.admins.includes(session.user.email.toLowerCase())) return true;

    return null;
}

export async function GET(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = readDb();
    // Simulate mongodb shape so we don't have to rewrite the dashboard UI
    const mappedAdmins = db.admins.map(email => ({ email, _id: email }));

    return NextResponse.json({ admins: mappedAdmins });
}

export async function POST(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const newEmail = email.toLowerCase();
        const db = readDb();

        if (db.admins.includes(newEmail)) return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });

        db.admins.push(newEmail);
        writeDb(db);

        return NextResponse.json({ success: true, admin: { email: newEmail, _id: newEmail } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
        if (MASTER_ADMINS.includes(email)) return NextResponse.json({ error: 'Cannot remove master admin' }, { status: 400 });

        const db = readDb();
        db.admins = db.admins.filter(a => a !== email.toLowerCase());
        writeDb(db);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
