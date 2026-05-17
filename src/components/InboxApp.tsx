'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Conversation } from '@/lib/types'
import ConversationItem from './ConversationItem'
import ChatView from './ChatView'
import NewChatModal from './NewChatModal'

export default function InboxApp() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setConversations(data)
      setLastRefresh(new Date())
      setError(null)
      setSelected(prev => {
        if (!prev) return null
        return data.find((c: Conversation) => c.id === prev.id) ?? prev
      })
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    intervalRef.current = setInterval(fetchConversations, 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchConversations])

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  function handleSelect(conv: Conversation) {
    setSelected(conv)
  }

  function handleBack() {
    setSelected(null)
  }

  const filtered = conversations.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      (c.location ?? '').toLowerCase().includes(q) ||
      (c.category ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ── Top bar ──────────────────────────────────── */}
      <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-14 bg-wa-green text-white flex-shrink-0 shadow-md z-20">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current opacity-90 flex-shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="font-semibold text-sm truncate">NuovaSolution Inbox</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {lastRefresh && (
            <span className="text-xs text-white/60 hidden lg:block">
              {lastRefresh.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full hidden sm:inline">
            {conversations.length}
          </span>

          {/* New chat */}
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 active:bg-white/40 px-2.5 py-1.5 rounded-full transition-colors font-medium touch-manipulation"
            title="New conversation"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm1 9h-3v3h-2v-3h-3V10h3V7h2v3h3v2z"/>
            </svg>
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => { setLoading(true); fetchConversations() }}
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
            title="Refresh"
          >
            <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current ${loading ? 'animate-spin' : ''}`}>
              <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current opacity-80">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left panel — conversation list */}
        {/* On mobile: visible when no conversation selected */}
        {/* On desktop: always visible */}
        <aside className={`
          flex flex-col bg-white flex-shrink-0
          w-full md:w-80 lg:w-96
          border-r border-gray-200
          ${selected ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Search */}
          <div className="px-3 py-2 border-b border-gray-100 bg-wa-panel">
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 fill-current flex-shrink-0">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent min-w-0"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-gray-400 hover:text-gray-600 p-0.5 touch-manipulation"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-3">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Loading conversations…
              </div>
            )}
            {error && (
              <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                <strong>Error:</strong> {error}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                {search ? 'No results for that search' : 'No WhatsApp conversations yet'}
              </div>
            )}
            {filtered.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                selected={selected?.id === conv.id}
                onClick={() => handleSelect(conv)}
              />
            ))}
          </div>
        </aside>

        {/* Right panel — chat view */}
        {/* On mobile: visible only when a conversation is selected */}
        {/* On desktop: always visible */}
        <main className={`
          flex-1 min-w-0 flex-col
          ${selected ? 'flex' : 'hidden md:flex'}
        `}>
          {selected ? (
            <ChatView conv={selected} onBack={handleBack} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4 bg-wa-bg">
              <svg viewBox="0 0 24 24" className="w-16 h-16 fill-current opacity-10">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <div>
                <p className="font-semibold text-gray-500">Select a conversation</p>
                <p className="text-sm mt-1 text-gray-400 max-w-xs">
                  Choose a contact from the left panel to view messages and reply
                </p>
              </div>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-2 flex items-center gap-2 text-sm font-medium text-wa-green border border-wa-green/30 hover:bg-wa-green/5 px-4 py-2 rounded-full transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm1 9h-3v3h-2v-3h-3V10h3V7h2v3h3v2z"/>
                </svg>
                Start new conversation
              </button>
            </div>
          )}
        </main>
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  )
}
