import { split } from 'split-khmer'
import { assertIsDefinedAndReturn } from './asserts'

const firstSeries = new Set('កខចឆដឋណតថបផឝសហឡអ')
const vowelsDefault = ['a', 'o']
const consonants: Map<string, string> = new Map([
  ['ក', 'k'],
  ['ខ', 'kh'],
  ['គ', 'k'],
  ['ឃ', 'kh'],
  ['ង', 'ng'],
  ['ច', 'ch'],
  ['ឆ', 'chh'],
  ['ជ', 'ch'],
  ['ឈ', 'chh'],
  ['ញ', 'nh'],
  ['ដ', 'd'],
  ['ឋ', 'th'],
  ['ឌ', 'd'],
  ['ឍ', 'th'],
  ['ណ', 'n'],
  ['ត', 't'],
  ['ថ', 'th'],
  ['ទ', 't'],
  ['ធ', 'th'],
  ['ន', 'n'],
  ['ប', 'b'],
  ['ផ', 'ph'],
  ['ព', 'p'],
  ['ភ', 'ph'],
  ['ម', 'm'],
  ['យ', 'y'],
  ['រ', 'r'],
  ['ល', 'l'],
  ['វ', 'v'],
  ['ឝ', 'sh'],
  ['ឞ', 'ss'],
  ['ស', 's'],
  ['ហ', 'h'],
  ['ឡ', 'l'],
  ['អ', 'a'],
  //
  ['ឥ', 'e'],
  ['ឦ', 'ei'],
  ['ឧ', 'u'],
  ['ឩ', 'au'],
  ['ឫ', 'rue'],
  ['ឬ', 'rueu'],
  ['ឭ', 'lue'],
  ['ឮ', 'lueu'],
  ['ឯ', 'ae'],
  ['ឰ', 'ai'],
  ['ឲ', 'ao'],
  ['ឱ', 'ao'],
  ['ឳ', 'au'],
])

const vowelEntries = [
  ['◌់', ['a', 'o']],
  ['ា', ['a', 'ea']],
  ['ា់', ['a', 'ea']],
  [' ័◌', ['a', 'oa']],
  ['ៈ', ['ak', 'eak']],
  ['័យ', ['ai', 'ey']],
  ['ិ', ['e', 'i']],
  ['ី', ['ei', 'i']],
  ['ឹ', ['oe', 'ue']],
  ['ឺ', ['eu', 'ueu']],
  ['ុ', ['o', 'u']],
  ['ូ', ['ou', 'u']],
  ['ួ', ['uo', 'uo']],
  ['ើ', ['aeu', 'eu']],
  ['ឿ', ['oea', 'oea']],
  ['ៀ', ['ie', 'ie']],
  ['េ', ['e', 'e']],
  ['ែ', ['ae', 'eae']],
  ['ៃ', ['ai', 'ey']],
  ['ោ', ['ao', 'ou']],
  ['ៅ', ['au', 'ov']],
  ['ុំ', ['om', 'um']],
  ['ំ', ['am', 'um']],
  ['ាំ', ['am', 'oam']],
  ['ាំង', ['ang', 'eang']],
  ['ះ', ['ah', 'eah']],
  ['ិះ', ['eh', 'is']],
  ['ឹះ', ['oeh', 'ueh']],
  ['ុះ', ['oh', 'uh']],
  ['េះ', ['eh', 'eh']],
  ['ើះ', ['aeuh', 'euh']],
  ['ែះ', ['aeh', 'eaeh']],
  ['ោះ', ['aoh', 'uoh']],
  ['ាត់', ['aat', 'oat']],
  ['្រ', ['ra', 'rea']],
]
  .sort((a, b) => b[0]!.length - a[0]!.length)
  .map(([k, v]) => [new RegExp(`^${k}`), v])

/**
 * Convert Khmer word into a romanization form
 * @param {string} input
 * @returns {Generator<string>}
 */
export function* transform(input: string) {
  if (typeof input !== 'string') {
    return null
  }

  if (input.length == 1) {
    if (consonants.has(input)) {
      yield consonants.get(input)
      yield vowelsDefault[+!firstSeries.has(input)]
      return
    }
  }

  let pc: string | null = null

  const sindex = () => +!(pc != null && firstSeries.has(pc))

  for (let i = 0; i < input.length; i++) {
    let c = assertIsDefinedAndReturn(input[i])

    if (/[\s\u200b\u200a]|[^\u1780-\u17dd]/.test(c)) {
      pc = null
      yield c
      continue
    }

    if (consonants.has(c)) {
      if (pc != null) {
        if (i - 2 >= 0) {
          if (consonants.has(assertIsDefinedAndReturn(input[i - 2]))) {
            yield vowelsDefault[sindex()]
          }
        } else {
          yield vowelsDefault[sindex()]
        }
      }

      pc = c
      yield consonants.get(c)
      continue
    }

    for (const [pattern, values] of vowelEntries as any) {
      const m = pattern.exec(input.slice(i))
      if (!m) continue
      i += m[0].length - 1
      const r = assertIsDefinedAndReturn(values[sindex()])
      yield r
      break
    }

    pc = null
  }
}

/**
 * Convert Khmer text into a romaization representation
 * @param {string} text
 * @returns {string}
 */
export function slugify(text: string, delimiter = '-') {
  return split(text)
    .map(word => Array.from(transform(word)).join(''))
    .join(delimiter)
}
