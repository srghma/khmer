import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// Defined in App.css (.khmer--is-in-dictionary-color-0 through .khmer--is-in-dictionary-color-4)
const PALETTE_SIZE = 5

/**
 * Pure function to determine the CSS class for a Khmer word
 * based on colorization mode and dictionary status.
 */
export const getKhmerWordCssClass = (colorIndex: number, isKnown: boolean): NonEmptyStringTrimmed => {
  const safeIndex = colorIndex % PALETTE_SIZE

  // Dictionary Mode
  if (isKnown) {
    return `khmer--is-in-dictionary-color-${safeIndex}` as NonEmptyStringTrimmed
  } else {
    return 'khmer--is-not-in-dictionary' as NonEmptyStringTrimmed
  }
}

/**
 * Shared logic to generate the HTML span for a specific Khmer word
 * based on the map availability and the current color index.
 */
export const renderKhmerWordSpan = (
  word: TypedKhmerWord,
  colorIndex: number,
  isKnown: boolean,
): NonEmptyStringTrimmed => {
  const className = getKhmerWordCssClass(colorIndex, isKnown)

  return `<span class="${className}" data-navigate-khmer-word="${word}">${word}</span>` as NonEmptyStringTrimmed
}
