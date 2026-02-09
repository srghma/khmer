import { strToOnlyKhmer_remove_orUndefined, type TypedOnlyKhmer } from './string-only-khmer'
import { stripHtml } from './strip-html'

export type TypedOnlyKhmerAndWithoutHtml = TypedOnlyKhmer & {
  readonly __brandTypedOnlyKhmerAndWithoutHtml: 'TypedOnlyKhmerAndWithoutHtml'
}

export const strToOnlyKhmerAndWithoutHtml_remove_orUndefined = (
  value: string,
): TypedOnlyKhmerAndWithoutHtml | undefined => {
  if (!value) return undefined

  // 1. Strip HTML tags
  // 2. Remove non-Khmer characters
  return strToOnlyKhmer_remove_orUndefined(stripHtml(value)) as TypedOnlyKhmerAndWithoutHtml | undefined
}

export const strToOnlyKhmerAndWithoutHtml_remove_orThrow = (value: string): TypedOnlyKhmerAndWithoutHtml => {
  const v = strToOnlyKhmerAndWithoutHtml_remove_orUndefined(value)
  if (!v) throw new Error(`Invalid OnlyKhmerAndWithoutHtml format: '${value}'`)
  return v
}
