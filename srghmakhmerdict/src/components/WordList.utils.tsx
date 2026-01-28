import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export const renderWordMatch = (word: NonEmptyStringTrimmed, query?: string, highlight?: boolean) => {
  if (!highlight || !query) return word
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

  return word.split(regex).map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-yellow-200 dark:bg-yellow-900/50">
        {part}
      </span>
    ) : (
      part
    ),
  )
}
