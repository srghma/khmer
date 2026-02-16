import {
  type ConsonantDef,
  type VowelDef,
  type ExtraConsonantDef,
  type VowelCombinationDef,
  type IndependentVowelDef,
  CONSONANTS,
  VOWELS,
  EXTRA_CONSONANTS,
  VOWEL_COMBINATIONS,
  INDEPENDENT_VOWELS,
} from './khmer-consonants-vovels'

/**
 * Maps Russian phoneme sequences to Khmer characters.
 * This mapping is used for fuzzy pronunciation-based search.
 */
const RUSSIAN_PHONEME_MAP: Record<string, string[]> = {
  // Consonants (Broadly mapped to handle variants and both series)
  к: ['ក', 'គ', 'ខ', 'ឃ', '្ក', '្ខ', '្គ', '្ឃ'],
  кх: ['ខ', 'ឃ', '្ខ', '្ឃ'],
  нг: ['ង', '្ង'],
  т: ['ត', 'ទ', 'ថ', 'ធ', 'ដ', 'ឌ', 'ឋ', 'ឍ', 'ច', 'ឆ', 'ជ', 'ឈ', '្ត', '្ទ', '្ឋ', '្ធ', '្ដ', '្ឌ', '្ឋ', '្ឍ', '្ច', '្ឆ', '្ជ', '្ឈ'],
  тх: ['ថ', 'ធ', 'ឋ', 'ឍ', 'ឆ', 'ឈ', '្ឋ', '្ធ', '្ឋ', '្ឍ', '្ឆ', '្ឈ'],
  д: ['ដ', 'ឌ', '្ដ', '្ឌ'],
  н: ['ន', 'ណ', 'ញ', 'ហ្ន', '្ន', '្ណ', '្ញ'],
  п: ['ប', 'ព', 'ផ', 'ភ', 'ប៉', 'ហ្វ', '្ប', '្ព', '្ផ', '្ភ'],
  пх: ['ផ', 'ភ', '្ផ', '្ភ'],
  б: ['ប', '្ប'],
  м: ['ម', 'ហ្ម', '្ម'],
  й: ['យ', '្យ'],
  р: ['រ', '្រ'],
  л: ['ល', 'ឡ', 'ហ្ល', '្ល'],
  в: ['វ', 'ហ្វ', '្វ'],
  с: ['ស', 'ហ្ស', '្ស'],
  х: ['ហ'],
  г: ['ហ្គ', '្គ'],
  ф: ['ហ្វ', '្ហ្វ'],
  з: ['ហ្ស'],
  ж: ['ហ្ស'],
  ч: ['ច', 'ឆ', 'ជ', 'ឈ', '្ច', '្ឆ', '្ជ', '្ឈ'],
  ц: ['ស', '្ស'], // approximate

  // Vowels
  а: ['', 'ា', 'អ', 'ឣ', 'ឤ', 'ះ', 'ៈ', '់', '៌', '៏', '័', 'ំ', 'ាំ'],
  ае: ['ែ'],
  аэ: ['ើ', 'ឯ'],
  ай: ['ៃ', 'ឰ'],
  ао: ['ោ', 'ឧ', 'ឱ', 'ឲ'],
  ау: ['ៅ', 'ឪ', 'ឳ'],
  е: ['ិ', 'េ', 'ៀ'],
  еа: ['ា'],
  ей: ['ៃ', 'ី'],
  и: ['ិ', 'ី', 'ឥ'],
  ие: ['ៀ'],
  о: ['', 'ោ', 'ុ', 'ូ', 'អ', 'ឧ', 'ោះ'],
  оу: ['ូ', 'ោ', 'ឩ'],
  у: ['ុ', 'ូ', 'ួ', 'ឧ', 'ឩ'],
  уо: ['ួ'],
  ы: ['ឹ', 'ឺ'],
  ыа: ['ឿ'],
  эй: ['ី', 'ឦ'],
  э: ['េ', 'ែ', 'ឹ', 'ឺ', 'ឯ', 'ឥ'],
  ом: ['ុំ'],
  ум: ['ំ', 'ាំ', 'ុំ'],
  ам: ['ំ', 'ាំ'],
  ах: ['ះ'],
  ех: ['ិះ'],
  их: ['ិះ'],
  ох: ['ុះ'],
  ух: ['ុះ'],
  эх: ['េះ'],
  аох: ['ោះ'],
  уох: ['ោះ'],
  ры: ['ឫ', 'ឬ'],
  лы: ['ឭ', 'ឮ'],
}

// Sort keys by length descending to ensure greedy matching
const SORTED_PHONEMES = Object.keys(RUSSIAN_PHONEME_MAP).sort((a, b) => b.length - a.length)

/**
 * Converts a Russian pronunciation string into a Khmer regex pattern.
 *
 * @param russianText The Russian text to convert (e.g. "тoу")
 * @returns A string representing a regular expression pattern
 */
export const russianToKhmerRegex = (russianText: string): string => {
  let remaining = russianText.toLowerCase().replace(/\s+/g, '')
  let pattern = ''

  while (remaining.length > 0) {
    let matched = false
    for (const phoneme of SORTED_PHONEMES) {
      if (remaining.startsWith(phoneme)) {
        const khmerChars = RUSSIAN_PHONEME_MAP[phoneme]!
        // Escape any regex characters and join with |
        const group = khmerChars
          .map(c => (c === '' ? '' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
          .filter(Boolean)

        if (group.length > 0) {
          // If the group contains an empty string behavior (like 'а'), handle it
          const includesOptional = khmerChars.includes('')
          const groupPattern = `(${group.join('|')})`
          pattern += includesOptional ? `${groupPattern}?` : groupPattern
        }

        remaining = remaining.slice(phoneme.length)
        matched = true
        break
      }
    }

    if (!matched) {
      // If no phoneme matches, skip one character (or handle as literal)
      pattern += remaining[0]
      remaining = remaining.slice(1)
    }
  }

  return pattern
}
