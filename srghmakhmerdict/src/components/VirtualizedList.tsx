import React, { useRef, useCallback, useEffect, useImperativeHandle, memo, useMemo } from 'react'
import { useVirtualizer, defaultRangeExtractor, type Range, type VirtualItem } from '@tanstack/react-virtual'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { CharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import type { CharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
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

export interface VirtualizedListHandle {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void
  scrollToOffset: (offset: number) => void
}

// --- 1. Sub-component for efficient updates ---
interface RowItemProps<T> {
  item: T
  virtualRow: VirtualItem
  isSticky: boolean
  isActiveSticky: boolean
  renderItem: (item: T, virtualRow: VirtualItem, isSticky: boolean, isActiveSticky: boolean) => React.ReactNode
  measureElement: (element: HTMLElement | null) => void
}

const RowItem = memo(function RowItem<T>({
  item,
  virtualRow,
  isSticky,
  isActiveSticky,
  renderItem,
  measureElement,
}: RowItemProps<T>) {
  const style: React.CSSProperties = {
    transform: `translateY(${virtualRow.start}px)`,
    zIndex: isSticky ? 5 : 1,
    ...(isActiveSticky ? { position: 'sticky', transform: 'none', top: 0 } : {}),
  }

  return (
    <div ref={measureElement} className="absolute top-0 left-0 w-full" data-index={virtualRow.index} style={style}>
      {renderItem(item, virtualRow, isSticky, isActiveSticky)}
    </div>
  )
}) as <T>(props: RowItemProps<T>) => React.ReactElement | null

// --- 2. Main List Component ---

export interface VirtualizedListProps<T> {
  items: readonly T[]
  stickyIndexes?: number[]
  onActiveHeaderChange?: (index: number) => void
  renderItem: (item: T, virtualRow: VirtualItem, isSticky: boolean, isActiveSticky: boolean) => React.ReactNode
  estimateSize: (index: number) => number
  keyExtractor: (item: T, index: number) => string
}

export const VirtualizedList = memo(
  React.forwardRef(function VirtualizedList<T>(
    {
      items,
      stickyIndexes = [],
      onActiveHeaderChange,
      renderItem,
      estimateSize,
      keyExtractor,
    }: VirtualizedListProps<T>,
    ref: React.ForwardedRef<VirtualizedListHandle>,
  ) {
    const parentRef = useRef<HTMLDivElement>(null)
    const activeStickyIndexRef = useRef(0)
    const lastReportedIndexRef = useRef(-1)

    const rowVirtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize,
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

      if (!el || !onActiveHeaderChange) return

      const handleScroll = () => {
        const current = activeStickyIndexRef.current

        if (current !== lastReportedIndexRef.current) {
          lastReportedIndexRef.current = current
          onActiveHeaderChange(current)
        }
      }

      el.addEventListener('scroll', handleScroll, { passive: true })

      return () => el.removeEventListener('scroll', handleScroll)
    }, [onActiveHeaderChange])

    const virtualItems = rowVirtualizer.getVirtualItems()
    const totalSize = rowVirtualizer.getTotalSize()
    const stickySet = useMemo(() => new Set(stickyIndexes), [stickyIndexes])

    const listContent = useMemo(() => {
      return (
        <div style={{ height: `${totalSize}px`, width: '100%', position: 'relative' }}>
          {virtualItems.map(vRow => {
            const item = items[vRow.index]

            if (item === undefined) return null

            const isSticky = stickySet.has(vRow.index)
            const isActiveSticky = isSticky && activeStickyIndexRef.current === vRow.index

            return (
              <RowItem
                key={keyExtractor(item, vRow.index)}
                isActiveSticky={isActiveSticky}
                isSticky={isSticky}
                item={item}
                measureElement={rowVirtualizer.measureElement as any}
                renderItem={renderItem}
                virtualRow={vRow}
              />
            )
          })}
        </div>
      )
    }, [virtualItems, totalSize, items, stickySet, renderItem, keyExtractor])

    return (
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto contain-strict bg-content1 relative pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {listContent}
      </div>
    )
  }),
) as <T>(props: VirtualizedListProps<T> & { ref?: React.Ref<VirtualizedListHandle> }) => React.ReactElement | null
