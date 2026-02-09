import { String_toNonEmptyString_orUndefined_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'

export const wiktionary_ru__get_short_info__only_ru_text_without_html = (
  html: NonEmptyStringTrimmed,
): NonEmptyStringTrimmed | undefined => {
  if (!html.trim()) throw new Error('expected trimmed')

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const resultParts: string[] = []

  // Russian Wiktionary structure: Look for "Значение" (Meaning) section
  const headers = Array.from(doc.querySelectorAll('h4'))

  for (const header of headers) {
    const headerText = (header.textContent || '').trim().toLowerCase()

    if (headerText.includes('значение')) {
      let currentNode: Element | null = header

      // Handle mw-heading wrapper
      if (header.parentElement && header.parentElement.classList.contains('mw-heading')) {
        currentNode = header.parentElement
      }

      let definitionsList: Element | null = null

      while (currentNode && currentNode.nextElementSibling) {
        currentNode = currentNode.nextElementSibling
        const tagName = currentNode.tagName.toLowerCase()

        if (tagName === 'ol') {
          definitionsList = currentNode
          break
        }

        // Stop at next header
        if (['h3', 'h4', 'div'].includes(tagName) && currentNode.querySelector('h3, h4')) {
          break
        }
      }

      if (definitionsList) {
        const defs = extractDefinitionsFromOL_RU(definitionsList)

        if (defs.length > 0) {
          resultParts.push(`Значение: ${defs.join('; ')}`)
        }
      }
    }
  }

  return String_toNonEmptyString_orUndefined_afterTrim(resultParts.join('\n'))
}

function extractDefinitionsFromOL_RU(ol: Element): string[] {
  const lis = Array.from(ol.children).filter(c => c.tagName.toLowerCase() === 'li')
  const defs: string[] = []

  lis.forEach((li, index) => {
    const clone = li.cloneNode(true) as Element

    // 1. Remove examples/citations
    const examples = clone.querySelectorAll('.example-fullblock, .example-block, ul, dl')
    examples.forEach(ex => ex.remove())

    // 2. Remove Khmer text
    const khmerSpans = clone.querySelectorAll('.script-khmer, [lang="km"]')
    khmerSpans.forEach(span => span.remove())

    // 3. Clean Text
    let text = clone.textContent || ''

    // Remove "◆" markers and stray Khmer
    text = text.replace(/◆/g, '')
    text = text.replace(/[\u1780-\u17FF\u19E0-\u19FF]+/g, '')
    text = text.replace(/\s\s+/g, ' ').trim()

    if (text) {
      defs.push(`${index + 1}. ${text}`)
    }
  })

  return defs
}
