import { CharArray_mkFromString, type Char } from './char'
import { CONSONANTS, EXTRA_CONSONANTS, VOWELS, VOWEL_COMBINATIONS, INDEPENDENT_VOWELS } from './khmer-consonants-vovels'
import { tokenize } from './khmer_parse_tokenize'
import { enrichWithSeries } from './khmer_parse_tokenize_with_series'
import { String_toNonEmptyString_orUndefined_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import type { TypedContainsKhmer } from './string-contains-khmer-char'

const getPureTrans = (trans: string) => {
  // Removes trailing inherent vowels 'а' or 'о'
  // Also handles cases like '.да' -> '.д', 'тя' -> 'т'
  return trans.replace(/[ао]$/, '').replace(/я$/, '').replace(/ё$/, '')
}

/**
 * Transliterates Khmer text to Russian based on phonetic mappings.
 *
 * @param khmerText The Khmer text to transliterate.
 * @returns The Russian transliteration.
 */
export const khmerToRussian = (khmerText: TypedContainsKhmer): NonEmptyStringTrimmed | undefined => {
  const chars: readonly Char[] = CharArray_mkFromString(khmerText)
  const tokens = tokenize(chars)
  const enrichedTokens = enrichWithSeries(tokens)

  let result = ''

  for (let i = 0; i < enrichedTokens.length; i++) {
    const token = enrichedTokens[i]!
    const nextToken = enrichedTokens[i + 1]

    switch (token.type) {
      case 'consonant': {
        const def = CONSONANTS.find(c => c.letter === token.v)
        if (!def) {
          result += token.v
          break
        }

        const prevToken = i > 0 ? enrichedTokens[i - 1] : undefined
        const isSubscript = prevToken?.type === 'diacritic' && prevToken.v === '្'
        const hasVowelNext = nextToken?.type === 'vowel' || nextToken?.type === 'vowel_combination'
        const hasSubscriptNext = nextToken?.type === 'diacritic' && nextToken.v === '្'
        const isFirstInWord = !prevToken || prevToken.type === 'SPACE'

        if (!isSubscript && !hasVowelNext && !hasSubscriptNext && isFirstInWord) {
          // Use full transliteration (includes inherent vowel)
          result += def.trans
        } else {
          // Use pure consonant sound
          result += getPureTrans(def.trans)
        }
        break
      }

      case 'extra_consonant': {
        const def = EXTRA_CONSONANTS.find(
          ec => ec.letters.length === token.v.length && ec.letters.every((l, j) => l === token.v[j]),
        )
        if (!def) {
          result += token.v.join('')
          break
        }
        result += def.trans
        break
      }

      case 'vowel': {
        const def = VOWELS.find(v => v.letter === token.v)
        if (!def) {
          result += token.v
          break
        }
        result += token.series === 'a' ? def.trans_a : def.trans_o
        break
      }

      case 'vowel_combination': {
        const def = VOWEL_COMBINATIONS.find(
          vc => vc.letters.length === token.v.length && vc.letters.every((l, j) => l === token.v[j]),
        )
        if (!def) {
          result += token.v.join('')
          break
        }
        result += token.series === 'a' ? def.trans_a : def.trans_o
        break
      }

      case 'independent_vowel': {
        const def = INDEPENDENT_VOWELS.find(iv => iv.letters === token.v)
        if (!def) {
          result += token.v
          break
        }
        result += def.trans
        break
      }

      case 'diacritic': {
        // '្' is handled in 'consonant' logic as a signal for subscripts.
        // Other diacritics might be part of combinations or handled here.
        if (token.v !== '្') {
          // For now, other diacritics are just ignored or passed as is if not in combinations
          // Note: 'tokenize' already handles VOWEL_COMBINATIONS which include some diacritics.
        }
        break
      }

      case 'SPACE':
        result += ' '
        break

      case 'UNKNOWN':
        result += token.v.join('')
        break
    }
  }
  // return undefined for chars like ៈ
  return String_toNonEmptyString_orUndefined_afterTrim(result.replace(/\s+/g, ' '))
}
