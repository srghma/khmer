import { Char_mkOrThrow } from './char'
import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

// --- Data Definitions (Grids/Sets) ---
export const consonantsGrid = [
  [Char_mkOrThrow('ក'), Char_mkOrThrow('ខ'), Char_mkOrThrow('គ'), Char_mkOrThrow('ឃ'), Char_mkOrThrow('ង')],
  [Char_mkOrThrow('ច'), Char_mkOrThrow('ឆ'), Char_mkOrThrow('ជ'), Char_mkOrThrow('ឈ'), Char_mkOrThrow('ញ')],
  [Char_mkOrThrow('ដ'), Char_mkOrThrow('ឋ'), Char_mkOrThrow('ឌ'), Char_mkOrThrow('ឍ'), Char_mkOrThrow('ណ')],
  [Char_mkOrThrow('ត'), Char_mkOrThrow('ថ'), Char_mkOrThrow('ទ'), Char_mkOrThrow('ធ'), Char_mkOrThrow('ន')],
  [Char_mkOrThrow('ប'), Char_mkOrThrow('ផ'), Char_mkOrThrow('ព'), Char_mkOrThrow('ភ'), Char_mkOrThrow('ម')],
  [Char_mkOrThrow('យ'), Char_mkOrThrow('រ'), Char_mkOrThrow('ល'), Char_mkOrThrow('វ'), ''],
  [Char_mkOrThrow('ស'), Char_mkOrThrow('ហ'), Char_mkOrThrow('ឡ'), Char_mkOrThrow('អ'), ''],
] as (NonEmptyStringTrimmed | '')[][]

export const supplementaryConsonants = [
  'ហ្គ',
  'ហ្គ៊',
  'ហ្ន',
  'ប៉',
  'ហ្ម',
  'ហ្ល',
  'ហ្វ',
  'ហ្វ៊',
  'ហ្ស',
  'ហ្ស៊',
] as NonEmptyStringTrimmed[]

export const independentVowels = [
  Char_mkOrThrow('ឥ'),
  Char_mkOrThrow('ឦ'),
  Char_mkOrThrow('ឧ'),
  Char_mkOrThrow('ឨ'),
  Char_mkOrThrow('ឩ'),
  Char_mkOrThrow('ឪ'),
  Char_mkOrThrow('ឫ'),
  Char_mkOrThrow('ឬ'),
  Char_mkOrThrow('ឭ'),
  Char_mkOrThrow('ឮ'),
  Char_mkOrThrow('ឯ'),
  Char_mkOrThrow('ឰ'),
  Char_mkOrThrow('ឱ'),
  Char_mkOrThrow('ឲ'),
  Char_mkOrThrow('ឳ'),
] as NonEmptyStringTrimmed[]

export const aSeriesSet = new Set([
  Char_mkOrThrow('ក'),
  Char_mkOrThrow('ខ'),
  Char_mkOrThrow('ច'),
  Char_mkOrThrow('ឆ'),
  Char_mkOrThrow('ដ'),
  Char_mkOrThrow('ឋ'),
  Char_mkOrThrow('ណ'),
  Char_mkOrThrow('ត'),
  Char_mkOrThrow('ថ'),
  Char_mkOrThrow('ប'),
  Char_mkOrThrow('ផ'),
  Char_mkOrThrow('ស'),
  Char_mkOrThrow('ហ'),
  Char_mkOrThrow('ឡ'),
  Char_mkOrThrow('អ'),
  'ហ្ន',
  'ប៉',
  'ហ្ម',
  'ហ្ល',
  'ហ្វ',
  'ហ្ស',
]) as Set<NonEmptyStringTrimmed>

export const vowelsGrid = [
  [Char_mkOrThrow('ា'), Char_mkOrThrow('ិ'), Char_mkOrThrow('ី'), Char_mkOrThrow('ឹ'), Char_mkOrThrow('ឺ')],
  [Char_mkOrThrow('ុ'), Char_mkOrThrow('ូ'), Char_mkOrThrow('ួ'), Char_mkOrThrow('ើ'), Char_mkOrThrow('ឿ')],
  [Char_mkOrThrow('ៀ'), Char_mkOrThrow('េ'), Char_mkOrThrow('ែ'), Char_mkOrThrow('ៃ'), Char_mkOrThrow('ោ')],
  [Char_mkOrThrow('ៅ'), 'ុំ', Char_mkOrThrow('ំ'), 'ាំ', Char_mkOrThrow('ះ')],
  ['ិះ', 'ុះ', 'េះ', 'ោះ', ''],
] as (NonEmptyStringTrimmed | '')[][]
