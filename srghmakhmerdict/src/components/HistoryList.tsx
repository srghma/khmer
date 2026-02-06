import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion, useAnimation, type PanInfo } from 'framer-motion'
import { FaRegTrashAlt, FaGraduationCap } from 'react-icons/fa'
import { Button } from '@heroui/button'
import srghma_khmer_dict_content_styles from '../srghma_khmer_dict_content.module.css'

// Types & Utils
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import type { KhmerWordsMap } from '../db/dict'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'
import { colorizeText } from '../utils/text-processing/text'
import { useToast } from '../providers/ToastProvider'
import {
  strToContainsKhmerOrThrow,
  type TypedContainsKhmer,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'

// DB
import * as HistoryDb from '../db/history'
import * as FavDb from '../db/favourite'

// Components
import { KhmerAnkiModal } from './Anki'
import {
  Set_toNonEmptySet_orUndefined,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

// --- Types ---

export interface HistoryItem {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  timestamp?: number
}

// --- Module Level Cache (Stale-While-Revalidate) ---
// Keeps data in memory so tab switching is instant
const LIST_CACHE: Record<string, HistoryItem[]> = {}

// --- Shared Constants & Animations ---

const MODES_ICON: Record<DictionaryLanguage, React.ReactNode> = {
  en: '🇬🇧',
  km: '🇰🇭',
  ru: <img alt="RU" className="w-5 h-5" src="/free_russia_flag_wavy.svg" />,
}

const ANIM_ENTER = { height: 'auto', opacity: 1 } as const
const ANIM_EXIT = { height: 0, opacity: 0, transition: { duration: 0.2 } } as const
const ANIM_INITIAL = { height: 0, opacity: 0 } as const
const ANIM_TRASH_EXIT = { x: -500, transition: { duration: 0.2 } } as const
const ANIM_SNAP_BACK = { x: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } as const
const DRAG_CONSTRAINTS = { left: -1000, right: 0 } as const
const TOUCH_STYLE: React.CSSProperties = { touchAction: 'pan-y' } as const

// --- Shared Sub-Components ---

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

// --- HistoryItemRow ---

interface HistoryItemRowProps {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  onDelete: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => void
  km_map: KhmerWordsMap | undefined
  maybeColorMode: MaybeColorizationMode
}

const HistoryItemRow = React.memo<HistoryItemRowProps>(
  ({ word, language, onSelect, onDelete, km_map, maybeColorMode }) => {
    const controls = useAnimation()

    const handleDragEnd = useCallback(
      async (_: unknown, info: PanInfo) => {
        const offset = info.offset.x
        const velocity = info.velocity.x

        if (offset < -100 || (offset < -50 && velocity < -500)) {
          await controls.start(ANIM_TRASH_EXIT)
          onDelete(word, language)
        } else {
          controls.start(ANIM_SNAP_BACK)
        }
      },
      [controls, onDelete, word, language],
    )

    const wordColorized = useMemo(() => {
      if (maybeColorMode === 'none' || !km_map) return { __html: word }

      return { __html: colorizeText(word, maybeColorMode, km_map) }
    }, [word, km_map, maybeColorMode])

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
          onTap={() => onSelect(word, language)}
        >
          <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center mr-3 text-lg shadow-sm shrink-0">
            {MODES_ICON[language]}
          </div>
          <div className="flex-1 min-w-0 pointer-events-none select-none">
            <div
              dangerouslySetInnerHTML={wordColorized}
              className={`text-foreground text-medium leading-snug truncate ${srghma_khmer_dict_content_styles.srghma_khmer_dict_content}`}
            />
          </div>
          <ChevronIcon />
        </motion.div>
      </motion.div>
    )
  },
)

HistoryItemRow.displayName = 'HistoryItemRow'

// --- Custom Hook: useListLogic (With Cache Support) ---

type DbFetchFn = () => Promise<HistoryItem[]>
type DbDeleteFn = (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<void>
type DbClearFn = () => Promise<void>

function useListLogic(
  fetchFn: DbFetchFn,
  deleteFn: DbDeleteFn,
  clearFn: DbClearFn,
  refreshTrigger: number | undefined,
  typeLabel: 'history' | 'favorites',
) {
  const toast = useToast()

  // Initialize from cache if available to prevent flicker
  const [items, setItems] = useState<HistoryItem[]>(() => LIST_CACHE[typeLabel] || [])
  // If cache exists, we are not "loading" visually, just refreshing in background
  const [loading, setLoading] = useState(() => !LIST_CACHE[typeLabel])

  // Fetch Logic
  useEffect(() => {
    let active = true

    const load = async () => {
      // Only show full loading spinner if we have absolutely no data
      if (!LIST_CACHE[typeLabel]) {
        setLoading(true)
      }

      try {
        const res = await fetchFn()

        // Update Cache
        LIST_CACHE[typeLabel] = res

        if (active) {
          setItems(res)
        }
      } catch (e: any) {
        toast.error(`Loading ${typeLabel} failed`, e.message)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [fetchFn, refreshTrigger, toast, typeLabel])

  // Delete Logic
  const handleDelete = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      const prevItems = items

      // 1. Optimistic Update (UI + Cache)
      const newItems = prevItems.filter(i => !(i.word === word && i.language === language))

      setItems(newItems)
      LIST_CACHE[typeLabel] = newItems

      try {
        await deleteFn(word, language)
      } catch (e: any) {
        toast.error('Failed to delete item', e.message)
        // Rollback
        setItems(prevItems)
        LIST_CACHE[typeLabel] = prevItems
      }
    },
    [items, deleteFn, toast, typeLabel],
  )

  // Clear All Logic
  const handleClearAll = useCallback(async () => {
    if (items.length === 0) return

    const confirmMessage =
      typeLabel === 'history'
        ? 'Are you sure you want to clear your history?'
        : 'Are you sure you want to clear all favorites?'

    if (!window.confirm(confirmMessage)) return

    const prevItems = items

    // 1. Optimistic Update
    setItems([])
    LIST_CACHE[typeLabel] = []

    try {
      await clearFn()
      toast.success(`${typeLabel === 'history' ? 'History' : 'Favorites'} cleared`)
    } catch (e: any) {
      // Rollback
      setItems(prevItems)
      LIST_CACHE[typeLabel] = prevItems
      toast.error('Failed to clear items', e.message)
    }
  }, [items, typeLabel, clearFn, toast])

  return { items, loading, handleDelete, handleClearAll }
}

// --- Component: HistoryListOnly ---

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  refreshTrigger: number | undefined
  km_map: KhmerWordsMap | undefined
  maybeColorMode: MaybeColorizationMode
}

const HistoryListOnly: React.FC<ListPropsCommon> = React.memo(
  ({ onSelect, refreshTrigger, km_map, maybeColorMode }) => {
    const { items, loading, handleDelete, handleClearAll } = useListLogic(
      HistoryDb.getHistory,
      HistoryDb.removeHistoryItem,
      HistoryDb.deleteAllHistory,
      refreshTrigger,
      'history',
    )

    if (loading) return <LoadingState />
    if (items.length === 0) return <EmptyState type="history" />

    return (
      <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
          <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
            Recent History ({items.length})
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

        {/* List */}
        <AnimatePresence initial={false} mode="popLayout">
          {items.map(item => (
            <HistoryItemRow
              key={`${item.word}-${item.language}`}
              km_map={km_map}
              language={item.language}
              maybeColorMode={maybeColorMode}
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

HistoryListOnly.displayName = 'HistoryListOnly'

// --- Component: FavouritesListOnly ---

const FavouritesListOnly: React.FC<ListPropsCommon> = React.memo(
  ({ onSelect, refreshTrigger, km_map, maybeColorMode }) => {
    const toast = useToast()
    const { items, loading, handleDelete, handleClearAll } = useListLogic(
      FavDb.getFavorites,
      FavDb.removeFavorite,
      FavDb.deleteAllFavourites,
      refreshTrigger,
      'favorites',
    )

    // Anki State
    const [isAnkiOpen, setIsAnkiOpen] = useState(false)
    const [ankiDeck, setAnkiDeck] = useState<NonEmptySet<TypedContainsKhmer> | undefined>()

    const handleOpenAnki = useCallback(() => {
      if (!km_map) {
        toast.error('Dictionary not loaded yet')

        return
      }

      // Filter: only Khmer words that exist in dictionary
      const khmerFavorites: NonEmptySet<TypedContainsKhmer> | undefined = Set_toNonEmptySet_orUndefined(
        new Set(
          items.filter(i => i.language === 'km' && km_map.has(i.word)).map(i => strToContainsKhmerOrThrow(i.word)),
        ),
      )

      if (!khmerFavorites) {
        toast.error('No Khmer words in favorites to review')

        return
      }

      setAnkiDeck(khmerFavorites)
      setIsAnkiOpen(true)
    }, [items, km_map, toast])

    if (loading) return <LoadingState />
    if (items.length === 0) return <EmptyState type="favorites" />

    return (
      <>
        <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
            <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
              Favorites ({items.length})
            </span>
            <div className="flex gap-2">
              <Button
                className="h-8 text-tiny font-medium"
                color="secondary"
                size="sm"
                startContent={<FaGraduationCap />}
                variant="flat"
                onPress={handleOpenAnki}
              >
                Khmer Anki Mode
              </Button>
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
          </div>

          {/* List */}
          <AnimatePresence initial={false} mode="popLayout">
            {items.map(item => (
              <HistoryItemRow
                key={`${item.word}-${item.language}`}
                km_map={km_map}
                language={item.language}
                maybeColorMode={maybeColorMode}
                word={item.word}
                onDelete={handleDelete}
                onSelect={onSelect}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Modal */}
        {km_map && ankiDeck && (
          <KhmerAnkiModal
            isOpen={isAnkiOpen}
            items={ankiDeck}
            km_map={km_map} // Anki fetches details internally, but map used for basic checks if needed
            onClose={() => setIsAnkiOpen(false)}
          />
        )}
      </>
    )
  },
)

FavouritesListOnly.displayName = 'FavouritesListOnly'

// --- Main Wrapper Component ---

interface HistoryOrFavouritesListProps extends ListPropsCommon {
  type: 'history' | 'favorites'
}

export const HistoryOrFavouritesList: React.FC<HistoryOrFavouritesListProps> = React.memo(({ type, ...props }) => {
  // By keying the components with `type`, React will fully unmount one and mount the other.
  // The module-level cache ensures that when re-mounting, state is initialized instantly.
  if (type === 'history') {
    return <HistoryListOnly key="history" {...props} />
  }

  return <FavouritesListOnly key="favorites" {...props} />
})

HistoryOrFavouritesList.displayName = 'HistoryOrFavouritesList'
