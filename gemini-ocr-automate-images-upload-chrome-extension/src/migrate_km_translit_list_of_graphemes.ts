import { Database } from 'bun:sqlite'
import { assertIsDefinedAndReturn } from './utils/asserts'
import * as fs from 'fs'
import {
  khnormal,
  reorderText,
  strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined,
  strToKhmerWordOrThrow,
  type TypedKhmerWord,
} from './utils/khmer-word'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from './utils/non-empty-string-trimmed'
import { Set_filterMap_usingUndefined, Set_sortStringKeys } from './utils/sets'
import { Char_mkOrThrow, type Char } from './utils/char'
import { recursiveMapSetToArray } from './utils/pojo'
import { generateKhmerSegmentsYaml } from './utils/generate-khmer-segments-to-ru-transliteration-automatic'
import { startKhmerSegmentEditor } from './migrate_km_translit_list_of_graphemes-khmer-segment-editor'

// --- Configuration ---
const CONFIG = {
  DB_PATH: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',
  ONLY_VERIFIED: true,
}

const IS_VERIFIED_WHERE = `(
    Wiktionary IS NOT NULL OR from_csv_variants IS NOT NULL OR from_csv_nounForms IS NOT NULL
    OR from_csv_pronunciations IS NOT NULL OR from_csv_rawHtml IS NOT NULL OR from_chuon_nath IS NOT NULL
    OR from_russian_wiki IS NOT NULL OR en_km_com IS NOT NULL
)`

async function main() {
  const db = new Database(CONFIG.DB_PATH)

  // 1. Fetch Words
  const query = CONFIG.ONLY_VERIFIED
    ? `SELECT Word FROM km_Dict WHERE ${IS_VERIFIED_WHERE}`
    : `SELECT Word FROM km_Dict`
  const rows = db.query(query).all() as { Word: string }[]
  const words = rows.map(x => x.Word)

  // 2. Segment and Normalize
  const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' })
  const rawSegments = new Set<NonEmptyStringTrimmed>()
  for (const word of words) {
    const word_ = strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined(word)
    if (!word_) continue
    for (const { segment } of segmenter.segment(word_)) {
      const s = String_toNonEmptyString_orUndefined_afterTrim(segment)
      if (s) rawSegments.add(s)
    }
  }

  const segmentsNormalized: Set<TypedKhmerWord> = Set_filterMap_usingUndefined(rawSegments, s => {
    const s_ = s.replace(/្$/, '')
    if (!s_) return undefined
    const segment_ = strToKhmerWordOrThrow(s_)
    const segmentNormal = khnormal(reorderText(segment_))
    // Keep '្' for visual representation, but if your logic requires it stripped,
    // you can uncomment the filter below. Here we keep it for proper Khmer rendering.
    // .filter(x => x !== '្')
    const chars = Array.from(segmentNormal).join('')
    return chars ? strToKhmerWordOrThrow(chars) : undefined
  })

  // 3. Grouping Logic: Length -> Base -> Graphemes
  const lengthGroups = new Map<number, Map<Char, Set<TypedKhmerWord>>>()

  for (const seg of segmentsNormalized) {
    const chars = Array.from(seg)
    const len = chars.length
    const base = Char_mkOrThrow(assertIsDefinedAndReturn(chars[0]))

    if (!lengthGroups.has(len)) lengthGroups.set(len, new Map())
    const baseMap = lengthGroups.get(len)!
    if (!baseMap.has(base)) baseMap.set(base, new Set())
    baseMap.get(base)!.add(seg)
  }

  lengthGroups.delete(1)

  await startKhmerSegmentEditor(db, lengthGroups)

  // generateKhmerSegmentsYaml(lengthGroups)
  // fs.writeFileSync('./lengthGroups.json', JSON.stringify(recursiveMapSetToArray(lengthGroups), null, 2))

  // 4. Generate HTML
  //   const sortedLengths = Array.from(lengthGroups.keys()).sort((a, b) => a - b)
  //
  //   let html = `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //     <meta charset="UTF-8">
  //     <title>Khmer Grapheme Inventory</title>
  //     <style>
  //         :root {
  //             --bg: #f0f2f5;
  //             --primary: #1a73e8;
  //             --text: #202124;
  //             --card: #ffffff;
  //             --border: #dadce0;
  //         }
  //         body { font-family: 'Kantumruy Pro', 'Khmer OS Battambang', sans-serif; background: var(--bg); color: var(--text); padding: 40px; line-height: 1.5; }
  //         h1 { font-weight: 300; text-align: center; margin-bottom: 50px; }
  //         .length-section { margin-bottom: 60px; }
  //         .length-header {
  //             font-size: 1.2rem; text-transform: uppercase; letter-spacing: 2px; color: #5f6368;
  //             border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-bottom: 25px;
  //             display: flex; align-items: center; gap: 15px;
  //         }
  //         .badge { background: var(--primary); color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; }
  //
  //         .consonants-grid {
  //             display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
  //         }
  //         .base-card {
  //             background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px;
  //             transition: box-shadow 0.2s;
  //         }
  //         .base-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  //         .base-label {
  //             font-size: 0.8rem; color: var(--primary); font-weight: bold; margin-bottom: 12px;
  //             display: flex; justify-content: space-between;
  //         }
  //         .grapheme-list { display: flex; flex-wrap: wrap; gap: 8px; }
  //         .grapheme-item {
  //             background: #f8f9fa; border: 1px solid var(--border); border-radius: 4px;
  //             padding: 6px 12px; font-size: 1.6rem; cursor: default;
  //         }
  //         .grapheme-item:hover { background: #e8f0fe; border-color: var(--primary); color: var(--primary); }
  //     </style>
  // </head>
  // <body>
  //     <h1>Khmer Grapheme Inventory</h1>
  //   `
  //
  //   for (const len of sortedLengths) {
  //     const baseMap = lengthGroups.get(len)!
  //     const sortedBases = Array.from(baseMap.keys()).sort()
  //     const totalInLength = Array.from(baseMap.values()).reduce((acc, s) => acc + s.size, 0)
  //
  //     html += `
  //     <section class="length-section">
  //         <div class="length-header">
  //             ${len} Character Clusters
  //             <span class="badge">${totalInLength} items</span>
  //         </div>
  //         <div class="consonants-grid">
  //     `
  //
  //     for (const base of sortedBases) {
  //       const graphemes = Set_sortStringKeys(baseMap.get(base)!)
  //
  //       html += `
  //         <div class="base-card">
  //             <div class="base-label">
  //                 <span>BASE: ${base}</span>
  //                 <span style="opacity: 0.5">U+${base.charCodeAt(0).toString(16).toUpperCase()}</span>
  //             </div>
  //             <div class="grapheme-list">
  //       `
  //
  //       for (const g of graphemes) {
  //         html += `<div class="grapheme-item" title="Length: ${len}">${g}</div>`
  //       }
  //
  //       html += `
  //             </div>
  //         </div>`
  //     }
  //
  //     html += `</div></section>`
  //   }
  //
  //   html += `</body></html>`
  //
  //   fs.writeFileSync('grid.html', html)
  //   db.close()
  //   console.error(`✅ Generated grid.html with ${segmentsNormalized.size} unique graphemes.`)
}

main().catch(console.error)
