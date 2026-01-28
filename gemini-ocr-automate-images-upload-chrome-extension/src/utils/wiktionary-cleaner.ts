import { Window, type Element, type Document } from 'happy-dom'
import { assertIsDefinedAndReturn } from './asserts'

export class WiktionaryCleaner {
  private window: Window
  private doc: Document

  constructor() {
    this.window = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
    this.doc = this.window.document
  }

  free() {
    try {
      this.window.close()
    } catch (e) {
      // ignore
    }
  }

  clean(html: string): string {
    if (!html) return ''

    // 1. Reset DOM content
    this.doc.body.innerHTML = html
      .replace(/[\uFEFF\u200B]/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()

    // 2. Remove unconditional junk
    const junkSelectors = [
      'script',
      'style',
      'noscript',
      'meta',
      'link',
      '.printfooter',
      '#catlinks',
      '#mw-hidden-catlinks',
      '#siteSub',
      '#contentSub',
      '.mw-indicators',
      '.vector-body-before-content',
      '.mw-editsection',
      '.mw-editsection-bracket',
      '#mw-fr-revision-details',
      '.cdx-dialog',
      'header.cdx-dialog__header',
      'div.cdx-dialog__body',
      'table.stub-main-footer',
      'h1#Кхмерский',
      'h3#Морфологические_и_синтаксические_свойства',
      '.previewonly',
      '.error',
      '.attentionseeking',
      '.mw-ext-cite-error',
    ]

    const junkNodes = this.doc.querySelectorAll(junkSelectors.join(','))
    for (let i = 0; i < junkNodes.length; i++) {
      junkNodes[i]!.remove()
    }

    // 2.1 FIX: Explicitly remove block elements nested inside inline elements
    const inlineContainers = this.doc.querySelectorAll('small, sup, sub, span, i, b')
    for (let i = 0; i < inlineContainers.length; i++) {
      const container = inlineContainers[i]!
      const illegalBlocks = container.querySelectorAll('pre, div, p, table')
      for (let j = 0; j < illegalBlocks.length; j++) {
        illegalBlocks[j]!.remove()
      }
    }

    // 2.2 FIX: Unwrap <big> tags to prevent nesting and deprecation errors
    // This removes the <big> tag but leaves the inner text/slash.
    const bigTags = this.doc.querySelectorAll('big')
    for (let i = 0; i < bigTags.length; i++) {
      const el = bigTags[i]!
      while (el.firstChild) {
        el.parentNode?.insertBefore(el.firstChild, el)
      }
      el.remove()
    }

    // 3. Clean Attributes (IDs and Data tags)
    const allElements = this.doc.querySelectorAll('*')
    for (let i = 0; i < allElements.length; i++) {
      const el = assertIsDefinedAndReturn(allElements[i])

      // Clean IDs to prevent duplicate ID errors in DB
      if (el.hasAttribute('id')) {
        el.removeAttribute('id')
      }

      // Clean Data Attributes
      const attrs = el.getAttributeNames()
      for (const attr of attrs) {
        if (
          attr.startsWith('data-mw') ||
          attr.startsWith('data-id') ||
          attr === 'onclick' ||
          attr === 'about' ||
          attr === 'typeof' ||
          attr === 'aria-labelledby'
        ) {
          el.removeAttribute(attr)
        }
      }
    }

    // 3.1 Custom Logic: Remove specific "Etymology ??" and "Root --" Paragraphs
    const ps = this.doc.querySelectorAll('p')
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i]!
      const txt = p.textContent?.trim() || ''

      if (txt.includes('Происходит от') && txt.includes('??')) {
        p.remove()
        continue
      }

      if (txt.includes('Корень:') && txt.includes('--')) {
        p.remove()
        continue
      }
    }

    // 3.2 Custom Logic: Remove specific dictionary citation
    const citations = this.doc.querySelectorAll('.citation')
    for (let i = 0; i < citations.length; i++) {
      const cite = citations[i]!
      const txt = cite.textContent || ''
      if (txt.includes('Кхмерско-русский словарь') && txt.includes('Ю. А. Горгониев')) {
        const parent = cite.parentElement
        if (parent && parent.tagName === 'LI') {
          parent.remove()
        } else {
          cite.remove()
        }
      }
    }

    // 4. Remove "Empty" Elements
    const emptyElts = this.doc.querySelectorAll('.mw-empty-elt')
    for (let i = 0; i < emptyElts.length; i++) {
      emptyElts[i]!.remove()
    }

    // 5. Remove Empty Lists
    const lists = this.doc.querySelectorAll('ol, ul')
    for (let i = 0; i < lists.length; i++) {
      const list = assertIsDefinedAndReturn(lists[i])
      if (list.children.length === 0 || !list.textContent?.trim()) {
        list.remove()
      }
    }

    // 6. Remove Empty Tables
    const tables = this.doc.querySelectorAll('table')
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]!
      const blockBodies = table.querySelectorAll('.block-body')
      if (blockBodies.length > 0) {
        let hasContent = false
        for (let b = 0; b < blockBodies.length; b++) {
          if (blockBodies[b]!.textContent?.trim()) {
            hasContent = true
            break
          }
        }
        if (!hasContent) {
          table.remove()
        }
      }
    }

    // 7. Remove Empty Sections
    const sections = this.doc.querySelectorAll('section')
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]!
      let hasContent = false
      const nodes = section.childNodes

      for (let j = 0; j < nodes.length; j++) {
        const node = nodes[j]!
        if (node.nodeType === 3 && node.textContent?.trim()) {
          hasContent = true
          break
        }
        if (node.nodeType === 1) {
          const el = node as unknown as Element
          const tagName = el.tagName
          const isHeader = /^H[1-6]$/.test(tagName) || el.classList.contains('mw-heading')

          if (!isHeader) {
            if (el.textContent?.trim()) {
              hasContent = true
              break
            }
          }
        }
      }
      if (!hasContent) {
        section.remove()
      }
    }

    // 8. Serialize
    let processed = this.doc.body.innerHTML
    processed = processed
      .replace(/[\t\n\r]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^<div[^>]*>\s*<\/div>/, '')
      .trim()

    return processed
  }
}
