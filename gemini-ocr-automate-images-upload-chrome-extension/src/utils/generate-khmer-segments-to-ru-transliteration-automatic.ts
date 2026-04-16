import * as fs from 'fs'
import type { Char } from './char'
import { CONSONANTS, EXTRA_CONSONANTS, VOWELS, VOWEL_COMBINATIONS, INDEPENDENT_VOWELS } from './khmer-consonants-vovels'
import { tokenize } from './khmer_parse_tokenize'
import { enrichWithSeries, type EnrichedToken } from './khmer_parse_tokenize_with_series'
import type { TypedKhmerWord } from './khmer-word'
import { assertIsDefinedAndReturn } from './asserts'

/**
 * Strips the inherent vowel from a Russian transliteration string.
 * e.g., "ка" -> "к", "тё" -> "т", "нё" -> "н", ".да" -> ".д"
 */
function getStem(ru: string): string {
  if (ru.length <= 1) return ru
  // Matches typical endings: а, о, ё, я
  return ru.replace(/[аоёя]$/, '')
}

/**
 * Transliterates a single Khmer segment using the provided tokenization rules.
 */
export function transliterateKhmerSegmentToRu(segment: string): string {
  const chars = Array.from(segment) as Char[]
  const tokens = tokenize(chars)
  const enriched = enrichWithSeries(tokens)

  let result = ''

  for (let i = 0; i < enriched.length; i++) {
    const token = assertIsDefinedAndReturn(enriched[i])
    const nextToken = enriched[i + 1]

    // Determine if we need to use the stem (because a vowel follows)
    const followedByVowel = nextToken && (nextToken.type === 'vowel' || nextToken.type === 'vowel_combination')

    switch (token.type) {
      case 'consonant': {
        const def = CONSONANTS.find(c => c.letter === token.v)
        if (!def) {
          result += '?'
          break
        }
        result += followedByVowel ? getStem(def.trans) : def.trans
        break
      }

      case 'extra_consonant': {
        const def = EXTRA_CONSONANTS.find(ec => ec.letters.every((l, idx) => l === token.v[idx]))
        if (!def) {
          result += '?'
          break
        }
        result += followedByVowel ? getStem(def.trans) : def.trans
        break
      }

      case 'vowel': {
        const def = VOWELS.find(v => v.letter === token.v)
        if (def) {
          result += token.series === 'a' ? def.trans_a : def.trans_o
        }
        break
      }

      case 'vowel_combination': {
        const def = VOWEL_COMBINATIONS.find(vc => vc.letters.every((l, idx) => l === token.v[idx]))
        if (def) {
          result += token.series === 'a' ? def.trans_a : def.trans_o
        }
        break
      }

      case 'independent_vowel': {
        const def = INDEPENDENT_VOWELS.find(iv => iv.letters === token.v)
        if (def) {
          result += def.trans.split(',')[0]?.trim() // Take first variant if multiple exist
        }
        break
      }

      case 'diacritic':
        // Most diacritics are handled by the series-shifter logic in enrichWithSeries
        // or combined in vowel_combinations.
        // We only add something here if it's a stand-alone mark like bânták '់'
        // that isn't already part of a combination.
        break

      case 'UNKNOWN':
      case 'SPACE':
        result += token.v.join('')
        break
    }
  }

  return result || '?'
}

/**
 * Main function to generate the YAML file from your lengthGroups map
 */
export function generateKhmerSegmentsYaml(
  lengthGroups: Map<number, Map<Char, Set<TypedKhmerWord>>>,
  outputPath: string = 'khmer-segments-to-ru-transliteration-automatic.yaml',
) {
  let yaml = '# Automatically generated Khmer to Russian transliteration segments\n'
  yaml += '# Based on internal tokenization and series-aware enrichment rules\n---\n'

  // Sort lengths ascending
  const sortedLengths = Array.from(lengthGroups.keys()).sort((a, b) => a - b)

  for (const len of sortedLengths) {
    yaml += `- length: ${len}\n  bases:\n`
    const baseMap = lengthGroups.get(len)!
    const sortedBases = Array.from(baseMap.keys()).sort()

    for (const base of sortedBases) {
      yaml += `    - char: "${base}"\n      segments:\n`
      const segments = Array.from(baseMap.get(base)!).sort()

      for (const seg of segments) {
        const ruTrans = transliterateKhmerSegmentToRu(seg)
        // Clean up: Khmer often uses multiple variants, we just want the simple string
        const cleanRu = ruTrans.replace(/\?/g, '').trim()
        yaml += `        - { km: "${seg}", ru: "${cleanRu}" }\n`
      }
    }
  }

  fs.writeFileSync(outputPath, yaml)
  console.log(`✅ YAML generated: ${outputPath}`)
}
