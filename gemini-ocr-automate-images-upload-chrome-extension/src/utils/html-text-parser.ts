import { Window, type Document, type Element } from 'happy-dom'

export class ReusableHtmlParser {
  private dom: Window
  private doc: Document

  constructor() {
    // Initialize once with a minimal skeleton
    this.dom = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
    this.doc = this.dom.document

    // this.dom = new JSDOM('<!DOCTYPE html><body></body>')
    // this.doc = this.dom.window.document
  }

  /**
   * Sets the HTML content and yields text nodes.
   * Reuses the existing DOM environment to save memory.
   */
  *iterateText(html: string): IterableIterator<string> {
    if (!html || html.trim().length === 0) return

    // 1. Reset content (this is much faster than new JSDOM(html))
    this.doc.body.innerHTML = html

    // 2. Remove Junk (Script, Style, etc)
    // We use querySelectorAll on the specific elements we want to kill
    const junkTags = this.doc.querySelectorAll('script, style, noscript, meta, link, svg, object, embed, iframe')
    for (let i = 0; i < junkTags.length; i++) {
      junkTags[i]!.remove()
    }

    // 3. TreeWalker to find Text Nodes
    const walker = this.doc.createTreeWalker(this.doc.body, 4 /* NodeFilter.SHOW_TEXT */)

    let node: Node | null
    while ((node = walker.nextNode())) {
      const text = node.nodeValue
      if (text && text.length > 0) {
        yield text
      }
    }
  }
}
