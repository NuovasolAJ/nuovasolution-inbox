'use client'
import { useEffect, useRef, useState } from 'react'

const PROTECTED_FRAGMENT = '34645852372'

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

function isProtected(phone: string): boolean {
  return normalizePhone(phone).includes(PROTECTED_FRAGMENT)
}

interface Props {
  onClose: () => void
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function NewChatModal({ onClose }: Props) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    phoneRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const protected_ = isProtected(phone)
  const canSend = normalizePhone(phone).length >= 7 && message.trim().length > 0 && status !== 'sending'

  async function handleSend() {
    if (!canSend) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: normalizePhone(phone), message: message.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error ?? 'Send failed — check n8n logs')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error — message may not have been delivered')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-wa-green text-white">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="font-semibold text-sm">New WhatsApp Message</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Phone number (international format)
            </label>
            <div className="relative">
              <input
                ref={phoneRef}
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setStatus('idle') }}
                placeholder="+34 645 852 372"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Include country code. Spaces and + are stripped automatically.</p>
          </div>

          {/* Protected warning */}
          {protected_ && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>
                <strong>Protected number (Lucas).</strong> This message will be sent manually via OperatorSend_v1. AI automation is permanently bypassed for this contact.
              </span>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => { setMessage(e.target.value); setStatus('idle') }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Type your message… (Enter to send, Shift+Enter for newline)"
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            />
          </div>

          {/* Success */}
          {status === 'success' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-emerald-700">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Message sent successfully via OperatorSend_v1.
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {status === 'success' ? 'Close' : 'Cancel'}
            </button>
            {status !== 'success' && (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex-1 px-4 py-2.5 rounded-lg bg-wa-green-light hover:bg-wa-green disabled:bg-gray-300 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {status === 'sending' ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
