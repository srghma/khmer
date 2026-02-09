const parser = new DOMParser()

export const stripHtml = (html: string): string => {
  html = html.trim()
  if (!html) return ''
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}
