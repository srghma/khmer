import { Database } from 'bun:sqlite'
import {
  parseDictionaryFile,
  markdownToHtml,
  ParsedPage,
} from '/home/srghma/projects/khmer/dicts/src/mk_continues_pages.ts'
import {
  strToRussianWordDictionaryIndexOrUndefined,
  TypedRussianWordDictionaryIndexElement,
} from '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/utils/russian-word-dictionary-index'
import { NonEmptyArray } from './src/utils/non-empty-array'

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const RU_KM_DICT_PATH = '/home/srghma/projects/khmer/Краткий русско-кхмерский словарь--content.txt'

const sanitizeForStrictSql = (s: string): string => {
  if (typeof s !== 'string') throw new Error(`no string ${s}`)
  return s
    .trim()
    .replace(/\t/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/ {2,}/g, ' ')
}

function prepareHtml(c: TypedRussianWordDictionaryIndexElement): string {
  const html = markdownToHtml(c)
  return sanitizeForStrictSql(html.replace(/<br>/g, '___BR___')).replace(/___BR___/g, '<br>')
}

async function main() {
  const db = new Database(DB_PATH)

  console.log('🛠️  Creating ru_km_tbl_Dict with strict constraints...')
  db.run(`
    CREATE TABLE IF NOT EXISTS "ru_km_tbl_Dict" (
      "Word" TEXT NOT NULL PRIMARY KEY CHECK("Word" != '' AND "Word" = TRIM("Word") AND "Word" NOT LIKE '%  %' AND "Word" NOT LIKE '%' || CHAR(9) || '%' AND "Word" NOT LIKE '%' || CHAR(10) || '%'),
      "WordDisplay" TEXT CHECK("WordDisplay" != '' AND "WordDisplay" != "Word" AND "WordDisplay" = TRIM("WordDisplay") AND "WordDisplay" NOT LIKE '%  %' AND "WordDisplay" NOT LIKE '%' || CHAR(9) || '%' AND "WordDisplay" NOT LIKE '%' || CHAR(10) || '%'),
      "Desc" TEXT NOT NULL CHECK("Desc" != '' AND "Desc" = TRIM("Desc") AND "Desc" NOT LIKE '%  %' AND "Desc" NOT LIKE '%' || CHAR(9) || '%' AND "Desc" NOT LIKE '%' || CHAR(10) || '%')
    );
  `)

  const pages: NonEmptyArray<ParsedPage<TypedRussianWordDictionaryIndexElement>> =
    parseDictionaryFile<TypedRussianWordDictionaryIndexElement>(
      RU_KM_DICT_PATH,
      strToRussianWordDictionaryIndexOrUndefined,
    )

  const stmt = db.prepare(
    `INSERT INTO ru_km_tbl_Dict (Word, WordDisplay, Desc) VALUES ($word, $disp, $desc) ON CONFLICT(Word) DO UPDATE SET WordDisplay = $disp, Desc = $desc`,
  )

  let processedCount = 0
  let affectedCount = 0

  console.log(`Importing ${pages.map(x => x[1].length).reduce((x: number, y: number) => x + y, 0)} RU->KM entries.`)

  const wordMap = {
    'ВЛКСМВсесоюзный Ленинский Коммунистический Союз Молодёжи': 'Всесоюзный Ленинский Коммунистический Союз Молодёжи',
    'КПССКоммунистическая партия Советского Союза': 'Коммунистическая партия Советского Союза',
  }

  db.transaction(() => {
    for (const [_page, content] of pages) {
      for (const entry of content) {
        const wordsArray = [...entry.index]
        const normalizedIndex = wordsArray.join(', ') // "word1, word2"

        // If raw is different from parsed, keep raw as display. Otherwise NULL.
        let $disp: string | null = entry.indexRaw === normalizedIndex ? null : entry.indexRaw

        // If specific word logic applies (like removing stress or pipes), ensure it matches your requirements
        // The sanitize function might remove necessary chars? No, it only removes tabs/newlines/double-spaces.
        if ($disp) {
          $disp = sanitizeForStrictSql($disp)
          // Double check if sanitization made it identical to Word
          if ($disp === normalizedIndex) $disp = null
        }

        for (const word of wordsArray) {
          // If we have multiple words in index (aliases), we might want to store them separately
          // But here we attach the SAME display to all aliases?
          // E.g. "foo|bar" -> words "foo", "foobar".
          // If word is "foo", display "foo|bar" might be confusing.
          // Assuming 1-to-1 or simple mapping for now.

          let $word = sanitizeForStrictSql(word)
          if (wordMap.hasOwnProperty($word)) $word = wordMap[word]

          const info = stmt.run({
            $word,
            $disp,
            $desc: prepareHtml(entry.content),
          })

          processedCount++
          affectedCount += info.changes
        }
      }
    }
  })()
  console.log(`✅ Done. Imported ${processedCount} RU->KM entries.`)
  db.close()
}

main().catch(console.error)
