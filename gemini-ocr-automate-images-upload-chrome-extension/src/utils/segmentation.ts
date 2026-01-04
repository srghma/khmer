import { TypedKhmerWord } from "./khmer-word"

const nativeSegmenter = new Intl.Segmenter("km", { granularity: "word" })

/**
'ផ្លូវកខ្វេងកខ្វាក់'
=>['ផ្លូវ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', ' ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  tst កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'tst', ' ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  tstកខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'tstកខ្វេងក', 'ខ្វាក់']
*/
export function khmerSentenceToWords_usingSegmenter(
  str: TypedKhmerWord,
): TypedKhmerWord[] {
  return Array.from(nativeSegmenter.segment(str)).map(
    (s) => s.segment as TypedKhmerWord,
  )
}

// --- Dictionary Approach ---

/**
khmerSentenceToWords_usingDictionary('ផ្លូវកខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់')))
(3) ['ផ្លូវ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(4) ['ផ្លូវ', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(5) ['ផ្លូវ', ' ', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  tst កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(9) ['ផ្លូវ', ' ', ' ', 't', 's', 't', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  tstកខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(8) ['ផ្លូវ', ' ', ' ', 't', 's', 't', 'កខ្វេងក', 'ខ្វាក់']
 */
export function khmerSentenceToWords_usingDictionary(
  str: TypedKhmerWord,
  dict: Set<TypedKhmerWord>,
): TypedKhmerWord[] {
  const chars = Array.from(str)
  const result: TypedKhmerWord[] = []

  let i = 0
  while (i < chars.length) {
    let longestMatchString: string | undefined
    let longestMatchLen = 0 // Length in Chars, not string.length

    let currentString = ""

    // Forward matching
    for (let j = i; j < chars.length; j++) {
      currentString += chars[j]
      if (dict.has(currentString as TypedKhmerWord)) {
        longestMatchString = currentString
        longestMatchLen = j - i + 1
      }
    }

    if (longestMatchString) {
      result.push(longestMatchString as TypedKhmerWord)
      i += longestMatchLen
    } else {
      // Unknown: take 1 char
      result.push(chars[i]! as TypedKhmerWord)
      i++
    }
  }

  return result
}
