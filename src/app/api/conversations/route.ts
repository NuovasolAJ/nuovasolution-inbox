import { NextResponse } from 'next/server'
import { mapSheetsRow } from '@/lib/utils'

export async function GET() {
  const url = process.env.INBOX_API_URL
  if (!url) return NextResponse.json({ error: 'INBOX_API_URL not configured' }, { status: 500 })

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`n8n returned ${res.status}`)

    const body = await res.json()
    const rows: Record<string, unknown>[] = body?.conversations ?? body ?? []

    const conversations = rows
      .filter(r => String(r['Channel'] ?? '').toLowerCase() === 'whatsapp')
      .map(mapSheetsRow)
      .sort((a, b) => {
        const ta = a.lastInboundAt ? new Date(a.lastInboundAt).getTime() : 0
        const tb = b.lastInboundAt ? new Date(b.lastInboundAt).getTime() : 0
        return tb - ta
      })

    return NextResponse.json(conversations)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
