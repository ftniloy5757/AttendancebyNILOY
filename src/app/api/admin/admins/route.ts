import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Admin from '@/models/Admin';

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;
    if (session.user.email === "islamproloy@gmail.com") return true;

    await dbConnect();
    const isAdmin = await Admin.findOne({ email: session.user.email.toLowerCase() });
    if (isAdmin) return true;

    return null;
}

export async function GET(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const admins = await Admin.find().sort({ addedAt: -1 });
    return NextResponse.json({ admins });
}

export async function POST(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await dbConnect();
        const { email } = await req.json();

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const newAdmin = await Admin.create({ email: email.toLowerCase() });
        return NextResponse.json({ success: true, admin: newAdmin });
    } catch (error: any) {
        if (error.code === 11000) return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
        if (email === 'islamproloy@gmail.com') return NextResponse.json({ error: 'Cannot remove master admin' }, { status: 400 });

        await dbConnect();
        await Admin.findOneAndDelete({ email: email.toLowerCase() });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
