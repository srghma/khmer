import { JSDOM } from 'jsdom'
import { type NonEmptyString, String_toNonEmptyString_orUndefined_afterTrim } from './utils/non-empty-string.js'

// -- Constants --

const REMOVE_SELECTORS = [
  'script',
  'style',
  'link',
  'meta',
  'noscript',
  '.mw-editsection', // [edit] buttons
  '.mw-indicators', // Top right icons
  '#siteSub', // "From Wiktionary..."
  '#contentSub',
  '#catlinks', // Categories box
  '.printfooter',
  '.mw-empty-elt',
  '#toc', // Table of contents
  '.toc',
  'map', // Image maps
]

// -- Implementation --

/**
 * Takes raw Wiktionary bodyContent HTML, isolates the Khmer section,
 * removes classes/ids/styles/scripts, and returns clean HTML.
 */
export function cleanWiktionaryHtml(html: string): NonEmptyString | undefined {
  if (html.trim().length === 0) return undefined

  const dom = new JSDOM(html)
  const doc = dom.window.document

  // 1. Isolate Khmer Section
  // We need to find the <h2>Khmer</h2> and grab everything until the next <h2>
  const contentContainer = doc.createElement('div')

  // Find the header. In new MediaWiki, H2 is often wrapped in <div class="mw-heading mw-heading2">
  const allH2s = Array.from(doc.querySelectorAll('h2'))
  const khmerH2 = allH2s.find(h2 => h2.textContent?.trim() === 'Khmer')

  if (khmerH2) {
    // Determine the starting node (the H2 itself or its wrapper)
    let startNode: Element = khmerH2
    if (khmerH2.parentElement?.classList.contains('mw-heading2')) {
      startNode = khmerH2.parentElement
    }

    // Iterate siblings until we hit another H2 or heading2 wrapper
    let next = startNode.nextElementSibling
    while (next) {
      const isNextHeader = next.tagName === 'H2' || (next.tagName === 'DIV' && next.classList.contains('mw-heading2'))

      if (isNextHeader) break

      contentContainer.appendChild(next.cloneNode(true))
      next = next.nextElementSibling
    }
  } else {
    // Fallback: If no Khmer header found (rare, or maybe page is ONLY Khmer),
    // use the whole body content but warn internally?
    // For safety in Anki, let's return undefined if we aren't sure it's Khmer,
    // OR just process the whole thing if it's a specific page.
    // Let's assume we clean the whole provided snippet if no specific section found.
    contentContainer.innerHTML = doc.body.innerHTML
  }

  if (!contentContainer.innerHTML.trim()) return undefined

  // 2. Remove Garbage Elements
  REMOVE_SELECTORS.forEach(selector => {
    contentContainer.querySelectorAll(selector).forEach(el => el.remove())
  })

  // 3. Remove Comments
  const nodeIterator = doc.createNodeIterator(contentContainer, 128 /* NodeFilter.SHOW_COMMENT */)
  let currentNode
  while ((currentNode = nodeIterator.nextNode())) {
    currentNode.parentNode?.removeChild(currentNode)
  }

  // 4. Strip Attributes (id, class, style, etc.)
  const allElements = contentContainer.querySelectorAll('*')
  allElements.forEach(el => {
    // We iterate backwards through attributes to remove them safely
    while (el.attributes.length > 0) {
      el.removeAttributeNode(el.attributes[0]!)
    }

    // Restore simple hrefs if you want links to work,
    // but convert relative to absolute so they work in Anki
    // (If you truly want NO trash, leave this out. Uncomment to keep links)
    if (el.tagName === 'A' && (el as HTMLAnchorElement).href) {
      el.setAttribute('href', (el as HTMLAnchorElement).href)
    }
  })

  // 5. Final whitespace cleanup
  const cleanedHtml = contentContainer.innerHTML
    .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
    .trim()

  return String_toNonEmptyString_orUndefined_afterTrim(cleanedHtml)
}
