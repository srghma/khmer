import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from './non-empty-string-trimmed'

export const wiktionary_km__get_short_info__only_en_or_ru_text_without_html = (
  html: NonEmptyStringTrimmed,
): NonEmptyStringTrimmed | undefined => {
  if (!html.trim()) throw new Error('expected trimmed')

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const resultParts: string[] = []

  // --- STRATEGY 1: Standard Wiktionary (Headers + OL) ---
  const headers = Array.from(doc.querySelectorAll('h3, h4'))

  for (const header of headers) {
    const pos = (header.textContent || '').trim()

    // Skip non-POS headers and top-level language headers
    if (
      [
        'Pronunciation',
        'Etymology',
        'Etymology 1',
        'Etymology 2',
        'Etymology 3',
        'Etymology 4',
        'See also',
        'References',
        'Usage notes',
        'Alternative forms',
        'Khmer',
      ].includes(pos)
    ) {
      continue
    }
    if (!pos) continue

    // Find the associated definition list (<ol>)
    let currentNode: Element | null = header

    // If header is wrapped in mw-heading (New Wiktionary layout), start from the wrapper
    if (header.parentElement && header.parentElement.classList.contains('mw-heading')) {
      currentNode = header.parentElement
    }

    let definitionsList: Element | null = null

    // Look forward for the next <ol> before hitting another header
    while (currentNode && currentNode.nextElementSibling) {
      currentNode = currentNode.nextElementSibling
      const tagName = currentNode.tagName.toLowerCase()

      if (tagName === 'ol') {
        definitionsList = currentNode
        break
      }

      // Stop if we hit another header section
      if (['h3', 'h4'].includes(tagName)) {
        break
      }
      // Stop if we hit a div that acts as a header wrapper
      if (tagName === 'div' && (currentNode.classList.contains('mw-heading') || currentNode.querySelector('h3, h4'))) {
        break
      }
    }

    if (definitionsList) {
      const defs = extractDefinitionsFromOL(definitionsList)

      if (defs.length > 0) {
        resultParts.push(`${pos}: ${defs.join('; ')}`)
      }
    }
  }

  // --- STRATEGY 2: Legacy/Table Format (Fallback) ---
  if (resultParts.length === 0) {
    const tableDefs = Array.from(doc.querySelectorAll('td.text2'))

    tableDefs.forEach(td => {
      const text = (td.textContent || '').trim()
      if (text) {
        resultParts.push(text)
      }
    })
  }

  return String_toNonEmptyString_orUndefined_afterTrim(resultParts.join('\n'))
}

// Helper to clean and extract LI text
function extractDefinitionsFromOL(ol: Element): string[] {
  const lis = Array.from(ol.children).filter(c => c.tagName.toLowerCase() === 'li')
  const defs: string[] = []

  lis.forEach((li, index) => {
    const clone = li.cloneNode(true) as Element

    // 1. Remove examples/notes to keep it "short"
    const examples = clone.querySelectorAll('dl, ul, .example-block, .example-details')
    examples.forEach(ex => ex.remove())

    // 2. Remove Khmer text spans (class="Khmr") and explicit lang="km"
    const khmerSpans = clone.querySelectorAll('.Khmr, [lang="km"]')
    khmerSpans.forEach(span => span.remove())

    // 3. Get text content
    let text = clone.textContent || ''

    // 4. Aggressive cleanup of remaining Khmer characters
    text = text.replace(/[\u1780-\u17FF\u19E0-\u19FF]+/g, '')

    // 5. Cleanup parentheses/junk left over
    text = text.replace(/\(\s*\)/g, '') // empty parens
    text = text.replace(/\s\s+/g, ' ').trim()
    text = text.replace(/^[,;]\s*/, '') // leading punctuation

    if (text) {
      defs.push(`${index + 1}. ${text}`)
    }
  })

  return defs
}
