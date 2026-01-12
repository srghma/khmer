// Copyright 2023 srghma

import {
  type NonEmptySet,
  Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined,
} from "./non-empty-set"
import { type NonEmptyStringTrimmed } from "./non-empty-string-trimmed"

// allow ending with [ៗ]
// allow ending with \sៗ
const KhmerWordDictionaryIndexElement_REGEX_ordinary =
  /^\p{Script=Khmer}+( ៗ|\[ៗ\])?$/u
// allow this pattern **មិនទាន់ ... ផង**
const KhmerWordDictionaryIndexElement_REGEX_three_dots =
  /^\p{Script=Khmer}+\s*\.\.\.\s*\p{Script=Khmer}+$/u

// allow this pattern **ខេ ៗ ខូ ៗ**
const KhmerWordDictionaryIndexElement_REGEX_word_double_word_double =
  /^\p{Script=Khmer}+ ៗ \p{Script=Khmer}+ ៗ$/u
// allow this pattern **រឃុក រឃាក់**
const KhmerWordDictionaryIndexElement_REGEX_2_words_through_space =
  /^\p{Script=Khmer}+ \p{Script=Khmer}+$/u

// text that contains only khmer letters and no other letters (not even space)

export type TypedKhmerWordDictionaryIndexElement = NonEmptyStringTrimmed & {
  readonly __uuidbrand: "TypedKhmerWordDictionaryIndexElement"
}

export const isKhmerWordDictionaryIndexElement = (
  value: string,
): value is TypedKhmerWordDictionaryIndexElement =>
  KhmerWordDictionaryIndexElement_REGEX_ordinary.test(value) ||
  KhmerWordDictionaryIndexElement_REGEX_three_dots.test(value) ||
  KhmerWordDictionaryIndexElement_REGEX_word_double_word_double.test(value) ||
  KhmerWordDictionaryIndexElement_REGEX_2_words_through_space.test(value)

export const strToKhmerWordDictionaryIndexElementOrUndefined = (
  value: string,
): TypedKhmerWordDictionaryIndexElement | undefined =>
  isKhmerWordDictionaryIndexElement(value) ? value : undefined
export const strToKhmerWordDictionaryIndexElementOrThrow = (
  value: string,
): TypedKhmerWordDictionaryIndexElement => {
  const uuid = strToKhmerWordDictionaryIndexElementOrUndefined(value)
  if (!uuid)
    throw new Error(
      `Invalid KhmerWordDictionaryIndexElement format: '${value}'`,
    )
  return uuid
}

export type TypedKhmerWordDictionaryIndex =
  NonEmptySet<TypedKhmerWordDictionaryIndexElement>
export const strToKhmerWordDictionaryIndexOrUndefined = (
  value: string,
): TypedKhmerWordDictionaryIndex | undefined => {
  if (!value) return undefined

  // TODO: handle **уже** *и* **уж**
  const elements = value
    .split(",") // split variants
    .map((s) => s.trim()) // remove leading/trailing whitespace
    .map(strToKhmerWordDictionaryIndexElementOrUndefined)

  return Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined(
    new Set(elements),
  )
}
