import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion, useAnimation, type PanInfo } from 'framer-motion'
import { type DictionaryLanguage } from '../types'
import * as HistoryDb from '../db/history'
import * as FavDb from '../db/favourite'
import { useToast } from '../providers/ToastProvider'
import { FaRegTrashAlt } from 'react-icons/fa'
import type { KhmerWordsMap } from '../db/dict'
import { colorizeText } from '../utils/text-processing/text'
import { Button } from '@heroui/button'
import type { ColorizationMode } from '../utils/text-processing/utils'

// --- Static Constants (Moved outside for referential stability) ---

const MODES_ICON: Record<DictionaryLanguage, React.ReactNode> = {
  en: '🇬🇧',
  km: '🇰🇭',
  ru: <img alt="RU" className="w-5 h-5" src="/free_russia_flag_wavy.svg" />,
}

// Animation variants
const ANIM_ENTER = { height: 'auto', opacity: 1 } as const
const ANIM_EXIT = { height: 0, opacity: 0, transition: { duration: 0.2 } } as const
const ANIM_INITIAL = { height: 0, opacity: 0 } as const
const ANIM_TRASH_EXIT = { x: -500, transition: { duration: 0.2 } } as const
const ANIM_SNAP_BACK = { x: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } as const

// Drag config
const DRAG_CONSTRAINTS = { left: -1000, right: 0 } as const
const TOUCH_STYLE: React.CSSProperties = { touchAction: 'pan-y' } as const

// --- Memoized Sub-Components ---

const TrashIcon = React.memo(() => (
  <div className="absolute inset-0 bg-danger flex items-center justify-end px-6">
    <FaRegTrashAlt className="w-6 h-6 text-white" />
  </div>
))

TrashIcon.displayName = 'TrashIcon'

const ChevronIcon = React.memo(() => (
  <div className="text-default-300 ml-2 shrink-0">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  </div>
))

ChevronIcon.displayName = 'ChevronIcon'

interface HistoryItem {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  timestamp?: number
}

interface HistoryItemRowProps {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  onDelete: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => void
  km_map: KhmerWordsMap | undefined
  colorMode: ColorizationMode
}

const HistoryItemRow = React.memo<HistoryItemRowProps>(({ word, language, onSelect, onDelete, km_map, colorMode }) => {
  const controls = useAnimation()

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      const offset = info.offset.x
      const velocity = info.velocity.x

      // Threshold: swipe left > 100px OR fast swipe > 50px
      if (offset < -100 || (offset < -50 && velocity < -500)) {
        await controls.start(ANIM_TRASH_EXIT)
        onDelete(word, language)
      } else {
        controls.start(ANIM_SNAP_BACK)
      }
    },
    [controls, onDelete, word, language],
  )

  const handleTap = useCallback(() => {
    onSelect(word, language)
  }, [onSelect, word, language])

  const wordColorized = useMemo(() => {
    return { __html: colorizeText(word, colorMode, km_map) }
  }, [word, km_map, colorMode])

  return (
    <motion.div
      animate={ANIM_ENTER}
      className="relative overflow-hidden border-b border-divider bg-content1"
      exit={ANIM_EXIT}
      initial={ANIM_INITIAL}
      layout="position"
    >
      <TrashIcon />

      <motion.div
        animate={controls}
        className="relative bg-content1 flex items-center px-4 py-3 w-full cursor-pointer hover:bg-default-100 transition-colors"
        drag="x"
        dragConstraints={DRAG_CONSTRAINTS}
        dragElastic={0.1}
        style={TOUCH_STYLE}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
      >
        <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center mr-3 text-lg shadow-sm shrink-0">
          {MODES_ICON[language]}
        </div>
        <div className="flex-1 min-w-0 pointer-events-none select-none">
          <div
            dangerouslySetInnerHTML={wordColorized}
            className="font-khmer text-foreground text-medium leading-snug truncate"
          />
        </div>
        <ChevronIcon />
      </motion.div>
    </motion.div>
  )
})

HistoryItemRow.displayName = 'HistoryItemRow'

// --- Main Component ---

const LoadingState = React.memo(() => (
  <div className="flex-1 flex items-center justify-center p-4 h-40">
    <span className="text-sm uppercase tracking-wider text-default-400 animate-pulse">Loading...</span>
  </div>
))

LoadingState.displayName = 'LoadingState'

const EmptyState = React.memo(({ type }: { type: 'history' | 'favorites' }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-default-300 gap-2 min-h-[200px]">
    <span className="text-4xl opacity-50">{type === 'history' ? '🕒' : '⭐'}</span>
    <p>No items found.</p>
  </div>
))

EmptyState.displayName = 'EmptyState'

interface HistoryListProps {
  type: 'history' | 'favorites'
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  refreshTrigger: number | undefined
  km_map: KhmerWordsMap | undefined
  colorMode: ColorizationMode
}

export const HistoryList: React.FC<HistoryListProps> = React.memo(
  ({ type, onSelect, refreshTrigger, colorMode, km_map }) => {
    const toast = useToast()
    const [items, setItems] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const prevTypeRef = useRef(type)

    // Fetch Logic
    useEffect(() => {
      let active = true

      const fetchItems = async () => {
        // Logic to prevent flicker:
        // Only set loading=true if we are switching tabs (History <-> Favorites).
        // If we are just refreshing the current tab (refreshTrigger), keep the old list visible until update.
        const isTypeSwitch = prevTypeRef.current !== type

        if (isTypeSwitch) {
          setLoading(true)
          setItems([]) // Clear immediately on type switch to avoid showing wrong data
        }

        try {
          const res = type === 'history' ? await HistoryDb.getHistory() : await FavDb.getFavorites()

          if (active) {
            setItems(res)
          }
        } catch (e: any) {
          toast.error(type === 'history' ? 'Loading history db failed' : 'Loading favourites db failed', e.message)
        } finally {
          if (active) {
            setLoading(false)
            prevTypeRef.current = type
          }
        }
      }

      fetchItems()

      return () => {
        active = false
      }
    }, [type, refreshTrigger, toast])

    // Optimized Delete Handler
    const handleDelete = useCallback(
      async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
        // 1. Optimistic Update
        setItems(current => current.filter(i => !(i.word === word && i.language === language)))

        try {
          // 2. DB Operation
          if (type === 'history') {
            await HistoryDb.removeHistoryItem(word, language)
          } else {
            await FavDb.removeFavorite(word, language)
          }
        } catch (e: any) {
          // 3. Rollback on failure (Re-fetch is safer than managing previous state snapshot here)
          toast.error('Failed to delete item', e.message)
          const res = type === 'history' ? await HistoryDb.getHistory() : await FavDb.getFavorites()

          setItems(res)
        }
      },
      [type, toast],
    )

    // Clear All Handler
    const handleClearAll = useCallback(async () => {
      if (items.length === 0) return

      const confirmMessage =
        type === 'history'
          ? 'Are you sure you want to clear your history?'
          : 'Are you sure you want to clear all favorites?'

      if (!window.confirm(confirmMessage)) {
        return
      }

      // 1. Optimistic UI update
      const previousItems = [...items]

      setItems([])

      try {
        if (type === 'history') {
          // Use the optimized delete all function for history
          await HistoryDb.deleteAllHistory()
          toast.success('History cleared')
        } else {
          // Fallback loop for favorites since we don't have a deleteAllFavorites exposed yet
          // Executing in sequence to be safe with SQLite locking
          await FavDb.deleteAllFavourites()
          toast.success('Favorites cleared')
        }
      } catch (e: any) {
        setItems(previousItems) // Rollback
        toast.error('Failed to clear items', e.message)
      }
    }, [items, type, toast])

    if (loading) return <LoadingState />
    if (items.length === 0) return <EmptyState type={type} />

    return (
      <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Sticky Header with Clear All Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
          <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
            {type === 'history' ? 'Recent History' : 'Favorites'} ({items.length})
          </span>
          <Button
            className="h-8 text-tiny font-medium"
            color="danger"
            size="sm"
            startContent={<FaRegTrashAlt />}
            variant="light"
            onPress={handleClearAll}
          >
            Clear All
          </Button>
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {items.map(item => (
            <HistoryItemRow
              key={`${item.word}-${item.language}`}
              colorMode={colorMode}
              km_map={km_map}
              language={item.language}
              word={item.word}
              onDelete={handleDelete}
              onSelect={onSelect}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  },
)

HistoryList.displayName = 'HistoryList'
