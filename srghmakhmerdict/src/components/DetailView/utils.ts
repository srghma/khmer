import {
  type NonEmptyArray,
  Array_toNonEmptyArray_orThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict'
import { colorizeHtml } from '../../utils/text-processing/html'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

export const processArrayColorized = (
  items: NonEmptyArray<NonEmptyStringTrimmed> | undefined,
  maybeColorMode: MaybeColorizationMode,
  km_map: KhmerWordsMap | undefined,
): NonEmptyArray<NonEmptyStringTrimmed> | undefined => {
  if (!items) return undefined
  if (maybeColorMode === 'none' || !km_map) return undefined

  return Array_toNonEmptyArray_orThrow(items.map(item => colorizeHtml(item, maybeColorMode, km_map)))
}
