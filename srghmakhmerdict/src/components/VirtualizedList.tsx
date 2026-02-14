import React, { useRef, useCallback, useEffect, useImperativeHandle, memo, useMemo } from 'react'
import { useVirtualizer, defaultRangeExtractor, type Range, type VirtualItem } from '@tanstack/react-virtual'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { CharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import type { CharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { LocalizedString } from 'typesafe-i18n'

export type FlatListItem =
  | {
      type: 'header'
      label:
        | '*'
        | 'Found in content'
        | CharUppercaseLatin
        | CharUppercaseCyrillic
        | NonEmptyStringTrimmed
        | LocalizedString // TODO: maybe pass ProcessDataOutputKhmerCursor_FirstAndSecondLevel instead of NonEmptyStringTrimmed?
      bgClass: string
      index: number
    }
  | { type: 'word'; word: NonEmptyStringTrimmed; bgClass: string }

const HEADER_HEIGHT = 48
const ITEM_HEIGHT = 32

export interface VirtualizedListHandle {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void
  scrollToOffset: (offset: number) => void
}

// --- 1. Sub-component for efficient updates ---
// extracting this ensures only new/changed rows render, not the whole list on scroll
interface RowItemProps {
  item: FlatListItem
  virtualRow: VirtualItem
  isSticky: boolean
  isActiveSticky: boolean
  renderWord: (word: NonEmptyStringTrimmed) => React.ReactNode
  onWordClick: (word: NonEmptyStringTrimmed) => void
}

const RowItem = memo<RowItemProps>(({ item, virtualRow, isSticky, isActiveSticky, renderWord, onWordClick }) => {
  // Compute style only when positioning changes
  const style: React.CSSProperties = {
    height: `${virtualRow.size}px`,
    transform: `translateY(${virtualRow.start}px)`,
    zIndex: isSticky ? 5 : 1,
    // Sticky logic: overrides transform when active to stick to top of container
    ...(isActiveSticky ? { position: 'sticky', transform: 'none', top: 0 } : {}),
  }

  const onClick = useCallback(() => (item.type === 'header' ? undefined : onWordClick(item.word)), [item, onWordClick])

  return (
    <div className="absolute top-0 left-0 w-full" style={style}>
      {item.type === 'header' ? (
        <div
          className={`h-full border-b border-divider flex items-center px-6 font-bold shadow-sm backdrop-blur-md text-xl font-khmer ${item.bgClass}`}
        >
          {item.label}
        </div>
      ) : (
        <button
          className={`h-full flex items-center px-6 border-b border-divider hover:brightness-95 dark:hover:brightness-110 w-full text-left transition-all ${item.bgClass}`}
          onClick={onClick}
        >
          <span className="text-foreground-900 font-khmer text-base leading-snug">{renderWord(item.word)}</span>
        </button>
      )}
    </div>
  )
})

RowItem.displayName = 'RowItem'

// --- 2. Main List Component ---

interface Props {
  items: FlatListItem[]
  stickyIndexes: number[]
  onWordClick: (word: NonEmptyStringTrimmed) => void
  onActiveHeaderChange: (index: number) => void
  renderWord: (word: NonEmptyStringTrimmed) => React.ReactNode
  ref: React.RefObject<VirtualizedListHandle | null>
}

export const VirtualizedList = React.memo(
  ({ items, stickyIndexes, onWordClick, onActiveHeaderChange, renderWord, ref }: Props) => {
    const parentRef = useRef<HTMLDivElement>(null)
    const activeStickyIndexRef = useRef(0)
    const lastReportedIndexRef = useRef(-1)

    const rowVirtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: idx => (items[idx]?.type === 'header' ? HEADER_HEIGHT : ITEM_HEIGHT),
      overscan: 10,
      rangeExtractor: useCallback(
        (range: Range) => {
          const activeIdx = [...stickyIndexes].reverse().find(i => range.startIndex >= i) ?? 0

          activeStickyIndexRef.current = activeIdx

          return [...new Set([activeIdx, ...defaultRangeExtractor(range)])].sort((a, b) => a - b)
        },
        [stickyIndexes],
      ),
    })

    useImperativeHandle(ref, () => ({
      scrollToIndex: (idx, align = 'start') => rowVirtualizer.scrollToIndex(idx, { align }),
      scrollToOffset: offset => rowVirtualizer.scrollToOffset(offset),
    }))

    useEffect(() => {
      const el = parentRef.current

      if (!el) return

      const handleScroll = () => {
        const current = activeStickyIndexRef.current

        // 3. Optimization: Only trigger parent update if the section actually changed
        if (current !== lastReportedIndexRef.current) {
          lastReportedIndexRef.current = current
          onActiveHeaderChange(current)
        }
      }

      el.addEventListener('scroll', handleScroll, { passive: true })

      return () => el.removeEventListener('scroll', handleScroll)
    }, [onActiveHeaderChange])

    // Extract values needed for rendering to dependencies
    const virtualItems = rowVirtualizer.getVirtualItems()
    const totalSize = rowVirtualizer.getTotalSize()

    // Convert stickyIndexes array to Set for O(1) lookup in the render loop
    const stickySet = useMemo(() => new Set(stickyIndexes), [stickyIndexes])

    const listContent = useMemo(() => {
      return (
        <div style={{ height: `${totalSize}px`, width: '100%', position: 'relative' }}>
          {virtualItems.map(vRow => {
            const item = assertIsDefinedAndReturn(items[vRow.index])
            const isSticky = stickySet.has(vRow.index)
            // Accessing the ref here works because virtualizer changes state (and triggers render)
            // when the rangeExtractor logic updates the active index.
            const isActiveSticky = isSticky && activeStickyIndexRef.current === vRow.index

            return (
              <RowItem
                key={vRow.key}
                isActiveSticky={isActiveSticky}
                isSticky={isSticky}
                item={item}
                renderWord={renderWord}
                virtualRow={vRow}
                onWordClick={onWordClick}
              />
            )
          })}
        </div>
      )
    }, [virtualItems, totalSize, items, stickySet, renderWord, onWordClick])

    return (
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto contain-strict bg-content1 relative pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {listContent}
      </div>
    )
  },
)

VirtualizedList.displayName = 'VirtualizedList'
