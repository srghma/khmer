import {
  strToOnlyKhmerAndWithoutHtml_remove_orUndefined,
  type TypedOnlyKhmerAndWithoutHtml,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-only-khmer-and-without-html'
import type { ShortDefinitionRu, WordDetailRu } from '../db/dict'
import { undefined_lift } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/undefined'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

type Processor<K extends keyof WordDetailRu> = (x: WordDetailRu[K]) => TypedOnlyKhmerAndWithoutHtml | undefined

const strToOnlyKhmerAndWithoutHtml_remove_orUndefined_ = undefined_lift(strToOnlyKhmerAndWithoutHtml_remove_orUndefined)

export const processors: { [K in keyof WordDetailRu]-?: Processor<K> } = {
  word_display: () => undefined,
  desc: x => strToOnlyKhmerAndWithoutHtml_remove_orUndefined_(x),
}

// Helper to pick the best Khmer translation from the DB object
export const getBestDefinitionKhmerFromRu = (
  detail: WordDetailRu,
): { t: ShortDefinitionRu['source']; v: TypedOnlyKhmerAndWithoutHtml } | undefined => {
  const desc = processors.desc(detail.desc)

  if (desc) return { t: 'Desc', v: desc }

  return undefined
}

export const getBestDefinitionKhmerFromRu_fromShort = (
  shortDef: ShortDefinitionRu,
): TypedOnlyKhmerAndWithoutHtml | undefined => {
  switch (shortDef.source) {
    case 'Desc':
      return processors.desc(shortDef.definition)
    default:
      return assertNever(shortDef.source)
  }
}
