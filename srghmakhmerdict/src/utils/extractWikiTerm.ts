import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

/**
 * Parses a Wiki HREF to extract the search term.
 * e.g., "/wiki/Hello#Etymology" -> "Hello"
 */
export const extractWikiTerm = (href: string): NonEmptyStringTrimmed | undefined => {
  const rawPath = href.replace(/^\/wiki\//, '').split('#')[0]

  if (!rawPath) return

  let decoded: string | undefined

  try {
    decoded = decodeURIComponent(rawPath)
  } catch {
    return undefined
  }

  return String_toNonEmptyString_orUndefined_afterTrim(decoded)
}
