'use client'
import { useEffect, useRef, useState } from 'react'
import type { Conversation, Message } from '@/lib/types'
import { formatTime, getInitials } from '@/lib/utils'
import LeadSummaryCard from './LeadSummaryCard'

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
  'bg-pink-500', 'bg-rose-500', 'bg-cyan-500',
]
function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

const HANDOVER_BADGE: Record<string, { label: string; style: string }> = {
  ai_active:    { label: '🤖 AI Active',   style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  human_active: { label: '👤 Human Active', style: 'bg-blue-50 text-blue-700 border border-blue-200' },
  protected:    { label: '🔒 Protected',    style: 'bg-amber-50 text-amber-700 border border-amber-200' },
}

interface Props {
  conv: Conversation
  onBack?: () => void
}

export default function ChatView({ conv, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const initial: Message[] = []
    if (conv.lastMessage) {
      initial.push({
        id: 'inbound-initial',
        type: 'inbound',
        text: conv.lastMessage,
        timestamp: conv.lastInboundAt ?? new Date().toISOString(),
      })
    }
    if (conv.lastOutboundAt) {
      initial.push({
        id: 'system-ai-replied',
        type: 'system',
        text: `AI replied at ${new Date(conv.lastOutboundAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        timestamp: conv.lastOutboundAt,
        isAI: true,
      })
    }
    setMessages(initial)
    setSendError(null)
    setInput('')
  }, [conv.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setSendError(null)
    const optimistic: Message = {
      id: `sent-${Date.now()}`,
      type: 'outbound',
      text,
      timestamp: new Date().toISOString(),
    }
    setMessages(m => [...m, optimistic])
    setInput('')
    textareaRef.current?.focus()
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: conv.phone, message: text }),
      })
      const data = await res.json()
      if (!data.success) setSendError(data.error ?? 'Send failed — check n8n logs')
    } catch {
      setSendError('Network error — message may not have been delivered')
    } finally {
      setSending(false)
    }
  }

  const initials = getInitials(conv.name)
  const isPhone = !conv.name || conv.name === conv.phone
  const badge = HANDOVER_BADGE[conv.handoverStatus]

  return (
    <div className="flex flex-col h-full">
      {/* Contact header */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-wa-panel border-b border-gray-200 flex-shrink-0">
        {/* Back button — mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation"
            aria-label="Back to conversations"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gray-600">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
        )}

        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          text-white font-semibold text-sm select-none
          ${conv.isProtected ? 'bg-amber-500' : avatarColor(conv.id)}
        `}>
          {conv.isProtected ? '🔒' : (initials || '?')}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">
              {isPhone ? `+${conv.phone}` : conv.name}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.style}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {!isPhone && `+${conv.phone}`}
            {conv.category ? (isPhone ? conv.category : ` · ${conv.category}`) : ''}
            {conv.language ? ` · ${conv.language.toUpperCase()}` : ''}
          </p>
        </div>

        {/* Score pill — desktop only */}
        {conv.score > 0 && (
          <div className="hidden sm:flex flex-col items-center flex-shrink-0">
            <span className="text-lg font-bold text-gray-700 leading-none">{conv.score}</span>
            <span className="text-[10px] text-gray-400 leading-none mt-0.5">score</span>
          </div>
        )}
      </div>

      {/* Lead intelligence card */}
      <LeadSummaryCard conv={conv} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2 bg-wa-bg overscroll-contain">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current opacity-20 mb-2">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation</p>
          </div>
        )}
        {messages.map(msg => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-[11px] text-gray-500 bg-white/70 px-3 py-1 rounded-full shadow-sm">
                  {msg.text}
                </span>
              </div>
            )
          }
          const isOut = msg.type === 'outbound'
          return (
            <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[80%] sm:max-w-[72%] px-3.5 py-2.5 rounded-2xl shadow-sm text-sm
                ${isOut
                  ? 'bg-wa-sent rounded-tr-sm'
                  : 'bg-white rounded-tl-sm'}
              `}>
                <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                <p className={`text-[11px] mt-1 ${isOut ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                  {isOut && ' ✓'}
                </p>
              </div>
            </div>
          )
        })}
        {sendError && (
          <div className="flex justify-center">
            <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              ⚠️ {sendError}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Protected warning */}
      {conv.isProtected && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 text-center font-medium flex-shrink-0">
          🔒 Protected contact — manual replies only. AI automation is permanently bypassed.
        </div>
      )}

      {/* Input area — sticky at bottom */}
      <div className="flex items-end gap-2 px-3 sm:px-4 py-3 bg-wa-panel border-t border-gray-200 flex-shrink-0 safe-area-bottom">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm bg-white border border-gray-200 outline-none focus:border-wa-green-light focus:ring-2 focus:ring-emerald-100 transition-all max-h-32 overflow-y-auto"
          style={{ minHeight: '44px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-wa-green-light hover:bg-wa-green active:scale-95 disabled:bg-gray-300 text-white flex items-center justify-center transition-all touch-manipulation"
          aria-label="Send message"
        >
          {sending ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current translate-x-0.5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
