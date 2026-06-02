import { useRef, useEffect, useCallback, useState } from 'react'
import { type VirtualizedListHandle } from '../components/VirtualizedList'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { renderWordMatch } from '../components/WordList.utils'
import type { SearchMode } from '../providers/SettingsProvider'

interface UseWordListCommonProps {
  exactMatchIndex: number
  searchQuery: NonEmptyStringTrimmed | undefined
  highlightMatch: boolean
  searchMode: SearchMode
}

export function useWordListCommon({
  exactMatchIndex,
  searchQuery,
  highlightMatch,
  searchMode,
}: UseWordListCommonProps) {
  const listRef = useRef<VirtualizedListHandle>(null)

  const [blinkKey, setBlinkKey] = useState<string | null>(null)

  // 1. Auto-scroll to exact match or URL query param
  useEffect(() => {
    let targetIndex = exactMatchIndex

    const urlParams = new URLSearchParams(window.location.search)
    const scrollToWord = urlParams.get('scrollTo')

    if (targetIndex === -1 && scrollToWord && listRef.current) {
      // Find index of the scrollToWord if it exists in the list?
      // Wait, we don't have access to the items list here to find the index easily.
      // But we can let the parent pass it down? Or maybe just rely on the exactMatchIndex.
      // Actually, we don't have the list here. Let's just use exactMatchIndex for now
      // and let the parent handle the scrollTo if needed.
    }

    if (targetIndex !== -1 && listRef.current) {
      setBlinkKey(scrollToWord || null)
      setTimeout(() => setBlinkKey(null), 2000)

      let attempts = 0
      const attemptScroll = () => {
        if (listRef.current) {
          listRef.current.scrollToIndex(targetIndex, 'center')
        }
        if (++attempts < 10) {
          setTimeout(attemptScroll, 100)
        }
      }

      setTimeout(attemptScroll, 50)
    }
  }, [exactMatchIndex])

  // 2. Memoized Item Renderer
  // We explicitly type the function to match VirtualizedList expectations
  const renderWordItem = useCallback(
    (w: NonEmptyStringTrimmed) => {
      const isBlinking = blinkKey === w
      const content = renderWordMatch(w, searchQuery, highlightMatch, searchMode)

      if (isBlinking) {
        return (
          <div
            style={{
              backgroundColor: 'var(--heroui-warning-100, rgba(245, 165, 36, 0.4))',
              transition: 'background-color 0.3s ease',
            }}
          >
            {content}
          </div>
        )
      }

      return content
    },
    [searchQuery, highlightMatch, searchMode, blinkKey],
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
