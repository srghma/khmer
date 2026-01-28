export type ArrayMatchOutput<T> =
  | { readonly t: 'matched' }
  | { readonly t: 'not_matched'; readonly otherSentencePart: readonly T[] }

// Array_match([9,9], [1,9,9,9,4,5,6,7,8]) => [ { t: 'not_matched', otherSentencePart: [1] }, {t: 'matched' }, { t: 'not_matched', otherSentencePart: [9,4,5,6,7,8] } ]
// Array_match([9,9], [1,9,9,9,4,5,6,7,8,9,9]) => [ { t: 'not_matched', otherSentencePart: [1] }, {t: 'matched' }, { t: 'not_matched', otherSentencePart: [9,4,5,6,7,8] }, {t: 'matched' } ]
export function Array_match<T extends string | number>(
  word: readonly T[],
  sentence: readonly T[],
): ArrayMatchOutput<T>[] {
  const result: ArrayMatchOutput<T>[] = []
  let buffer: T[] = []
  let i = 0

  // Safety check: if word is empty, we can't really "match" it inside a sentence meaningfully
  // without creating infinite empty matches.
  if (word.length === 0) return [{ t: 'not_matched', otherSentencePart: sentence }]

  while (i < sentence.length) {
    // Check if the sequence starting at i matches 'word'
    let isMatch = true
    for (let j = 0; j < word.length; j++) {
      if (i + j >= sentence.length || sentence[i + j] !== word[j]) {
        isMatch = false
        break
      }
    }

    if (isMatch) {
      // 1. Flush any non-matched buffer
      if (buffer.length > 0) {
        result.push({ t: 'not_matched', otherSentencePart: [...buffer] })
        buffer = []
      }
      // 2. Add the matched token
      result.push({ t: 'matched' })
      // 3. Advance index
      i += word.length
    } else {
      // No match, accumulate current char
      const c = sentence[i]
      if (!c) throw new Error('no index')
      buffer.push(c)
      i++
    }
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    result.push({ t: 'not_matched', otherSentencePart: buffer })
  }

  return result
}

// ==========================================
// 2. HELPERS
// ==========================================

export type ArrayMatchManyOutput<T> =
  | { readonly t: 'matched'; readonly word: readonly T[] }
  | { readonly t: 'not_matched'; readonly otherSentencePart: readonly T[] }

export function Array_matchMany<T extends string | number>(
  words: readonly (readonly T[])[],
  sentence: readonly T[],
): ArrayMatchManyOutput<T>[] {
  // 1. Initialize with the entire sentence as a single unmatched segment
  const initialSegments: ArrayMatchManyOutput<T>[] = [{ t: 'not_matched', otherSentencePart: sentence }]

  // 2. Reduce over the list of words.
  //    For each word, we scan the current list of segments.
  //    If a segment is already 'matched', we leave it alone.
  //    If it is 'not_matched', we run Array_match on it to see if we can split it further.
  return words.reduce<ArrayMatchManyOutput<T>[]>((currentSegments, word) => {
    // Safety check for empty words to prevent infinite splitting
    if (word.length === 0) return currentSegments

    return currentSegments.flatMap(segment => {
      // A. If already matched, keep it
      if (segment.t === 'matched') {
        return [segment]
      }

      // B. If not matched, try to match the current 'word' against this segment
      const matchResults = Array_match(word, segment.otherSentencePart)

      // C. Transform the results:
      //    Array_match returns { t: 'matched' } (without data).
      //    We enrich this with the actual 'word' we are currently processing.
      return matchResults.map((res): ArrayMatchManyOutput<T> => {
        if (res.t === 'matched') {
          return { t: 'matched', word: word }
        } else {
          return {
            t: 'not_matched',
            otherSentencePart: res.otherSentencePart,
          }
        }
      })
    })
  }, initialSegments)
}
