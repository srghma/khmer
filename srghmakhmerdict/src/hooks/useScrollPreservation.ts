import { useCallback, useRef, useLayoutEffect } from 'react'
import { findCenterWordIndex } from '../utils/scroll-utils'

/**
 * Hook to preserve scroll position when a layout shift occurs (e.g., toggling short details).
 * It identifies the word closest to the center of the scrollable container and restores it after the update.
 *
 * @param scrollContainerRef Reference to the scrollable container element
 * @param dependencies Any dependencies that trigger a layout shift (e.g., [isShowShortDetailAboutKhmerWordEnabled])
 * @returns An object with handleToggle callback to be used for the toggle action
 */
export function useScrollPreservation(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  dependencies: React.DependencyList,
) {
  const centerWordIndexBeforeToggle = useRef<number | null>(null)

  const captureScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      centerWordIndexBeforeToggle.current = findCenterWordIndex(scrollContainerRef.current)
    }
  }, [scrollContainerRef])

  useLayoutEffect(() => {
    if (centerWordIndexBeforeToggle.current !== null && scrollContainerRef.current) {
      const index = centerWordIndexBeforeToggle.current

      centerWordIndexBeforeToggle.current = null

      const elements = scrollContainerRef.current.querySelectorAll(`[data-word-index="${index}"]`)

      if (elements.length > 0) {
        const target = elements[0] as HTMLElement
        const container = scrollContainerRef.current
        const containerRect = container.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()

        const scrollDelta = targetRect.top + targetRect.height / 2 - (containerRect.top + containerRect.height / 2)

        container.scrollTop += scrollDelta
      }
    }
  }, [scrollContainerRef, ...dependencies])

  return { captureScrollPosition }
}
