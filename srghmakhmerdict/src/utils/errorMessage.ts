import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export function unknown_to_errorMessage(error: unknown): NonEmptyStringTrimmed | undefined {
  console.error(error)

  return String_toNonEmptyString_orUndefined_afterTrim(error instanceof Error ? error.message : String(error))
}
