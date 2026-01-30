import { Window, type Element } from 'happy-dom'
import { type NonEmptyStringTrimmed, String_toNonEmptyString_orUndefined_afterTrim } from './non-empty-string-trimmed'
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'https://www.english-khmer.com'

// Configuration for local asset saving
const LOCAL_ASSETS_DIR = '/home/srghma/projects/khmer/srghmakhmerdict/public/en_Dict_en_km_com_assets_images'
const PUBLIC_URL_PREFIX = '/en_Dict_en_km_com_assets_images'

/**
 * Parses raw HTML from english-khmer.com (English to Khmer Mode)
 * Target: <div id="cont-1-1">
 *
 * NOW ASYNC: Downloads images to disk.
 */
const window = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
const doc = window.document

export async function cleanEnglishKhmerHtml(html: string): Promise<NonEmptyStringTrimmed | '404' | undefined> {
  if (!html || !html.trim()) return undefined

  // console.log(chalk.blue('   Before1:'), html)

  doc.body.innerHTML = html
  const container = doc.getElementById('cont-1-1')

  const htmlHas404 = html.includes('No such dictionary word') || html.includes('No such dictionary word was found')
  const htmlHasFoundSimilarWords = html.includes('Found similar words')

  if (!container) {
    if (htmlHas404 && !htmlHasFoundSimilarWords) return '404'
    return undefined
  }

  // 1. Reliable Status Check
  const textContent = container.textContent || ''
  const isNotFound = textContent.includes('No such dictionary word') || textContent.includes('word not found')
  const hasSuggestions = textContent.includes('Did you mean') || textContent.includes('Found similar words')

  if (isNotFound && !hasSuggestions) {
    return '404'
  }

  // 3. Remove Trash (Search Forms, Ads, etc)

  // Remove Search Bar Table
  const inputs = container.querySelectorAll('input, form')
  inputs.forEach(el => {
    const table = el.closest('table')
    if (table && container.contains(table)) table.remove()
    else el.remove()
  })

  // Remove Ads Table
  const ads = container.querySelectorAll('.adsbygoogle, iframe[src*="google"], ins')
  ads.forEach(el => {
    const table = el.closest('table')
    if (table && container.contains(table)) table.remove()
    else el.remove()
  })

  // Remove generic trash elements directly
  const trashSelectors = ['#livesearch', '#aswift_1_host', 'meta', 'link', 'style']
  trashSelectors.forEach(sel => container.querySelectorAll(sel).forEach(el => el.remove()))

  // --- AUDIO REMOVAL ---
  // The site usually pairs <button>Sound</button> with a script.
  // We remove the scripts later globally, but we must manually remove the buttons here.
  const buttons = container.querySelectorAll('button')
  buttons.forEach(btn => {
    if (btn.textContent?.trim() === 'Sound') {
      btn.remove()
    }
  })

  if ((container.textContent ?? '').trim().length === 0) return '404'

  console.log(chalk.blue('   Before:'), container.innerHTML)

  // Remove all scripts (This effectively cleans up the audio logic logic too)
  container.querySelectorAll('script').forEach(el => el.remove())

  // 4. Iteratively Remove Empty Tables
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

  // 5. Fix Links & Clean Attributes
  const links = container.querySelectorAll('a')
  links.forEach(a => {
    const href = a.getAttribute('href')
    if (href) {
      a.setAttribute('href', new URL(href, BASE_URL).href)
      a.setAttribute('target', '_blank')
    }
  })

  cleanElementAttributes(container)

  // 6. Download Images Locally (Async)
  // await downloadImagesAndLinkLocal(container)

  // 7. Final Validation
  const finalHtml = container.innerHTML
  const finalText = container.textContent?.trim()

  if (!finalText) {
    if (isNotFound) return '404'
    return undefined
  }

  console.log(chalk.blue('   After:'), container.innerHTML)

  return minifyHtml(finalHtml)
}

// --- Helpers ---

// async function downloadImagesAndLinkLocal(root: Element) {
//   const images = Array.from(root.querySelectorAll('img'))
//
//   if (images.length === 0) return
//
//   // Ensure directory exists
//   if (!fs.existsSync(LOCAL_ASSETS_DIR)) {
//     fs.mkdirSync(LOCAL_ASSETS_DIR, { recursive: true })
//   }
//
//   await Promise.all(
//     images.map(async img => {
//       const src = img.getAttribute('src')
//       if (!src || src.startsWith('data:')) return
//
//       try {
//         // cleanElementAttributes has already ensured absolute URLs,
//         // but let's double check
//         const absUrl = src.startsWith('http') ? src : new URL(src, BASE_URL).href
//
//         // Parse URL to get original filename
//         // e.g. https://site.com/images/cat.png?v=1 -> cat.png
//         const urlObj = new URL(absUrl)
//         const originalFilename = path.basename(urlObj.pathname)
//
//         // Decode URI component in case of encoded characters, fall back to default if empty
//         const safeFilename = decodeURIComponent(originalFilename) || `image-${Date.now()}.png`
//
//         const localFilePath = path.join(LOCAL_ASSETS_DIR, safeFilename)
//         const publicWebPath = `${PUBLIC_URL_PREFIX}/${safeFilename}`
//
//         // Optimization: If file already exists, just link it and skip download
//         // (Remove this check if you always want to overwrite)
//         if (fs.existsSync(localFilePath)) {
//           img.setAttribute('src', publicWebPath)
//         } else {
//           console.log(chalk.yellow(`   Downloading image:`), absUrl)
//           const response = await fetch(absUrl, {
//             headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; Bot/1.0)', Referer: 'https://www.english-khmer.com/' },
//           })
//
//           if (!response.ok) {
//             console.warn(`Failed to fetch image: ${absUrl} (${response.status})`)
//             return
//           }
//
//           const arrayBuffer = await response.arrayBuffer()
//           const buffer = Buffer.from(arrayBuffer)
//
//           fs.writeFileSync(localFilePath, buffer)
//           img.setAttribute('src', publicWebPath)
//         }
//
//         // Allow CSS to control size, clean up fixed dimensions
//         img.removeAttribute('width')
//         img.removeAttribute('height')
//         img.style.maxWidth = '100%'
//       } catch (e) {
//         console.warn(`Error downloading image ${src}:`, e)
//       }
//     }),
//   )
// }

// /**
//  * Finds inline scripts creating `new Audio()`, fetches the MP3,
//  * converts to Base64, and replaces the old "Sound" button with an <audio> tag.
//  */
// async function processAudioScriptsAndEmbed(root: Element) {
//   const scripts = Array.from(root.querySelectorAll('script'))
//
//   await Promise.all(
//     scripts.map(async script => {
//       const text = script.textContent || ''
//       const match = text.match(/new Audio\("([^"]+)"\)/)
//
//       if (!match) return // Not an audio script
//
//       const relativeUrl = match[1]
//       if (!relativeUrl) return // Not an audio script
//       const absoluteUrl = new URL(relativeUrl, BASE_URL).href
//
//       // Find the associated button (usually immediately preceding the script)
//       // Structure: <button>Sound</button> <script>...</script>
//       let targetElement: Element | null = script.previousElementSibling
//
//       // Sometimes there are text nodes or whitespace, but previousElementSibling skips text nodes.
//       // Ensure it's the button
//       if (targetElement?.tagName !== 'BUTTON') {
//         // Fallback: Just insert before the script if button not found
//         targetElement = script
//       }
//
//       try {
//         const response = await fetch(absoluteUrl, {
//           headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; Bot/1.0)', Referer: 'https://www.english-khmer.com/' },
//         })
//
//         if (response.ok) {
//           const buffer = await response.arrayBuffer()
//           const base64 = Buffer.from(buffer).toString('base64')
//           const mimeType = response.headers.get('content-type') || 'audio/mpeg'
//
//           const audio = script.ownerDocument.createElement('audio')
//           audio.setAttribute('controls', '')
//           audio.setAttribute('src', `data:${mimeType};base64,${base64}`)
//           audio.style.marginTop = '5px'
//           audio.style.height = '30px'
//           audio.style.maxWidth = '200px'
//
//           // Insert audio and remove the button
//           if (targetElement && targetElement !== script) {
//             targetElement.replaceWith(audio)
//           } else {
//             script.parentNode?.insertBefore(audio, script)
//           }
//         } else {
//           console.warn(`Failed to fetch audio: ${absoluteUrl} (${response.status})`)
//         }
//       } catch (e) {
//         console.warn(`Error embedding audio ${absoluteUrl}:`, e)
//       }
//
//       // Script will be removed by general cleaner later, or we can remove now
//       script.remove()
//     }),
//   )
// }

// async function replaceImagesWithBase64(root: Element) {
//   const images = Array.from(root.querySelectorAll('img'))
//
//   await Promise.all(
//     images.map(async img => {
//       const src = img.getAttribute('src')
//       if (!src || src.startsWith('data:')) return
//
//       try {
//         // cleanElementAttributes has already ensured absolute URLs,
//         // but let's double check just in case logic order changes
//         const absUrl = src.startsWith('http') ? src : new URL(src, BASE_URL).href
//
//         const response = await fetch(absUrl, {
//           headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; Bot/1.0)', Referer: 'https://www.english-khmer.com/' },
//         })
//
//         if (!response.ok) return
//
//         const buffer = await response.arrayBuffer()
//         const base64 = Buffer.from(buffer).toString('base64')
//         const mimeType = response.headers.get('content-type') || 'image/png'
//
//         img.setAttribute('src', `data:${mimeType};base64,${base64}`)
//
//         // Allow CSS to control size
//         img.removeAttribute('width')
//         img.removeAttribute('height')
//         img.style.maxWidth = '100%'
//       } catch (e) {
//         console.warn(`Error embedding image ${src}:`, e)
//       }
//     }),
//   )
// }

function cleanElementAttributes(root: Element) {
  // Clean Root
  root.removeAttribute('style')
  root.removeAttribute('class')
  root.removeAttribute('id')

  // Clean Children
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
