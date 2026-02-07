import { useRef, useEffect, useCallback } from 'react'
import { type VirtualizedListHandle } from '../components/VirtualizedList'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { renderWordMatch } from '../components/WordList.utils'

interface UseWordListCommonProps {
  exactMatchIndex: number
  searchQuery: NonEmptyStringTrimmed | undefined
  highlightMatch: boolean | undefined
}

export function useWordListCommon({ exactMatchIndex, searchQuery, highlightMatch }: UseWordListCommonProps) {
  const listRef = useRef<VirtualizedListHandle>(null)

  // 1. Auto-scroll to exact match
  useEffect(() => {
    if (exactMatchIndex !== -1 && listRef.current) {
      listRef.current.scrollToIndex(exactMatchIndex, 'center')
    }
  }, [exactMatchIndex])

  // 2. Memoized Item Renderer
  // We explicitly type the function to match VirtualizedList expectations
  const renderWordItem = useCallback(
    (w: NonEmptyStringTrimmed) => renderWordMatch(w, searchQuery, highlightMatch),
    [searchQuery, highlightMatch],
  )

  // 3. Helper to scroll to specific index safely
  const scrollToIndex = useCallback(
    (index: number | undefined, align: 'start' | 'center' | 'end' | 'auto' = 'start') => {
      if (index !== undefined && index !== -1) {
        listRef.current?.scrollToIndex(index, align)
      }
    },
    [],
  )

  return {
    listRef,
    renderWordItem,
    scrollToIndex,
  }
}
