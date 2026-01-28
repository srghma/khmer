import { reorderText } from 'khmer-normalize'
import { khnormal } from 'khmer-normalizer'
import {
  arrayOfNonEmptyString_filterOut_afterTrim,
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from './non-empty-string-trimmed'
import type { TypedKhmerWord } from './khmer-word'

// TODO: use iterateKhmerWords
// export const splitByNonKhmer = (word: string) =>
//   arrayOfNonEmptyString_filterOut_afterTrim(word.split(/[\s\P{Script=Khmer}]+/u))

// export const addSplitBySpace = (words: Set<NonEmptyStringTrimmed>): Set<NonEmptyStringTrimmed> =>
//   Set_union_onCollisionPreferLast(words, Set_flatMap(words, splitByNonKhmer))
//
// export const addNormalizationVariants = (words: Set<NonEmptyStringTrimmed>): Set<NonEmptyStringTrimmed> =>
//   Set_union_onCollisionPreferLast(words, Set_flatMap(words, getNormalizedVariants))
//
// export const addIntlSegmenterWordVariants = (words: Set<NonEmptyStringTrimmed>): Set<NonEmptyStringTrimmed> =>
//   Set_union_onCollisionPreferLast(words, Set_flatMap(words, getIntlSegmenterWordVariants))
