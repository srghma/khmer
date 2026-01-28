import { type TypedKhmerWord } from './khmer-word'
import { khmerSentenceToWords_usingDictionary } from './khmer_segmentation'

export const COLOR_PALETTE = [
  '#569cd6', // Blue
  '#4ec9b0', // Soft Green
  '#c586c0', // Pink/Purple
  '#dcdcaa', // Soft Yellow
  '#ce9178', // Orange
]

export const colorizeKhmerHtml = (html: string, dict: Set<TypedKhmerWord>): string => {
  let wordCounter = 0

  // Regex to find blocks of Khmer text
  return html.replace(/[\p{Script=Khmer}]+/gu, match => {
    const words = khmerSentenceToWords_usingDictionary(match as TypedKhmerWord, dict)
    return words
      .map(w => {
        if (dict.has(w)) {
          const color = COLOR_PALETTE[wordCounter % COLOR_PALETTE.length]
          wordCounter++
          return `<span style="color:${color};font-weight:bold;">${w}</span>`
        }
        // Unknown word
        return `<span style="color:#ff5555;">${w}</span>`
      })
      .join('')
  })
}
