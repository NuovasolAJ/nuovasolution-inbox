import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const url = process.env.OPERATOR_SEND_URL
  if (!url) return NextResponse.json({ error: 'OPERATOR_SEND_URL not configured' }, { status: 500 })

  try {
    const { to, message } = await req.json()
    if (!to || !message) return NextResponse.json({ error: 'to and message required' }, { status: 400 })

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: String(to).replace(/\D/g, ''), message }),
    })

    // n8n can return an empty body on error — read as text first
    const text = await res.text()
    let data: Record<string, unknown> = {}
    try {
      if (text.trim()) data = JSON.parse(text)
    } catch { /* non-JSON body — treat as opaque */ }

    // HTTP 2xx from n8n = delivery attempted; trust the normalized payload
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: (data.error as string) ?? `n8n returned ${res.status}` },
        { status: 502 }
      )
    }

    const success = !!(data.success ?? data?.messageId)
    return NextResponse.json({
      success,
      messageId: data.messageId ?? null,
      sentTo: data.sentTo ?? null,
      error: data.error ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
