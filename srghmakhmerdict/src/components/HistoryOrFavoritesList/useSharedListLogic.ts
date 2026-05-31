import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useLocalStorageState } from 'ahooks'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { isWordInKmMap } from '../../utils/isWordInKmMap'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { useDictionary } from '../../providers/DictionaryProvider'
import { type ListFilters } from './ListFilterModal'
import { useListLogic } from './useListLogic'
import { useLocation } from 'wouter'

export interface SharedListItem {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
}

interface UseSharedListLogicOptions<T extends SharedListItem> {
  items: T[]
  storageKeyPrefix: 'history' | 'favorites'
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  removeFn: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
  clearAllFn: () => Promise<void>
}

export function useSharedListLogic<T extends SharedListItem>({
  items,
  storageKeyPrefix,
  onNavigate,
  removeFn,
  clearAllFn,
}: UseSharedListLogicOptions<T>) {
  const { km_map, en, ru } = useDictionary()
  const { handleDelete: originalHandleDelete, handleClearAll } = useListLogic(removeFn, clearAllFn)

  const [blinkKey, setBlinkKey] = useState<string | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const hasSelection = selectedKeys.size > 0

  const [filters, setFilters] = useLocalStorageState<ListFilters>(`srghmakhmerdict__${storageKeyPrefix}_filters`, {
    defaultValue: { en: true, km: true, ru: true, analyzer: true },
  })

  const filteredItems = useMemo(() => {
    const activeFilters = filters || { en: true, km: true, ru: true, analyzer: true }

    return items.filter(item => {
      let isSentence = false

      if (item.language === 'km') {
        const khmerWord = strToContainsKhmerOrUndefined(item.word)

        isSentence = !khmerWord || !isWordInKmMap(khmerWord, km_map)
      } else if (item.language === 'en') {
        isSentence = !en.has(item.word)
      } else if (item.language === 'ru') {
        isSentence = !ru.has(item.word)
      }

      if (isSentence) return activeFilters.analyzer

      return activeFilters[item.language as keyof ListFilters] ?? true
    })
  }, [items, filters, km_map, en, ru])

  const listRef = useRef<any>(null)
  const [location] = useLocation()
  const scrollProcessedRef = useRef({ location: '', processed: false })

  useEffect(() => {
    if (scrollProcessedRef.current.location === location && scrollProcessedRef.current.processed) {
      return
    }

    if (filteredItems.length === 0) return // Wait for items to load

    scrollProcessedRef.current = { location, processed: true }

    const sessionKey = 'last_opened_item_key'
    const lastClickedKey = sessionStorage.getItem(sessionKey)

    if (lastClickedKey) {
      const idx = filteredItems.findIndex(item => `${item.word}-${item.language}` === lastClickedKey)

      if (idx !== -1) {
        setBlinkKey(lastClickedKey)
        setTimeout(() => setBlinkKey(null), 2000)

        let attempts = 0
        const attemptScroll = () => {
          if (listRef.current) {
            listRef.current.scrollToIndex(idx, 'center')
          }
          if (++attempts < 10) {
            setTimeout(attemptScroll, 100)
          }
        }
        setTimeout(attemptScroll, 50)
      }
    }
  }, [filteredItems, location])

  const handleNavigate = useCallback(
    (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
      sessionStorage.setItem('last_opened_item_key', `${word}-${mode}`)
      onNavigate(word, mode)
    },
    [onNavigate],
  )

  const handleToggleSelection = useCallback((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
    const key = `${word}-${mode}`

    setSelectedKeys(prev => {
      const next = new Set(prev)

      if (next.has(key)) next.delete(key)
      else next.add(key)

      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const allKeys = filteredItems.map(item => `${item.word}-${item.language}`)
    setSelectedKeys(new Set(allKeys))
  }, [filteredItems])

  const handleDeselectAll = useCallback(() => {
    setSelectedKeys(new Set())
  }, [])

  useEffect(() => {
    if (hasSelection) {
      window.history.pushState({ selectionMode: true }, '')
    }

    const onPopState = () => {
      if (hasSelection) {
        setSelectedKeys(new Set())
      }
    }

    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [hasSelection])

  const handleClearSelectedOrAll = useCallback(() => {
    if (hasSelection) {
      Array.from(selectedKeys).forEach(key => {
        const item = filteredItems.find(i => `${i.word}-${i.language}` === key)

        if (item) originalHandleDelete(item.word, item.language)
      })
      setSelectedKeys(new Set())
    } else {
      handleClearAll()
    }
  }, [hasSelection, selectedKeys, filteredItems, originalHandleDelete, handleClearAll])

  const itemsToExport = hasSelection
    ? filteredItems.filter(i => selectedKeys.has(`${i.word}-${i.language}`))
    : filteredItems

  const titleText = hasSelection ? `${selectedKeys.size}/${filteredItems.length}` : `${filteredItems.length}`

  return {
    listRef,
    filteredItems,
    filters,
    setFilters,
    selectedKeys,
    hasSelection,
    blinkKey,
    itemsToExport,
    titleText,
    handleNavigate,
    handleToggleSelection,
    handleSelectAll,
    handleDeselectAll,
    handleDeleteItem: originalHandleDelete,
    handleClearSelectedOrAll,
  }
}
