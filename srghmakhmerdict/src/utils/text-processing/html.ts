import { replaceHtmlTextNodesWithMaybeOtherHtml } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/replaceHtmlTextNodesWithMaybeOtherHtml'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict'
import { type ColorizationMode } from './utils'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { yieldTextSegments, colorizeSegments_usingWordCounterRef } from './text'

export const colorizeHtml = (
  html: TypedContainsKhmer,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): TypedContainsKhmer => {
  const wordCounterRef = { current: 0 }

  const serializedHtml = replaceHtmlTextNodesWithMaybeOtherHtml(
    document.createElement('div'),
    html,
    (textContent: NonEmptyStringTrimmed): NonEmptyStringTrimmed => {
      // 1. Get the generator for segments
      const segmentsGenerator = yieldTextSegments(textContent, mode, km_map)

      // 2. Consume generator directly into the colorizer
      // This avoids creating the Segment array entirely within the text node processing
      return colorizeSegments_usingWordCounterRef(segmentsGenerator, km_map, wordCounterRef)
    },
  ) as TypedContainsKhmer

  return serializedHtml.replace(
    /<font\s+color=["']?(?:blue|#000099)["']?>(.*?)<\/font>/gi,
    '<span class="khmer--blue-lbl">$1</span>',
  ) as TypedContainsKhmer
}

export const colorizeHtml_allowUndefined = (
  html: TypedContainsKhmer | undefined,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): TypedContainsKhmer | undefined => {
  return html ? colorizeHtml(html, mode, km_map) : undefined
}
