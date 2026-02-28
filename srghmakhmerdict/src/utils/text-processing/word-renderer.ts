import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type MaybeColorizationMode } from './utils'
import { type FavoriteStatus } from '../favorite-status'

// Defined in App.css (.khmer--is-in-dictionary-color-0 through .khmer--is-in-dictionary-color-4)
const PALETTE_SIZE = 5

/**
 * Pure function to determine the CSS class for a Khmer word
 * based on colorization mode and dictionary status.
 */
export const getKhmerWordCssClass = (
  colorIndex: number,
  isKnown: boolean,
  mode: MaybeColorizationMode,
  ankiStatus?: FavoriteStatus,
): NonEmptyStringTrimmed => {
  const classes: string[] = ['khmer--word']

  if (mode !== 'none') {
    const safeIndex = colorIndex % PALETTE_SIZE

    if (isKnown) {
      classes.push(`khmer--is-in-dictionary-color-${safeIndex}`)
    } else {
      classes.push('khmer--is-not-in-dictionary')
    }
  }

  if (ankiStatus && ankiStatus !== 'none') {
    classes.push('anki--status')
    classes.push(`anki--status-${ankiStatus}`)
  }

  return classes.join(' ') as NonEmptyStringTrimmed
}

/**
 * Shared logic to generate the HTML span for a specific Khmer word
 * based on the map availability and the current color index.
 */
export const renderKhmerWordSpan = (
  word: TypedKhmerWord,
  colorIndex: number,
  isKnown: boolean,
  mode: MaybeColorizationMode,
  extraInfo: { ipa: NonEmptyStringTrimmed | undefined; def: NonEmptyStringTrimmed } | undefined,
  excludeWord: TypedKhmerWord | undefined,
  ankiStatus: FavoriteStatus,
): NonEmptyStringTrimmed => {
  const className = getKhmerWordCssClass(colorIndex, isKnown, mode, ankiStatus)
  const isExcluded = excludeWord === word

  if (isExcluded || !extraInfo || (!extraInfo.ipa && !extraInfo.def)) {
    return `<span class="${className}" data-navigate-khmer-word="${word}" data-word-index="${colorIndex}">${word}</span>` as NonEmptyStringTrimmed
  }

  const { ipa, def } = extraInfo
  const ipaHtml = ipa ? `<span class="ipa">${ipa}</span>` : ''
  const defHtml = def ? `<span class="short-def-preview" data-word="${word}">${def}</span>` : ''

  return `<span class="khmer-word-with-short-details" data-word-index="${colorIndex}"><span data-navigate-khmer-word="${word}" class="word ${className}">${word}</span>${ipaHtml}${defHtml}</span>` as NonEmptyStringTrimmed
}

/**
 * Renders a span for non-Khmer text to allow hiding functionality.
 * We use a specific class 'non-khmer-text' to target it in CSS.
 */
export const renderNonKhmerSpan = (text: NonEmptyStringTrimmed): NonEmptyStringTrimmed => {
  // We mark it with data-non-khmer-text for JS event delegation
  return `<span class="non-khmer-text" data-non-khmer-text>${text}</span>` as NonEmptyStringTrimmed
}
