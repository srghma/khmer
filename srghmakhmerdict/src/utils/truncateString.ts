import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export const truncateString = (str: NonEmptyStringTrimmed, n: number): string => {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}
