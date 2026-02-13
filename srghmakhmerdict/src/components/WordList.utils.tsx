import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { SearchMode } from '../providers/SettingsProvider'

export const renderWordMatch = (
  word: NonEmptyStringTrimmed,
  query: NonEmptyStringTrimmed | undefined,
  highlight: boolean,
  searchMode: SearchMode,
) => {
  if (!highlight || !query) return word

  let regex: RegExp

  try {
    if (searchMode === 'regex') {
      regex = new RegExp(`(${query})`, 'gi')
    } else if (searchMode === 'starts_with') {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      regex = new RegExp(`^(${escaped})`, 'gi')
    } else {
      // includes
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      regex = new RegExp(`(${escaped})`, 'gi')
    }
  } catch {
    return word
  }

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
