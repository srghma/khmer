import { Database } from 'bun:sqlite'
import * as path from 'path'
import * as crypto from 'crypto'
import * as os from 'os'
import fs from 'node:fs'
import { HtmlValidate, type ConfigData } from 'html-validate'
import { Window } from 'happy-dom'

import { ReportStreamer } from './utils/report-streamer.js'
import { type NonEmptyStringTrimmed, nonEmptyString_afterTrim } from './utils/non-empty-string-trimmed.js'

// --- 1. CONFIGURATION ---

const CONFIG = {
  MODE: 'en_to_km' as 'en_to_km' | 'km_to_en',
  // MODE: 'km_to_en' as 'en_to_km' | 'km_to_en',
  WRITE_TO_DB: true,
  GENERATE_REPORT: true,
  VALIDATE_HTML: true,
  STOP_ON_ERROR: true,
  IF_INVALID_HTML_THROW: true,
  CHUNK_SIZE: 400,
}

const DICT_DB_PATH = '/home/srghma/projects/khmer/km_dict_tauri/src-tauri/dict.db'
const ASSETS_DIR = '/home/srghma/projects/khmer/km_dict_tauri/src/assets/en_Dict_en_km_com_assets_images'
const REPORT_FILE_PATH = `migrate_ek_report_${CONFIG.MODE}.html`

const TARGET_CONFIG = {
  en_to_km: {
    targetTable: 'en_Dict',
    targetColumn: 'en_km_com',
    sourceTable: 'ek_entries',
  },
  km_to_en: {
    targetTable: 'km_Dict',
    targetColumn: 'en_km_com',
    sourceTable: 'ek_kh_en_entries',
  },
}[CONFIG.MODE]

const validatorConfig: ConfigData = {
  extends: [],
  rules: {
    'close-order': 'error',
    'no-dup-id': 'error',
    'no-raw-characters': 'error',
    'unrecognized-char-ref': 'error',
    'void-content': 'error',
    'void-style': 'error',
    'attr-quotes': 'error',
    'element-case': 'error',
    'attr-case': 'error',
    'attribute-empty-style': 'error',
    'no-inline-style': 'off',
    'element-permitted-content': 'error',
    'no-unknown-elements': 'error',
    deprecated: 'error',
    'missing-doctype': 'off',
    'doctype-style': 'error',
    'no-implicit-close': 'error',
  },
  elements: ['html5', { pv: { flow: true, phrasing: true } }],
}

const htmlValidator = new HtmlValidate(validatorConfig)

// --- 2. ASSET TYPES ---

export type AssetHash = NonEmptyStringTrimmed & { readonly __brandAssetHash: 'AssetHash' }

interface Asset {
  hash: AssetHash
  rawBuffer: Buffer
  mime: string
  extension: string
}

// Global Asset Cache to prevent reprocessing/writing existing files in this run
const PROCESSED_ASSETS = new Set<string>()

// Ensure asset directory exists
if (CONFIG.MODE === 'en_to_km' && CONFIG.WRITE_TO_DB) {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true })
  }
}

function parseBase64Image(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
  if (!match) return null

  const mime = match[1]
  if (!mime) return null
  const base64Data = match[2]
  if (!base64Data) return null

  return {
    buffer: Buffer.from(base64Data, 'base64'),
    mime: mime,
  }
}

// --- 3. CLEANER LOGIC ---

class EnglishKhmerCleaner {
  private window: Window
  private doc: Document
  private mode: 'en_to_km' | 'km_to_en'

  constructor(mode: 'en_to_km' | 'km_to_en') {
    this.mode = mode
    this.window = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
    this.doc = this.window.document as unknown as Document
  }

  free() {
    try {
      this.window.close()
    } catch (e) {}
  }

  clean(html: string): { html: string; assets: Map<AssetHash, Asset> } {
    const assetsMap = new Map<AssetHash, Asset>()

    if (!html) return { html: '', assets: assetsMap }

    // 1. Load HTML
    const preCleaned = html
      .replace(/[\uFEFF\u200B]/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()

    // 2. Strict Checks for km_to_en
    if (this.mode === 'km_to_en') {
      if (preCleaned.includes('<img') || preCleaned.includes('<audio')) {
        this.doc.body.innerHTML = preCleaned
        if (this.doc.querySelectorAll('img, audio').length > 0) {
          throw new Error('Unexpected <img/> or <audio/> tag found in km_to_en mode.')
        }
      }
    }

    this.doc.body.innerHTML = preCleaned

    // // 3. Asset Extraction (en_to_km only)
    // if (this.mode === 'en_to_km') {
    //   // A. Remove Audio Completely
    //   const audios = this.doc.querySelectorAll('audio')
    //   for (const audio of audios) {
    //     audio.remove()
    //   }
    //
    //   // B. Process Images
    //   const images = this.doc.querySelectorAll('img')
    //   for (const img of images) {
    //     const src = img.getAttribute('src')
    //     if (src && src.startsWith('data:image')) {
    //       const parsed = parseBase64Image(src)
    //
    //       if (parsed) {
    //         // Calculate Hash (SHA256)
    //         // Truncate to 32 characters as requested
    //         const hashRaw = crypto.createHash('sha256').update(parsed.buffer).digest('hex').substring(0, 32)
    //         const hash = nonEmptyString_afterTrim(hashRaw) as AssetHash
    //
    //         // Add to map for processing
    //         if (!assetsMap.has(hash)) {
    //           assetsMap.set(hash, {
    //             hash,
    //             rawBuffer: parsed.buffer,
    //             mime: parsed.mime,
    //             extension: 'webp', // We will convert everything to webp
    //           })
    //         }
    //
    //         // Update DOM to point to file
    //         // Note: Adjust the src prefix as needed by your frontend app
    //         img.setAttribute('src', `en_Dict_en_km_com_assets_images/${hash}.webp`)
    //
    //         // Clean attributes
    //         img.removeAttribute('style')
    //         img.removeAttribute('width')
    //         img.removeAttribute('height')
    //         img.setAttribute('class', 'ek-img')
    //       } else {
    //         img.remove() // Invalid base64
    //       }
    //     } else {
    //       // Remove non-base64 images (external links)
    //       img.remove()
    //     }
    //   }
    // }

    // 4. Remove Junk Tags
    const junkTags = ['script', 'iframe', 'object', 'style', 'link', 'meta']
    for (const tag of junkTags) {
      const elements = this.doc.querySelectorAll(tag)
      for (const el of elements) el.remove()
    }

    // 5. Remove Facebook Tables & Junk
    const tables = this.doc.querySelectorAll('table')
    for (const table of tables) {
      const content = table.innerHTML
      if (content.includes('fb-comments') || content.includes('fb-like')) {
        table.remove()
      }
      if (
        table.textContent?.includes('Did you mean:') ||
        (table.textContent?.includes('Found similar words:') && !preCleaned.includes('Definition:'))
      ) {
        table.remove()
      }
    }

    const fbRoot = this.doc.getElementById('fb-root')
    if (fbRoot) fbRoot.remove()

    // 6. Sanitize Attributes
    const allElements = this.doc.querySelectorAll('*')
    for (const el of allElements) {
      const attrs = el.getAttributeNames()
      for (const attr of attrs) {
        if (attr.startsWith('on')) {
          el.removeAttribute(attr)
        }
      }

      if (el.tagName === 'A') {
        let href = el.getAttribute('href')
        if (href) {
          if (href.includes('english-khmer.com/index.php?gcm=')) {
            href = href.replace(/&amp;/g, '&')
            el.setAttribute('href', href)
          }
        }
      }
    }

    // 7. Unwrap <font>
    const fontTags = this.doc.querySelectorAll('font')
    for (const el of fontTags) {
      if (el.attributes.length === 0) {
        const parent = el.parentNode
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el)
          }
          el.remove()
        }
      }
    }

    // 8. Fix Invalid Lists
    const lists = this.doc.querySelectorAll('ol, ul')
    for (const list of lists) {
      let hasInvalidChild = false
      for (const child of list.children) {
        if (child.tagName !== 'LI') {
          hasInvalidChild = true
          break
        }
      }
      if (hasInvalidChild) {
        const div = this.doc.createElement('div')
        while (list.firstChild) {
          div.appendChild(list.firstChild)
        }
        list.replaceWith(div)
      }
    }

    // 9. Remove Empty Formatting
    const emptyCandidatesSelector = 'i, b, u, strong, em, span, small, big, p, div, font'
    const emptyCandidates = this.doc.querySelectorAll(emptyCandidatesSelector)
    for (const el of emptyCandidates) {
      if (el.textContent?.trim() === '' && el.children.length === 0) {
        el.remove()
      }
    }

    // 10. Serialize
    const finalHtml = this.doc.body.innerHTML
      .replace(/[\t\n\r]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
      .replace(/^<br>$/g, '')

    return { html: finalHtml, assets: assetsMap }
  }
}

// --- 4. HELPER FUNCTIONS ---

// async function saveAssets(assets: Map<AssetHash, Asset>) {
//   if (!CONFIG.WRITE_TO_DB) return
//
//   for (const [hash, asset] of assets) {
//     if (PROCESSED_ASSETS.has(hash)) continue
//
//     const filePath = path.join(ASSETS_DIR, `${hash}.webp`)
//
//     // Skip if file exists on disk
//     if (fs.existsSync(filePath)) {
//       PROCESSED_ASSETS.add(hash)
//       continue
//     }
//
//     try {
//       const tempIn = path.join(os.tmpdir(), `${hash}_in.bin`)
//       fs.writeFileSync(tempIn, asset.rawBuffer)
//
//       // Use system cwebp (requires 'nix-shell -p libwebp' or installed package)
//       const proc = Bun.spawn(['cwebp', '-q', '80', tempIn, '-o', filePath], {
//         stderr: 'pipe',
//       })
//
//       const exitCode = await proc.exited
//
//       fs.unlinkSync(tempIn)
//
//       if (exitCode !== 0) {
//         const stderr = await new Response(proc.stderr).text()
//         throw new Error(`cwebp failed with code ${exitCode}: ${stderr}. Ensure 'libwebp' is installed in NixOS.`)
//       }
//
//       if (!fs.existsSync(filePath)) {
//         throw new Error(`cwebp succeeded but file not created at ${filePath}`)
//       }
//
//       PROCESSED_ASSETS.add(hash)
//     } catch (e) {
//       console.error(`Failed to convert/save image ${hash}`, e)
//       if (CONFIG.STOP_ON_ERROR) throw e
//     }
//   }
// }

async function processEntry(
  word: string,
  originalHtml: string,
  cleaner: EnglishKhmerCleaner,
): Promise<{ status: string; cleaned: string; error?: string }> {
  const {
    html: cleanedHtml,
    // assets
  } = cleaner.clean(originalHtml)

  if (!cleanedHtml) return { status: 'SKIP: EMPTY', cleaned: '' }
  if (cleanedHtml === word) return { status: 'SKIP: EQUALS WORD', cleaned: '' }

  // Save Assets to Disk (Async)
  // if (CONFIG.MODE === 'en_to_km' && assets.size > 0) {
  //   await saveAssets(assets)
  // }

  if (CONFIG.VALIDATE_HTML) {
    const report = htmlValidator.validateStringSync(cleanedHtml)
    if (!report.valid) {
      const msg = report.results[0]?.messages[0]?.message || 'Unknown'
      const consolemsg = `${msg}\n\n${originalHtml}\n\n${cleanedHtml}`
      if (CONFIG.IF_INVALID_HTML_THROW) {
        throw new Error(consolemsg)
      } else {
        console.error(consolemsg)
      }
      return { status: `ERROR: INVALID HTML (${msg})`, cleaned: '', error: msg }
    }
    const hasScript = /<script|<iframe|<object|<embed/i.test(cleanedHtml)
    const hasEvent = /\son[a-z]+\s*=/i.test(cleanedHtml)

    if (hasScript) return { status: 'ERROR: SECURITY (SCRIPT)', cleaned: '', error: 'Contains script/iframe/object' }
    if (hasEvent) return { status: 'ERROR: SECURITY (EVENT)', cleaned: '', error: 'Contains event handler' }
  }

  return { status: 'VALID', cleaned: cleanedHtml }
}

// --- 5. MAIN MIGRATION LOGIC ---

const migrate = async () => {
  console.log(`🏁 Starting Migration [Mode: ${CONFIG.MODE}]`)
  console.log(`📦 Chunk Size: ${CONFIG.CHUNK_SIZE}`)
  console.log(`📝 Write to DB: ${CONFIG.WRITE_TO_DB}`)

  const dictDb = new Database(DICT_DB_PATH)

  const cacheDbPath =
    CONFIG.MODE === 'en_to_km'
      ? path.join(process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`, 'english-khmer-com-cache2.sqlite')
      : path.join(process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`, 'english-khmer-com-kh-en-cache.sqlite')

  if (!require('fs').existsSync(cacheDbPath)) {
    throw new Error(`Cache DB not found at: ${cacheDbPath}`)
  }

  const cacheDb = new Database(cacheDbPath, { readonly: true })

  if (CONFIG.WRITE_TO_DB) {
    dictDb.run('PRAGMA synchronous = OFF;')
    dictDb.run('PRAGMA journal_mode = MEMORY;')
  }

  const cleaner = new EnglishKhmerCleaner(CONFIG.MODE)
  const report = CONFIG.GENERATE_REPORT
    ? new ReportStreamer(REPORT_FILE_PATH, {
        title: `English-Khmer.com Report (${CONFIG.MODE})`,
        columns: [
          { header: 'Word', accessor: 'w', width: '150px' },
          { header: 'Status', accessor: 's', width: '120px', type: 'status' },
          { header: 'Before (HTML)', accessor: 'b', type: 'html' },
          { header: 'After (HTML)', accessor: 'a', type: 'html' },
        ],
      })
    : null

  let upsertStmt: any = null
  if (CONFIG.WRITE_TO_DB) {
    const cols = dictDb.query(`PRAGMA table_info(${TARGET_CONFIG.targetTable})`).all() as { name: string }[]
    if (!cols.some(c => c.name === TARGET_CONFIG.targetColumn)) {
      console.log(`➕ Adding column '${TARGET_CONFIG.targetColumn}' to ${TARGET_CONFIG.targetTable}...`)
      dictDb.run(`ALTER TABLE ${TARGET_CONFIG.targetTable} ADD COLUMN ${TARGET_CONFIG.targetColumn} TEXT`)
    }

    // CHANGED: Use UPSERT (INSERT OR UPDATE)
    // ON CONFLICT(Word) requires that 'Word' is a PRIMARY KEY or UNIQUE constraint.
    // In typical dictionary tables, 'Word' is usually the PK.
    upsertStmt = dictDb.prepare(
      `INSERT INTO ${TARGET_CONFIG.targetTable} (Word, ${TARGET_CONFIG.targetColumn})
       VALUES ($word, $html)
       ON CONFLICT(Word) DO UPDATE SET ${TARGET_CONFIG.targetColumn} = excluded.${TARGET_CONFIG.targetColumn}`,
    )
  }

  try {
    const { count } = cacheDb
      .query(`SELECT count(*) as count FROM ${TARGET_CONFIG.sourceTable} WHERE status = 200`)
      .get() as { count: number }
    console.log(`📊 Total rows: ${count}`)

    let offset = 0
    let processedTotal = 0

    while (processedTotal < count) {
      const chunk = cacheDb
        .query(
          `SELECT word, html FROM ${TARGET_CONFIG.sourceTable} WHERE status = 200 LIMIT ${CONFIG.CHUNK_SIZE} OFFSET ${offset}`,
        )
        .all() as { word: string; html: string }[]

      if (chunk.length === 0) break

      const validBatch: { word: string; html: string }[] = []

      for (const item of chunk) {
        const result = await processEntry(item.word, item.html, cleaner)

        if (report) {
          report.writeRow({
            w: item.word,
            s: result.status === 'VALID' ? (CONFIG.WRITE_TO_DB ? 'UPDATED' : 'VALID') : result.status,
            b: item.html,
            a: result.cleaned,
          })
        }

        if (result.status.startsWith('ERROR') && CONFIG.STOP_ON_ERROR) {
          throw new Error(`Stop on error (${item.word}): ${result.status} - ${result.error || ''}`)
        }

        if (result.status === 'VALID') {
          validBatch.push({ word: item.word, html: result.cleaned })
        }
      }

      if (CONFIG.WRITE_TO_DB && validBatch.length > 0 && upsertStmt) {
        const transaction = dictDb.transaction(rows => {
          for (const row of rows) {
            upsertStmt.run({ $html: row.html, $word: row.word })
          }
        })
        transaction(validBatch)
      }

      offset += chunk.length
      processedTotal += chunk.length
      process.stdout.write(`\r🚀 Processed: ${processedTotal}/${count}`)

      if (typeof Bun !== 'undefined') {
        Bun.gc(true)
        await Bun.sleep(5)
      }
    }

    console.log('\n')
    if (CONFIG.WRITE_TO_DB) {
      console.log('🧹 Vacuuming DB...')
      dictDb.run('VACUUM;')
    }
  } catch (e: any) {
    console.error('\n❌ ERROR:', e.message)
  } finally {
    if (cleaner) cleaner.free()
    if (report) report.close()
    dictDb.close()
    cacheDb.close()
    if (CONFIG.GENERATE_REPORT) console.log(`📄 Report: ${path.resolve(REPORT_FILE_PATH)}`)
  }
}

migrate()

// TODO:
// UPDATE "en_Dict"
// SET "en_km_com" = REPLACE("en_km_com", '.png"', '.webp"')
// WHERE "en_km_com" LIKE '%.png%';
//
// UPDATE "en_Dict"
// SET "en_km_com" = REPLACE("en_km_com", '&amp;gword=', '&gword=')
// WHERE "en_km_com" LIKE '%&amp;gword=%';
//
// UPDATE "en_Dict"
// SET "en_km_com" = SUBSTR("en_km_com", 5)
// WHERE "en_km_com" LIKE '<br>%';
