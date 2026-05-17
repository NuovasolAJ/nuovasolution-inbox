'use client'
import type { Conversation } from '@/lib/types'
import { formatTime, getInitials } from '@/lib/utils'

const TEMP_STYLE = {
  hot:  { dot: 'bg-red-500',    text: 'text-red-500' },
  warm: { dot: 'bg-orange-400', text: 'text-orange-500' },
  cold: { dot: 'bg-blue-400',   text: 'text-blue-500' },
}

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
  'bg-pink-500', 'bg-rose-500', 'bg-cyan-500',
]

function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50'
  if (score >= 40) return 'text-orange-500 bg-orange-50'
  return 'text-red-500 bg-red-50'
}

// Small status dot overlay on the avatar
const STATUS_DOT: Record<string, string> = {
  ai_active:    'bg-emerald-400',
  human_active: 'bg-blue-400',
  protected:    'bg-amber-400',
}

interface Props {
  conv: Conversation
  selected: boolean
  onClick: () => void
}

export default function ConversationItem({ conv, selected, onClick }: Props) {
  const initials = getInitials(conv.name)
  const time = formatTime(conv.lastInboundAt)
  const temp = conv.temperature
  const isPhone = !conv.name || conv.name === conv.phone

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-100
        active:bg-gray-100 touch-manipulation
        ${selected
          ? 'bg-white border-l-[3px] border-l-wa-green pl-[13px]'
          : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'}
      `}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        <div className={`
          w-11 h-11 rounded-full flex items-center justify-center
          text-white font-semibold text-sm select-none
          ${conv.isProtected ? 'bg-amber-500' : avatarColor(conv.id)}
        `}>
          {conv.isProtected ? '🔒' : (initials || '?')}
        </div>
        {/* Handover status dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[conv.handoverStatus]}`}
          title={conv.handoverStatus === 'ai_active' ? 'AI Active' : conv.handoverStatus === 'human_active' ? 'Human Active' : 'Protected'}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: name + time */}
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className={`font-semibold text-sm truncate leading-tight ${selected ? 'text-gray-900' : 'text-gray-800'}`}>
            {isPhone ? (
              <span className="font-normal text-gray-500">+{conv.phone}</span>
            ) : conv.name}
          </span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 leading-tight">{time}</span>
        </div>

        {/* Row 2: phone secondary (only when name exists) */}
        {!isPhone && (
          <p className="text-[11px] text-gray-400 truncate leading-tight mb-0.5">+{conv.phone}</p>
        )}

        {/* Row 3: last message */}
        <p className="text-xs text-gray-500 truncate leading-snug">
          {conv.lastMessage || '—'}
        </p>

        {/* Row 4: badges */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {temp && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${TEMP_STYLE[temp].text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${TEMP_STYLE[temp].dot}`} />
              {temp.charAt(0).toUpperCase() + temp.slice(1)}
            </span>
          )}
          {conv.category && (
            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
              {conv.category}
            </span>
          )}
          {conv.score > 0 && (
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(conv.score)}`}>
              {conv.score}
            </span>
          )}
          {conv.handoverStatus === 'human_active' && (
            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              👤 Human
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
