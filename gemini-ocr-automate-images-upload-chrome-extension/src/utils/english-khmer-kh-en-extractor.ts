import { Window, type Element } from 'happy-dom'
import { type NonEmptyStringTrimmed, String_toNonEmptyString_orUndefined_afterTrim } from './non-empty-string-trimmed'
import chalk from 'chalk'

const BASE_URL = 'https://www.english-khmer.com'

/**
 * Parses raw HTML from english-khmer.com (Khmer to English Mode)
 * Target: <div id="cont-3-1">
 *
 * NOW ASYNC: Because it fetches images to embed them as Base64.
 */
export async function cleanEnglishKhmerKhEnHtml(html: string): Promise<NonEmptyStringTrimmed | '404' | undefined> {
  if (!html || !html.trim()) return undefined

  const window = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
  const doc = window.document
  doc.body.innerHTML = html
  // const dom = new JSDOM(html)
  // const doc = dom.window.document
  const container = doc.getElementById('cont-3-1')

  if (!container) {
    if (html.includes('No such dictionary word') || html.includes('No such dictionary word was found')) return '404'
    return undefined
  }

  // 1. Reliable Status Check using Text Content
  const textContent = container.textContent || ''
  const isNotFound = textContent.includes('word not found') && textContent.includes('Please try again')
  const hasSuggestions = textContent.includes('Found similar word')

  if (isNotFound && !hasSuggestions) {
    return '404'
  }

  console.log(chalk.blue('  before'), container.innerHTML)

  // 2. Remove Main Trash
  const forms = container.querySelectorAll('form')
  forms.forEach(el => {
    const table = el.closest('table')
    if (table && container.contains(table)) table.remove()
    else el.remove()
  })

  const ads = container.querySelectorAll('.adsbygoogle, iframe, script[src*="google"], ins')
  ads.forEach(el => {
    const table = el.closest('table')
    if (table && container.contains(table)) table.remove()
    else el.remove()
  })

  const trashSelectors = ['script', 'style', 'link', 'meta', '#livesearch', 'input']
  trashSelectors.forEach(sel => container.querySelectorAll(sel).forEach(el => el.remove()))

  // 3. Iteratively Remove Empty Tables
  let contentChanged = true
  while (contentChanged) {
    contentChanged = false
    const tables = container.querySelectorAll('table')
    tables.forEach(table => {
      if (!table.textContent?.trim()) {
        table.remove()
        contentChanged = true
      }
    })
  }

  // 4. Clean Attributes & Links
  const links = container.querySelectorAll('a')
  links.forEach(a => {
    const href = a.getAttribute('href')
    if (href) {
      a.setAttribute('href', new URL(href, BASE_URL).href)
      a.setAttribute('target', '_blank')
    }
  })

  cleanElementAttributes(container)

  // 5. Embed Images as Base64 (Async operation)
  await replaceImagesWithBase64(container)

  // 6. Final Content Validation
  if (isNotFound && hasSuggestions) {
    const tds = container.querySelectorAll('td')
    tds.forEach(td => {
      if (td.textContent?.includes('word not found')) {
        const row = td.closest('tr')
        const table = row?.closest('table')
        if (table) table.remove()
      }
    })
  }

  const finalHtml = container.innerHTML
  const finalText = container.textContent?.trim()

  if (!finalText) {
    if (isNotFound) return '404'
    return undefined
  }

  console.log(chalk.blue('  after'), container.innerHTML)

  return minifyHtml(finalHtml)
}

/**
 * Iterates over all <img> tags in the element, fetches the resource,
 * and converts the src to a data: base64 URI.
 */
async function replaceImagesWithBase64(root: Element) {
  const images = Array.from(root.querySelectorAll('img'))

  // Process all images in parallel
  await Promise.all(
    images.map(async img => {
      const src = img.getAttribute('src')
      if (!src) return

      try {
        // Note: `src` is already absolute thanks to cleanElementAttributes running before this
        const response = await fetch(src, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Compatible; Bot/1.0)',
            Referer: 'https://www.english-khmer.com/',
          },
        })

        if (!response.ok) {
          console.warn(`Failed to fetch image for base64: ${src} (${response.status})`)
          return // Leave original URL if fetch fails
        }

        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const mimeType = response.headers.get('content-type') || 'image/png'

        img.setAttribute('src', `data:${mimeType};base64,${base64}`)

        // Optional: remove dimensions to let it scale in Anki/HTML
        img.removeAttribute('width')
        img.removeAttribute('height')
        img.style.maxWidth = '100%'
      } catch (e) {
        console.warn(`Error embedding image ${src}:`, e)
        // On error, we just leave the original absolute URL
      }
    }),
  )
}

function cleanElementAttributes(root: Element) {
  root.removeAttribute('style')
  root.removeAttribute('class')
  root.removeAttribute('id')

  root.querySelectorAll('*').forEach(el => {
    el.removeAttribute('width')
    el.removeAttribute('height')
    el.removeAttribute('valign')
    el.removeAttribute('align')
    el.removeAttribute('nowrap')
    el.removeAttribute('bgcolor')
    el.removeAttribute('border')
    el.removeAttribute('cellspacing')
    el.removeAttribute('cellpadding')
    el.removeAttribute('style')

    if (el.tagName === 'FONT') {
      el.removeAttribute('size')
      el.removeAttribute('color')
      el.removeAttribute('face')
    }

    // Ensure absolute URLs for images first, so the fetcher can find them
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src')
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        el.setAttribute('src', new URL(src, BASE_URL).href)
      }
    }
  })
}

function minifyHtml(html: string): NonEmptyStringTrimmed | undefined {
  const cleaned = html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
  return String_toNonEmptyString_orUndefined_afterTrim(cleaned)
}
