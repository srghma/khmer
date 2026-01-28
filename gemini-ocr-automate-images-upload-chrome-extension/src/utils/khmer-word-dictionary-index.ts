// Copyright 2023 srghma

import {
  type NonEmptySet,
  Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined,
} from './non-empty-set'
import { type NonEmptyStringTrimmed } from './non-empty-string-trimmed'

const regexes = [
  // allow ending with [ៗ]
  // allow ending with \sៗ
  /^\p{Script=Khmer}+( ៗ|\[ៗ\])?$/u,
  // allow this pattern **មិនទាន់ ... ផង**
  /^\p{Script=Khmer}+\s*\.\.\.\s*\p{Script=Khmer}+$/u,
  // allow this pattern **ខេ ៗ ខូ ៗ**
  /^\p{Script=Khmer}+ ៗ \p{Script=Khmer}+ ៗ$/u,
  // allow this pattern **រឃុក រឃាក់**
  /^\p{Script=Khmer}+ \p{Script=Khmer}+$/u,
  // only for csv START
  /^\p{Script=Khmer}+-\p{Script=Khmer}+$/u,
  /^\p{Script=Khmer}+ \p{Script=Khmer}+ \p{Script=Khmer}+$/u,
  // only for csv END
]

// text that contains only khmer letters and no other letters (not even space)

export type TypedKhmerWordDictionaryIndexElement = NonEmptyStringTrimmed & {
  readonly __uuidbrand: 'TypedKhmerWordDictionaryIndexElement'
}

export const isKhmerWordDictionaryIndexElement = (value: string): value is TypedKhmerWordDictionaryIndexElement =>
  regexes.some(x => x.test(value))

export const strToKhmerWordDictionaryIndexElementOrUndefined = (
  value: string,
): TypedKhmerWordDictionaryIndexElement | undefined => (isKhmerWordDictionaryIndexElement(value) ? value : undefined)
export const strToKhmerWordDictionaryIndexElementOrThrow = (value: string): TypedKhmerWordDictionaryIndexElement => {
  const uuid = strToKhmerWordDictionaryIndexElementOrUndefined(value)
  if (!uuid) throw new Error(`Invalid KhmerWordDictionaryIndexElement format: '${value}'`)
  return uuid
}

export type TypedKhmerWordDictionaryIndex = NonEmptySet<TypedKhmerWordDictionaryIndexElement>
export const strToKhmerWordDictionaryIndexOrUndefined = (value: string): TypedKhmerWordDictionaryIndex | undefined => {
  if (!value) return undefined

  // TODO: handle **уже** *и* **уж**
  const elements = value
    .split(',') // split variants
    .map(s => s.trim()) // remove leading/trailing whitespace
    .map(strToKhmerWordDictionaryIndexElementOrUndefined)

  return Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined(new Set(elements))
}
