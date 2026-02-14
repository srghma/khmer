import {
  type NonEmptyArray,
  Array_toNonEmptyArray_orThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict'
import { colorizeHtml } from '../../utils/text-processing/html'
import type { ColorizationMode } from '../../utils/text-processing/utils'
import { isContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'

export const colorizeHtml_nonEmptyArray = (
  items: NonEmptyArray<NonEmptyStringTrimmed> | undefined,
  colorMode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyArray<NonEmptyStringTrimmed> | undefined => {
  if (!items) return undefined

  return Array_toNonEmptyArray_orThrow(
    items.map(item => (isContainsKhmer(item) ? colorizeHtml(item, colorMode, km_map) : item)),
  )
}
