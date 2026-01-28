import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { useState, useEffect } from 'react'
import { type DictionaryLanguage } from '../types'
import * as HistoryDb from '../db/history'
import * as FavDb from '../db/favourite'
import { useToast } from '../providers/ToastProvider'

interface HistoryListProps {
  type: 'history' | 'favorites'
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  refreshTrigger?: number
}

// Static constant outside component
const MODES_ICON: Record<DictionaryLanguage, React.ReactNode> = {
  en: '🇬🇧',
  km: '🇰🇭',
  ru: <img alt="RU" className="w-5 h-5" src="/free_russia_flag_wavy.svg" />,
}

interface HistoryItem {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  timestamp?: number
}

// Sub-component for individual rows to prevent list-wide re-renders if one item changes (rare here but good practice)
const HistoryItemRow = React.memo(
  ({
    item,
    onSelect,
  }: {
    item: HistoryItem
    onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  }) => (
    <button
      className="group flex items-center px-4 py-3 border-b border-divider hover:bg-default-100 cursor-pointer transition-all w-full text-left bg-transparent border-none"
      type="button"
      onClick={() => onSelect(item.word, item.language)}
    >
      <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center mr-3 text-lg shadow-sm group-hover:bg-white group-hover:scale-110 transition-all">
        {MODES_ICON[item.language] ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-khmer text-foreground text-medium leading-snug truncate group-hover:text-primary transition-colors">
          {item.word}
        </div>
      </div>
      <div className="text-default-300 group-hover:translate-x-1 transition-transform">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        </svg>
      </div>
    </button>
  ),
)

HistoryItemRow.displayName = 'HistoryItemRow'

export const HistoryList: React.FC<HistoryListProps> = React.memo(({ type, onSelect, refreshTrigger }) => {
  const toast = useToast()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const fetchItems = async () => {
      setLoading(true)
      try {
        const res = type === 'history' ? await HistoryDb.getHistory() : await FavDb.getFavorites()

        if (active) setItems(res)
      } catch (e: any) {
        toast.error(type === 'history' ? 'Loading history db failed' : 'Loading favourites db failed', e.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchItems()

    return () => {
      active = false
    }
  }, [type, refreshTrigger])

  if (loading) {
    return (
      <div className="p-4 text-center text-default-400 flex items-center justify-center h-40">
        <span className="text-sm uppercase tracking-wider">Loading...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-default-300 gap-2">
        <span className="text-4xl opacity-50">{type === 'history' ? '🕒' : '⭐'}</span>
        <p>No items found.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-content1">
      {items.map((item, idx) => (
        <HistoryItemRow key={`${item.word}-${idx}`} item={item} onSelect={onSelect} />
      ))}
    </div>
  )
})

HistoryList.displayName = 'HistoryList'
