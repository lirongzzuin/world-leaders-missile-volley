/**
 * GET /api/cron/cleanup-old-records
 * Deletes game records older than 90 days.
 * Triggered by Vercel Cron (vercel.json) — protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  try {
    const { count } = await prisma.gameRecord.deleteMany({
      where: { playedAt: { lt: cutoff } },
    });
    console.log(`[cron/cleanup] deleted ${count} records older than ${cutoff.toISOString()}`);
    return NextResponse.json({ ok: true, deleted: count });
  } catch (err) {
    console.error('[cron/cleanup]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
