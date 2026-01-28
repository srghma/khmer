import { type Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import { isCharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
import { isCharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

type CharMatcher<UC extends Char> = (c: Char) => c is UC

export const extractKeys =
  <UC extends Char>(isUppercase: CharMatcher<UC>) =>
  (word: NonEmptyStringTrimmed): readonly [UC, UC | undefined] | undefined => {
    let firstChar: UC | undefined
    let secondChar: UC | undefined

    for (const c of word) {
      const upper = c.toUpperCase() as Char

      if (isUppercase(upper)) {
        if (!firstChar) {
          firstChar = upper
        } else {
          secondChar = upper
          break
        }
      }
    }

    if (!firstChar) return undefined

    return [firstChar, secondChar]
  }

export const extractKeysEn = extractKeys(isCharUppercaseLatin)
export const extractKeysRu = extractKeys(isCharUppercaseCyrillic)
