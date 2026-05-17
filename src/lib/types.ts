export type HandoverStatus = 'ai_active' | 'human_active' | 'protected'

export interface Conversation {
  id: string
  phone: string
  name: string
  lastMessage: string
  lastInboundAt: string | null
  lastOutboundAt: string | null
  score: number
  temperature: 'hot' | 'warm' | 'cold' | null
  status: string | null
  summary: string | null
  category: string | null
  language: string | null
  isProtected: boolean
  // Structured lead intelligence (from CRM / Google Sheets)
  budget: number | null
  location: string | null
  propertyType: string | null
  intent: string | null
  timing: string | null
  handoverStatus: HandoverStatus
}

export interface Message {
  id: string
  type: 'inbound' | 'outbound' | 'system'
  text: string
  timestamp: string
  isAI?: boolean
}
