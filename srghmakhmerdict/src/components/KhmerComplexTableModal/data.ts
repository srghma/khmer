import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// --- Data Definitions (Grids/Sets) ---
export const consonantsGrid = [
  ['ក', 'ខ', 'គ', 'ឃ', 'ង'],
  ['ច', 'ឆ', 'ជ', 'ឈ', 'ញ'],
  ['ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ'],
  ['ត', 'ថ', 'ទ', 'ធ', 'ន'],
  ['ប', 'ផ', 'ព', 'ភ', 'ម'],
  ['យ', 'រ', 'ល', 'វ', ''],
  ['ស', 'ហ', 'ឡ', 'អ', ''],
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
  'ឥ',
  'ឦ',
  'ឧ',
  'ឨ',
  'ឩ',
  'ឪ',
  'ឫ',
  'ឬ',
  'ឭ',
  'ឮ',
  'ឯ',
  'ឰ',
  'ឱ',
  'ឲ',
  'ឳ',
] as NonEmptyStringTrimmed[]

export const aSeriesSet = new Set([
  'ក',
  'ខ',
  'ច',
  'ឆ',
  'ដ',
  'ឋ',
  'ណ',
  'ត',
  'ថ',
  'ប',
  'ផ',
  'ស',
  'ហ',
  'ឡ',
  'អ',
  'ហ្ន',
  'ប៉',
  'ហ្ម',
  'ហ្ល',
  'ហ្វ',
  'ហ្ស',
]) as Set<NonEmptyStringTrimmed>

export const vowelsGrid = [
  ['ា', 'ិ', 'ី', 'ឹ', 'ឺ'],
  ['ុ', 'ូ', 'ួ', 'ើ', 'ឿ'],
  ['ៀ', 'េ', 'ែ', 'ៃ', 'ោ'],
  ['ៅ', 'ុំ', 'ំ', 'ាំ', 'ះ'],
  ['ិះ', 'ុះ', 'េះ', 'ោះ', ''],
] as (NonEmptyStringTrimmed | '')[][]
