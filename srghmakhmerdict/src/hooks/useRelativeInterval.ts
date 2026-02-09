import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { ValidNonNegativeNumber } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import type { PulseStore } from '../utils/createPulseStore'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Returns a human-readable relative time string (e.g., "in 5 minutes").
 * Updates automatically based on the provided PulseStore.
 */
export function useRelativeInterval(pulseStore: PulseStore, intervalDays: ValidNonNegativeNumber): string {
  // 1. Calculate the static target date.
  // This represents the "Due Date" if the user were to choose this interval *right now*.
  // We use useMemo with Date.now() to anchor the calculation to the moment 'intervalDays' changes.
  const targetTimestamp = useMemo(() => {
    return Date.now() + intervalDays * MS_PER_DAY
  }, [intervalDays])

  // 2. The Selector: Formats the time based on the target.
  // React 19 calls this whenever the store pulses.
  // Because useSyncExternalStore checks referential equality of the result,
  // the component ONLY re-renders when the text string actually changes.
  const getSnapshot = useCallback(() => {
    return formatDistanceToNow(targetTimestamp, { addSuffix: true })
  }, [targetTimestamp])

  return useSyncExternalStore(pulseStore.subscribe, getSnapshot)
}
