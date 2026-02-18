import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export const truncateString = (str: NonEmptyStringTrimmed, n: number): NonEmptyStringTrimmed => {
  if (n <= 0) throw new Error('n must be greater than 0')

  return str.length > n ? ((str.slice(0, n - 1) + '…') as NonEmptyStringTrimmed) : str
}
