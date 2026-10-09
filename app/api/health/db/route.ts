import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  try {
    await connectDB();
    const duration = Date.now() - start;
    const isReady = mongoose.connection.readyState === 1;
    const dbName = mongoose.connection.db?.databaseName;
    const usersCol = mongoose.connection.db?.collection('users');
    const userCount = await usersCol?.countDocuments().catch(() => -1);

    return NextResponse.json({
      status: 'ok',
      connected: isReady,
      durationMs: duration,
      database: dbName,
      userCount,
      host: mongoose.connection.host,
    });
  } catch (error: any) {
    const duration = Date.now() - start;
    return NextResponse.json(
      {
        status: 'error',
        connected: false,
        durationMs: duration,
        error: error?.message || String(error),
        code: error?.code,
        name: error?.name,
        stack: error?.stack?.split('\n').slice(0, 3),
      },
      { status: 503 }
    );
  }
}
