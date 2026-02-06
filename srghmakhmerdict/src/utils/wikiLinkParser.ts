import { extractWikiTerm } from '../utils/rendererUtils'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export type WikiLinkResult =
  | { kind: 'internal'; term: NonEmptyStringTrimmed }
  | { kind: 'external' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'ignore' } // For empty hrefs or non-links

export const parseWikiHref = (href: string | null | undefined): WikiLinkResult => {
  if (!href) return { kind: 'ignore' }

  // 1. Standard Wiki Links: /wiki/Word
  if (href.startsWith('/wiki/')) {
    const term = extractWikiTerm(href)
    const cleanTerm = term ? String_toNonEmptyString_orUndefined_afterTrim(term) : undefined

    return cleanTerm
      ? { kind: 'internal', term: cleanTerm }
      : { kind: 'invalid', reason: 'Could not parse wiki link term' }
  }

  // 2. Query Style Links (Redlinks, Edit): /w/index.php?title=Word...
  if (href.startsWith('/w/index.php')) {
    try {
      const url = new URL(href, 'http://dummy.base')
      const term = url.searchParams.get('title')
      const cleanTerm = term ? String_toNonEmptyString_orUndefined_afterTrim(term) : undefined

      return cleanTerm
        ? { kind: 'internal', term: cleanTerm }
        : { kind: 'invalid', reason: 'Could not resolve word from query link' }
    } catch (err: any) {
      return { kind: 'invalid', reason: `Failed to parse wiki query link: ${err.message}` }
    }
  }

  // 3. Everything else is external
  return { kind: 'external' }
}
