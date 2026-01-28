import { strToNonNegativeIntOrThrow_strict, type ValidNonNegativeInt } from './toNumber'
import { assertIsDefinedAndReturn } from './asserts'
import { type NonEmptyStringTrimmed, String_toNonEmptyString_orUndefined_afterTrim } from './non-empty-string-trimmed'

export type EMPTY = 'EMPTY' & {
  readonly __EMPTYBrand: 'EMPTY'
}

export const const_EMPTY: EMPTY = 'EMPTY' as EMPTY

export type Page = readonly [ValidNonNegativeInt, NonEmptyStringTrimmed | EMPTY]

/**
 * Extracts page data from content by splitting on page markers and extracting page numbers
 * Handles formats: "### Страница xxx", "### Page xxx", "### **Page 307**"
 */
export const extractPageData = (content: string): Page[] => {
  const parts = content.split(/(### (?:\*\*)?(?:Страница|Page) \d+(?:\*\*)?)/i).filter(Boolean)

  const pages: Page[] = []
  for (let i = 0; i < parts.length; i++) {
    const marker = parts[i]
    if (!marker) throw new Error('no marker')
    if (/### (?:\*\*)?(?:Страница|Page) \d+(?:\*\*)?/i.test(marker)) {
      const match = marker.match(/\d+/)
      const pageNumber = match ? strToNonNegativeIntOrThrow_strict(match[0]) : undefined
      if (pageNumber !== undefined) {
        const part = String_toNonEmptyString_orUndefined_afterTrim(assertIsDefinedAndReturn(parts[i + 1]))
        if (part === undefined) throw new Error(`Page is empty after trim ${pageNumber}`)
        pages.push([pageNumber, part])
        i++ // Skip the content next to the page marker
      }
    }
  }
  return pages
}
