import { NextRequest, NextResponse } from 'next/server'
import { syncResults } from '@/lib/sports-api/sync'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await syncResults()
  return NextResponse.json(result)
}
