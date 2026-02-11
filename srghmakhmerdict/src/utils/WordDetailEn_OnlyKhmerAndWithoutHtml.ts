import {
  strToOnlyKhmerAndWithoutHtml_remove_orUndefined,
  type TypedOnlyKhmerAndWithoutHtml,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-only-khmer-and-without-html'
import type { ShortDefinitionEn, WordDetailEn } from '../db/dict'
import { undefined_lift } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/undefined'
import { type Lazy, defer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/lazy'

export type WordDetailEn_OnlyKhmerAndWithoutHtml = {
  desc: Lazy<TypedOnlyKhmerAndWithoutHtml | undefined> // Main definition, extracting Khmer parts
  en_km_com: Lazy<TypedOnlyKhmerAndWithoutHtml | undefined> // html
}

const strToOnlyKhmerAndWithoutHtml_remove_orUndefined_ = undefined_lift(strToOnlyKhmerAndWithoutHtml_remove_orUndefined)

export const wordDetailEn_OnlyKhmerAndWithoutHtml_mk = (x: WordDetailEn): WordDetailEn_OnlyKhmerAndWithoutHtml => {
  return {
    desc: defer(() => strToOnlyKhmerAndWithoutHtml_remove_orUndefined_(x.desc)),
    en_km_com: defer(() => strToOnlyKhmerAndWithoutHtml_remove_orUndefined_(x.en_km_com)),
  }
}

export const getBestDefinitionKhmerFromEn = (detail: WordDetailEn): TypedOnlyKhmerAndWithoutHtml | undefined => {
  const lazy = wordDetailEn_OnlyKhmerAndWithoutHtml_mk(detail)

  return lazy.desc() || lazy.en_km_com()
}

export const getBestDefinitionKhmerFromEn_fromShort = (
  shortDef: ShortDefinitionEn,
): TypedOnlyKhmerAndWithoutHtml | undefined => {
  // Skip sources that are explicitly English-only
  if (shortDef.source === 'DescEnOnly') return undefined

  // Process the definition string to extract only Khmer parts and remove HTML
  return strToOnlyKhmerAndWithoutHtml_remove_orUndefined(shortDef.definition)
}
