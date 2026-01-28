import type { Char } from './char'
import {
  type CharKhmerConsonant,
  type CharKhmerDiacritic,
  type CharKhmerExtraConsonant,
  type CharKhmerIndependentVowel,
  type CharKhmerVowel,
  type CharKhmerVowelCombination,
  type Series,
  CONSONANTS,
  EXTRA_CONSONANTS,
} from './khmer-consonants-vovels'
import type { Token } from './khmer_parse_tokenize'
import type { NonEmptyArray } from './non-empty-array'

export type EnrichedToken =
  | { type: 'SPACE'; v: NonEmptyArray<Char> }
  | { type: 'UNKNOWN'; v: NonEmptyArray<Char> }
  | { type: 'extra_consonant'; v: CharKhmerExtraConsonant }
  | { type: 'vowel_combination'; v: CharKhmerVowelCombination; series: Series }
  | { type: 'consonant'; v: CharKhmerConsonant }
  | { type: 'vowel'; v: CharKhmerVowel; series: Series }
  | { type: 'independent_vowel'; v: CharKhmerIndependentVowel }
  | { type: 'diacritic'; v: CharKhmerDiacritic }

export const enrichWithSeries = (tokens: readonly Token[]): readonly EnrichedToken[] => {
  return tokens.reduce<{
    currentSeries: Series
    tokens: readonly EnrichedToken[]
  }>(
    (acc, token) => {
      let newSeries = acc.currentSeries

      // Update series based on consonant types
      if (token.type === 'consonant') {
        const def = CONSONANTS.find(c => c.letter === token.v)
        if (def) newSeries = def.series
        return {
          currentSeries: newSeries,
          tokens: [...acc.tokens, token],
        }
      } else if (token.type === 'extra_consonant') {
        const def = EXTRA_CONSONANTS.find(
          ec => ec.letters.length === token.v.length && ec.letters.every((l, i) => l === token.v[i]),
        )
        if (def) newSeries = def.series
        return {
          currentSeries: newSeries,
          tokens: [...acc.tokens, token],
        }
      } else if (token.type === 'vowel') {
        // Vowels get the current series
        return {
          currentSeries: newSeries,
          tokens: [...acc.tokens, { ...token, series: newSeries }],
        }
      } else if (token.type === 'vowel_combination') {
        // Vowel combinations get the current series
        return {
          currentSeries: newSeries,
          tokens: [...acc.tokens, { ...token, series: newSeries }],
        }
      } else {
        // SPACE, UNKNOWN, independent_vowel, diacritic - pass through without series
        return {
          currentSeries: newSeries,
          tokens: [...acc.tokens, token],
        }
      }
    },
    { currentSeries: 'a', tokens: [] },
  ).tokens
}
