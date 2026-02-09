// Copyright 2023 srghma

import { reorderText as reorderTextImpl } from 'khmer-normalize'
import { khnormal as khnormalImpl } from 'khmer-normalizer'
import { Iterator_yieldUnique_usingSet } from './iterator'
import type { TypedContainsKhmer } from './string-contains-khmer-char'

// Khmer Unicode range: U+1780 to U+17FF
const KhmerWord_REGEX = /^\p{Script=Khmer}+$/u

// text that contains only khmer letters and no other letters (not even space)

export type TypedKhmerWord = TypedContainsKhmer & { readonly __brandTypedKhmerWord: 'TypedKhmerWord' }
export const isKhmerWord = (value: string): value is TypedKhmerWord => KhmerWord_REGEX.test(value)
export const strToKhmerWordOrUndefined = (value: string): TypedKhmerWord | undefined =>
  isKhmerWord(value) ? value : undefined
export const strToKhmerWordOrThrow = (value: string): TypedKhmerWord => {
  const uuid = strToKhmerWordOrUndefined(value)
  if (!uuid) throw new Error(`Invalid KhmerWord format: '${value}'`)
  return uuid
}

export function* iterateKhmerWords(value: string): IterableIterator<TypedKhmerWord> {
  for (const match of value.matchAll(/\p{Script=Khmer}+/gu)) yield strToKhmerWordOrThrow(match[0])
}

export const strToUniqueKhmerWords = (value: string): Set<TypedKhmerWord> => {
  return new Set(iterateKhmerWords(value))
}

export const reorderText = (word: TypedKhmerWord): TypedKhmerWord => strToKhmerWordOrThrow(reorderTextImpl(word))
export const khnormal = (word: TypedKhmerWord): TypedKhmerWord => strToKhmerWordOrThrow(khnormalImpl(word))

export const getNormalizedVariants = (word: TypedKhmerWord): TypedKhmerWord[] => [reorderText(word), khnormal(word)]

// 2. Segmenter Logic (Lazy Factory)
export const mkGetIntlSegmenterWordVariants = () => {
  let khmerSegmenter: Intl.Segmenter | undefined

  // Optimized: Generator instead of Array returning function
  return function* (word: TypedKhmerWord): IterableIterator<TypedKhmerWord> {
    if (!khmerSegmenter) khmerSegmenter = new Intl.Segmenter('km', { granularity: 'word' })
    for (const seg of khmerSegmenter.segment(word)) {
      if (seg.isWordLike && isKhmerWord(seg.segment)) {
        yield seg.segment
      }
    }
  }
}

function* iterNormalize(source: Iterable<TypedKhmerWord>): IterableIterator<TypedKhmerWord> {
  for (const word of source) {
    yield word

    const v1 = reorderText(word)
    if (v1 !== word) yield v1

    const v2 = khnormal(word)
    if (v2 !== word && v2 !== v1) yield v2
  }
}

const getIntlSegmenterWordVariants = mkGetIntlSegmenterWordVariants()
function* iterIntlSegmenter(source: Iterable<TypedKhmerWord>): IterableIterator<TypedKhmerWord> {
  for (const word of source) {
    yield word
    for (const seg of Iterator_yieldUnique_usingSet(getIntlSegmenterWordVariants(word))) {
      if (seg !== word) yield seg
    }
  }
}

/**
 * Adapter Function:
 * Bridges the generic string iterator expected by `getNewWordsToFetch`
 * with your specific Khmer set-based processing pipeline.
 */
export function* iterateKhmerWordsFromTextPlusNormalizedEtc(text: string): IterableIterator<TypedKhmerWord> {
  // 3. Build the Pipeline
  // Logic: Split -> Segment -> Normalize -> Segment -> Normalize
  // We compose the generators inside-out.

  // const label = `km-iter-${Math.random().toString(36).slice(2, 6)}`

  // console.time(label)
  // try {
  const step1 = iterateKhmerWords(text)
  const step2 = iterIntlSegmenter(step1)
  const step3 = iterNormalize(step2)
  const step4 = iterIntlSegmenter(step3)
  const step5 = iterNormalize(step4)
  yield* step5
  // } finally {
  //   console.timeEnd(label)
  // }

  // yield* Iterator_yieldUnique_usingSet(step5)
}
