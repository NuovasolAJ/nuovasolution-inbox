'use client'
import { useState } from 'react'
import type { Conversation } from '@/lib/types'
import { formatBudget } from '@/lib/utils'

const INTENT_STYLE: Record<string, string> = {
  buy:     'bg-blue-100 text-blue-700',
  sell:    'bg-purple-100 text-purple-700',
  rent:    'bg-teal-100 text-teal-700',
  unknown: 'bg-gray-100 text-gray-500',
}

const TEMP_STYLE: Record<string, { dot: string; label: string }> = {
  hot:  { dot: 'bg-red-500',    label: '🔴 Hot' },
  warm: { dot: 'bg-orange-400', label: '🟠 Warm' },
  cold: { dot: 'bg-blue-400',   label: '🔵 Cold' },
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function getMissingFields(conv: Conversation): string[] {
  const missing: string[] = []
  if (!conv.intent || conv.intent === 'unknown') missing.push('intent')
  if (!conv.budget) missing.push('budget')
  if (!conv.location) missing.push('location')
  if (!conv.propertyType) missing.push('property type')
  if (!conv.timing) missing.push('timing')
  return missing
}

interface Props {
  conv: Conversation
}

export default function LeadSummaryCard({ conv }: Props) {
  const [expanded, setExpanded] = useState(false)

  const intent = conv.intent?.toLowerCase() ?? 'unknown'
  const intentStyle = INTENT_STYLE[intent] ?? INTENT_STYLE.unknown
  const intentLabel = intent.charAt(0).toUpperCase() + intent.slice(1)
  const tempInfo = conv.temperature ? TEMP_STYLE[conv.temperature] : null
  const missing = getMissingFields(conv)
  const hasAnyData = conv.summary || conv.budget || conv.location || conv.propertyType || conv.timing || conv.intent

  if (!hasAnyData && conv.score === 0) return null

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-wa-green fill-current flex-shrink-0">
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
        </svg>

        <span className="text-xs font-semibold text-gray-600 flex-1">Lead Intelligence</span>

        {/* Quick stats row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {conv.intent && conv.intent !== 'unknown' && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${intentStyle}`}>
              {intentLabel}
            </span>
          )}
          {conv.budget && (
            <span className="text-xs font-medium text-gray-600">{formatBudget(conv.budget)}</span>
          )}
          {conv.score > 0 && (
            <span className={`text-xs font-bold ${scoreColor(conv.score)}`}>{conv.score}</span>
          )}
          {tempInfo && (
            <span className="text-xs text-gray-500 hidden sm:inline">{tempInfo.label}</span>
          )}
          {missing.length > 0 && (
            <span className="text-xs text-amber-500 font-medium hidden sm:inline">
              ⚠️ {missing.length} missing
            </span>
          )}
        </div>

        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 fill-current text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4">
          {/* Structured fields grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Intent">
              {conv.intent && conv.intent !== 'unknown' ? (
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${intentStyle}`}>
                  {intentLabel}
                </span>
              ) : <Blank />}
            </Field>
            <Field label="Budget">
              <span className="text-sm font-semibold text-gray-800">{formatBudget(conv.budget)}</span>
            </Field>
            <Field label="Location">
              <span className="text-sm text-gray-800">{conv.location ?? <Blank />}</span>
            </Field>
            <Field label="Property">
              <span className="text-sm text-gray-800">{conv.propertyType ?? <Blank />}</span>
            </Field>
            <Field label="Timing">
              <span className="text-sm text-gray-800">{conv.timing ?? <Blank />}</span>
            </Field>
            <Field label="Score">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-bold ${scoreColor(conv.score)}`}>
                  {conv.score > 0 ? conv.score : '—'}/100
                </span>
                {tempInfo && (
                  <span className="text-xs text-gray-500">{tempInfo.label}</span>
                )}
              </div>
            </Field>
          </div>

          {/* AI Summary */}
          {conv.summary && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">AI Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{conv.summary}</p>
            </div>
          )}

          {/* Missing fields alert */}
          {missing.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-amber-700">Incomplete lead profile</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Missing: {missing.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Status + meta */}
          <div className="flex flex-wrap gap-2">
            {conv.status && (
              <Tag label={conv.status} color="bg-blue-50 text-blue-600" />
            )}
            {conv.category && (
              <Tag label={conv.category} color="bg-purple-50 text-purple-600" />
            )}
            {conv.language && (
              <Tag label={conv.language.toUpperCase()} color="bg-gray-100 text-gray-500" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div>{children}</div>
    </div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>{label}</span>
  )
}

function Blank() {
  return <span className="text-sm text-gray-300">—</span>
}
