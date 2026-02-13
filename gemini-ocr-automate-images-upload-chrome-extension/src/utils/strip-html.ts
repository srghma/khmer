import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

const parser = new DOMParser()

export const stripHtml = (html: string, tagsToStripContent: NonEmptyStringTrimmed[] = []): string => {
  const trimmedHtml = html.trim()
  if (!trimmedHtml) return ''

  const doc = parser.parseFromString(trimmedHtml, 'text/html')

  // Remove specified tags and their children entirely
  for (const tag of tagsToStripContent) {
    doc.querySelectorAll(tag).forEach(el => el.remove())
  }

  // Handle line breaks and block elements by inserting spaces
  // This prevents text from merging when HTML is stripped, e.g. "Stage<br>excavated" -> "Stage excavated"
  const blockTags = 'br, p, div, li, tr, td, th, h1, h2, h3, h4, h5, h6'
  doc.querySelectorAll(blockTags).forEach(el => {
    if (el.tagName.toLowerCase() === 'br') {
      el.replaceWith(doc.createTextNode(' '))
    } else {
      // For block elements, ensure there are spaces around their content
      const spaceBefore = doc.createTextNode(' ')
      const spaceAfter = doc.createTextNode(' ')
      el.parentNode?.insertBefore(spaceBefore, el)
      el.parentNode?.insertBefore(spaceAfter, el.nextSibling)
    }
  })

  const text = doc.body.textContent || ''
  // Collapse multiple spaces into one and trim
  return text.replace(/\s+/g, ' ').trim()
}
