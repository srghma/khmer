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

  return doc.body.textContent || ''
}
