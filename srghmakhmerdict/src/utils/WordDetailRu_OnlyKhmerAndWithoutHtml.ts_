import {
  strToOnlyKhmerAndWithoutHtml_remove_orUndefined,
  type TypedOnlyKhmerAndWithoutHtml,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-only-khmer-and-without-html'
import type { WordDetailRu } from '../db/dict'
import { undefined_lift } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/undefined'
import { type Lazy, defer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/lazy'

export type WordDetailRu_OnlyKhmerAndWithoutHtml = {
  desc: Lazy<TypedOnlyKhmerAndWithoutHtml | undefined>
}

const strToOnlyKhmerAndWithoutHtml_remove_orUndefined_ = undefined_lift(strToOnlyKhmerAndWithoutHtml_remove_orUndefined)

export const wordDetailRu_OnlyKhmerAndWithoutHtml_mk = (x: WordDetailRu): WordDetailRu_OnlyKhmerAndWithoutHtml => {
  return {
    // Expensive fields -> wrapped in defer
    desc: defer(() => strToOnlyKhmerAndWithoutHtml_remove_orUndefined_(x.desc)),
  }
}

// Helper to pick the best Khmer translation from the DB object
export const getBestDefinitionKhmerFromRu = (detail: WordDetailRu): TypedOnlyKhmerAndWithoutHtml | undefined => {
  const lazy = wordDetailRu_OnlyKhmerAndWithoutHtml_mk(detail)

  return lazy.desc()
}
