import { Window, type Element } from 'happy-dom'
import {
  type NonEmptyStringTrimmed,
  String_toNonEmptyString_afterTrim,
  String_toNonEmptyString_orUndefined_afterTrim,
} from './non-empty-string-trimmed'
import { Array_filterMap } from './array'

// ---- Types ----

export interface WiktionaryData {
  readonly ipa: NonEmptyStringTrimmed | undefined
  readonly romanization: NonEmptyStringTrimmed | undefined
  readonly etymology: NonEmptyStringTrimmed | undefined
  readonly definitions: readonly NonEmptyStringTrimmed[]
}

export const WIKTIONARY_DATA_EMPTY: WiktionaryData = {
  ipa: undefined,
  romanization: undefined,
  etymology: undefined,
  definitions: [],
}

// ---- Implementation ----

export function extractWiktionaryData(html: string): WiktionaryData {
  if (html.trim().length === 0) return WIKTIONARY_DATA_EMPTY

  const window = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
  const doc = window.document
  doc.body.innerHTML = html

  // const dom = new JSDOM(html)
  // const doc = dom.window.document

  // Helper that returns undefined instead of Option
  const getText = (element: Element | null | undefined): NonEmptyStringTrimmed | undefined => {
    if (!element || !element.textContent) return undefined
    return String_toNonEmptyString_orUndefined_afterTrim(element.textContent)
  }

  // 1. IPA
  const ipa: NonEmptyStringTrimmed | undefined = (() => {
    const ipaSpans = Array.from(doc.querySelectorAll('.IPA'))

    const withSlashes = ipaSpans.find(el => el.textContent?.includes('/'))
    if (withSlashes) return getText(withSlashes)

    const last = ipaSpans[ipaSpans.length - 1]
    return getText(last)
  })()

  // 2. Romanization
  const romanization: NonEmptyStringTrimmed | undefined = (() => {
    const romElement = doc.querySelector('.headword-tr.manual-tr')
    if (romElement) return getText(romElement)

    const fallback = doc.querySelector('.headword-tr')
    return getText(fallback)
  })()

  // 3. Etymology
  const etymology: NonEmptyStringTrimmed | undefined = (() => {
    const idNode = doc.getElementById('Etymology')
    if (!idNode) return undefined

    let container: Element | null = idNode
    if (
      idNode.parentElement?.classList.contains('mw-heading') ||
      idNode.parentElement?.classList.contains('mw-heading3')
    ) {
      container = idNode.parentElement
    }

    let next = container?.nextElementSibling
    while (next) {
      if (next.tagName === 'P') {
        return getText(next)
      }
      if (/^H\d$/.test(next.tagName) || next.classList.contains('mw-heading')) break

      next = next.nextElementSibling
    }

    return undefined
  })()

  // 4. Definitions
  const definitions: readonly NonEmptyStringTrimmed[] = (() => {
    const orderedLists = doc.querySelectorAll('ol')
    const rawLines: string[] = []

    orderedLists.forEach(ol => {
      if (ol.closest('.toc') || ol.closest('.mw-indicators')) return

      ol.querySelectorAll('li').forEach(li => {
        if (li.textContent) rawLines.push(li.textContent)
      })
    })

    return Array_filterMap(rawLines, line => String_toNonEmptyString_afterTrim(line) ?? undefined)
  })()

  return { ipa, romanization, etymology, definitions }
}
