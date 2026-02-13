import {
  strToOnlyKhmerAndWithoutHtml_remove_orUndefined,
  type TypedOnlyKhmerAndWithoutHtml,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-only-khmer-and-without-html'
import type { ShortDefinitionEn, WordDetailEn } from '../db/dict'
import { undefined_lift } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/undefined'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

type Processor<K extends keyof WordDetailEn> = (x: WordDetailEn[K]) => TypedOnlyKhmerAndWithoutHtml | undefined

const strToOnlyKhmerAndWithoutHtml_remove_orUndefined_ = undefined_lift(strToOnlyKhmerAndWithoutHtml_remove_orUndefined)

export const processors: { [K in keyof WordDetailEn]-?: Processor<K> } = {
  word_display: () => undefined,
  desc: x => strToOnlyKhmerAndWithoutHtml_remove_orUndefined_(x),
  desc_en_only: () => undefined, // Skip sources that are explicitly English-only
  en_km_com: x => strToOnlyKhmerAndWithoutHtml_remove_orUndefined_(x),
}

export const getBestDefinitionKhmerFromEn = (
  detail: WordDetailEn,
): { t: ShortDefinitionEn['source']; v: TypedOnlyKhmerAndWithoutHtml } | undefined => {
  const desc = processors.desc(detail.desc)

  if (desc) return { t: 'Desc', v: desc }

  const en_km_com = processors.en_km_com(detail.en_km_com)

  if (en_km_com) return { t: 'EnKmCom', v: en_km_com }

  return undefined
}

export const getBestDefinitionKhmerFromEn_fromShort = (
  shortDef: ShortDefinitionEn,
): TypedOnlyKhmerAndWithoutHtml | undefined => {
  switch (shortDef.source) {
    case 'DescEnOnly':
      return processors.desc_en_only(shortDef.definition)
    case 'EnKmCom':
      return processors.en_km_com(shortDef.definition)
    case 'Desc':
      return processors.desc(shortDef.definition)
    default:
      return assertNever(shortDef.source)
  }
}
