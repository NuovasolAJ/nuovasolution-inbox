import type { Conversation, HandoverStatus } from './types'

type SheetRow = Record<string, unknown>

function parseSheetDate(val: unknown): string | null {
  if (!val) return null
  const s = String(val).trim()
  if (!s) return null
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00`
  return s
}

function deriveHandoverStatus(phone: string, status: string | null): HandoverStatus {
  if (phone.includes('34645852372')) return 'protected'
  const s = (status ?? '').toLowerCase()
  if (s.includes('human') || s.includes('manual') || s.includes('takeover')) return 'human_active'
  return 'ai_active'
}

export function formatBudget(budget: number | null): string {
  if (!budget) return '—'
  if (budget >= 1_000_000) return `€${(budget / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (budget >= 1_000) return `€${Math.round(budget / 1_000)}k`
  return `€${budget.toLocaleString('en')}`
}

export function formatTime(ts: string | null | undefined): string {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (diff < 604_800_000) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export function mapSheetsRow(row: SheetRow): Conversation {
  const s = (k: string) => (row[k] != null ? String(row[k]) : '')

  const phone = s('Phone Number')
  const firstName = s('First Name')
  const lastName = s('Last Name')
  const name = [firstName, lastName].filter(Boolean).join(' ') || phone || 'Unknown'
  const rawId = s('Channel Conversation ID') || phone
  const status = s('Follow-Up Status') || null

  const rawBudget = Number(row['Budget'])

  return {
    id: rawId || `unknown-${Math.random()}`,
    phone,
    name,
    lastMessage: s('Original Message'),
    lastInboundAt: parseSheetDate(row['Last Contact Date'] ?? row['Last Inbound At']),
    lastOutboundAt: parseSheetDate(row['Last Outbound At'] ?? row['Last Updated']),
    score: Number(row['Lead Score']) || 0,
    temperature: (s('Lead Temperature').toLowerCase() as Conversation['temperature']) || null,
    status,
    summary: s('Lead Summary') || null,
    category: s('Main Category') || null,
    language: s('Language') || null,
    isProtected: phone.includes('34645852372'),
    budget: rawBudget > 0 ? rawBudget : null,
    location: s('Location') || s('Lead Location') || null,
    propertyType: s('Property Type') || s('PropertyType') || null,
    intent: s('Intent') || s('Lead Intent') || null,
    timing: s('Timing') || s('Lead Timing') || null,
    handoverStatus: deriveHandoverStatus(phone, status),
  }
}
