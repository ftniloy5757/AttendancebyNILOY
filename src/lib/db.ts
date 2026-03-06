import fs from 'fs';
import path from 'path';

// Store in /tmp for Vercel, though it will reset on cold starts.
const DB_PATH = process.env.NODE_ENV === 'production'
    ? '/tmp/database.json'
    : path.resolve(process.cwd(), 'database.json');

type Session = {
    _id: string; // use string id (e.g., Date.now().toString())
    className: string;
    teacherEmail: string;
    allowedIp: string;
    active: boolean;
    createdAt: number;
    endTime: number;
    attendance: {
        studentId: string;
        email: string;
        section: string;
        ip: string;
        timestamp: number;
    }[];
};

type DbSchema = {
    admins: string[];
    sessions: Session[];
};

const defaultDb: DbSchema = {
    admins: ['islamproloy@gmail.com'],
    sessions: []
};

export function readDb(): DbSchema {
    if (!fs.existsSync(DB_PATH)) {
        writeDb(defaultDb);
        return defaultDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export function writeDb(data: DbSchema) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Helper to quickly populate default state if needed
export function checkInit() {
    readDb();
}
