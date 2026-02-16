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
      const lastToken = acc.tokens[acc.tokens.length - 1]
      const isSubscript = lastToken?.type === 'diacritic' && lastToken.v === '្'

      if (token.type === 'consonant') {
        const def = CONSONANTS.find(c => c.letter === token.v)
        if (def) {
          const lastType = lastToken?.type
          // Only reset series if it's the start of a word or follows a vowel (new syllable)
          const isNewSyllable =
            !lastToken ||
            lastType === 'SPACE' ||
            lastType === 'vowel' ||
            lastType === 'vowel_combination' ||
            lastType === 'independent_vowel'

          if (isNewSyllable && !isSubscript) {
            newSeries = def.series
          }
        }
        return { currentSeries: newSeries, tokens: [...acc.tokens, token] }
      }

      if (token.type === 'extra_consonant') {
        const def = EXTRA_CONSONANTS.find(ec => ec.letters.every((l, i) => l === token.v[i]))
        if (def) newSeries = def.series
        return { currentSeries: newSeries, tokens: [...acc.tokens, token] }
      }

      if (token.type === 'diacritic') {
        // Rule 2: Handle series shifters
        if (token.v === '៉') newSeries = 'a'
        else if (token.v === '៊') newSeries = 'o'
        return { currentSeries: newSeries, tokens: [...acc.tokens, token] }
      }

      if (token.type === 'SPACE') {
        // Rule 3: Reset on word boundaries
        return { currentSeries: 'a', tokens: [...acc.tokens, token] }
      }

      if (token.type === 'vowel' || token.type === 'vowel_combination') {
        return { currentSeries: newSeries, tokens: [...acc.tokens, { ...token, series: newSeries }] }
      }

      return { currentSeries: newSeries, tokens: [...acc.tokens, token] }
    },
    { currentSeries: 'a', tokens: [] },
  ).tokens
}
