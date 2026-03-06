import fs from 'fs';
import path from 'path';

// In production (Vercel), we must use /tmp since the root is read-only. Data will not persist.
const isProd = process.env.NODE_ENV === 'production';
const DB_PATH = isProd ? path.join('/tmp', 'database.json') : path.join(process.cwd(), 'database.json');

export type Config = {
  sessionActive: boolean;
  endTime: number;
  allowedIpPrefix: string;
};

export type AttendanceRecord = {
  studentId: string;
  email: string;
  timestamp: number;
  ip: string;
};

export type DatabaseType = {
  config: Config;
  attendance: AttendanceRecord[];
};

const defaultDb: DatabaseType = {
  config: {
    sessionActive: false,
    endTime: 0,
    allowedIpPrefix: "192.168.1."
  },
  attendance: []
};

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
}

export function readDb(): DatabaseType {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return defaultDb;
  }
}

export function writeDb(data: DatabaseType): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}
