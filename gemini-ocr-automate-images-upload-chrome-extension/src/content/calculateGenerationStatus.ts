import { type RunButtonState } from './runButton'

const STABILITY_THRESHOLD_SECONDS = 2

/**
 * Pure function to determine generation status.
 * Returns the next tick count and whether the process is finished.
 */
export function calculateGenerationStatus(
  currentText: string,
  lastText: string,
  currentTicks: number,
  runButtonState: RunButtonState | undefined,
): { isFinished: boolean; nextTicks: number } {
  // 1. If text is empty or has changed, we are unstable. Reset ticks.
  if (!currentText || currentText !== lastText) {
    return { isFinished: false, nextTicks: 0 }
  }

  // 2. Text is identical to last tick. Increment stability counter.
  const nextTicks = currentTicks + 1

  // 3. Check if stop button is active (meaning generation is still running)
  const isStopButtonActive =
    runButtonState === 'stop_button__disabled_bc_maybe_running' || runButtonState === 'stop_button__ready'

  // 4. Check termination conditions:
  //    - Text must be stable for N seconds.
  //    - The "Stop" button must NOT be active (meaning generation is truly done).
  const isTimeThresholdMet = nextTicks >= STABILITY_THRESHOLD_SECONDS
  const isFinished = isTimeThresholdMet && !isStopButtonActive

  return { isFinished, nextTicks }
}
