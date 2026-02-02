import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

export const GROUP_COLORS = [
  'bg-slate-50 dark:bg-slate-900',
  'bg-red-50 dark:bg-red-950/30',
  'bg-orange-50 dark:bg-orange-950/30',
  'bg-amber-50 dark:bg-amber-950/30',
  'bg-yellow-50 dark:bg-yellow-950/30',
  'bg-lime-50 dark:bg-lime-950/30',
  'bg-green-50 dark:bg-green-950/30',
  'bg-emerald-50 dark:bg-emerald-950/30',
  'bg-teal-50 dark:bg-teal-950/30',
  'bg-cyan-50 dark:bg-cyan-950/30',
  'bg-sky-50 dark:bg-sky-950/30',
  'bg-blue-50 dark:bg-blue-950/30',
  'bg-indigo-50 dark:bg-indigo-950/30',
  'bg-violet-50 dark:bg-violet-950/30',
  'bg-purple-50 dark:bg-purple-950/30',
  'bg-fuchsia-50 dark:bg-fuchsia-950/30',
  'bg-pink-50 dark:bg-pink-950/30',
  'bg-rose-50 dark:bg-rose-950/30',
] as const

export function mkColorRotator() {
  let index = -1

  return {
    nextAndIncrement: () => assertIsDefinedAndReturn(GROUP_COLORS[index++ % GROUP_COLORS.length]),
    reset: () => {
      index = 0
    },
  }
}
