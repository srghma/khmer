import { Database } from 'bun:sqlite'
import { parseHTML } from 'linkedom'

// --- Configuration ---

const CONFIG = {
  DB_PATH: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',
  /**
   * If true, sets Wiktionary_ipa to NULL for all rows before starting.
   */
  CLEAN_COLUMNS_BEFORE_START: false,
}

/**
 * Regex logic:
 * Matches strings starting with / or [ and ending with / or ]
 * Supports variants separated by ~ (e.g., /pɛː.ˈmiː/ ~ /pĕəʔ.ˈmiː/)
 */
const IPA_VALIDATE_REGEX = /^([\/\[].+[\/\]])(\s*~\s*[\/\[].+[\/\]])*$/

function extractIpaFromHtml(html: string): string | undefined {
  if (!html || html.trim() === '') return undefined

  try {
    const { document } = parseHTML(html)

    // Wiktionary uses .IPA for phonetics, but also for WT-romanization.
    // We select all .IPA spans and then filter for actual IPA notation.
    const ipaElements = document.querySelectorAll('.IPA')

    const validIpas = Array.from(ipaElements)
      .map(el => el.textContent?.trim() || '')
      .filter(text => IPA_VALIDATE_REGEX.test(text))

    if (validIpas.length === 0) return undefined

    // Deduplicate (sometimes the same IPA appears in multiple sections)
    const uniqueIpas = [...new Set(validIpas)]

    // Join multiple results if they exist (though usually it's just one unique string)
    return uniqueIpas.join(', ')
  } catch (e) {
    console.error('   ❌ Error parsing HTML')
    return undefined
  }
}

// --- Main Migration Logic ---

async function main() {
  const db = new Database(CONFIG.DB_PATH)

  console.log('🔍 Checking database schema...')

  const info = db.query('PRAGMA table_info(km_Dict)').all() as { name: string }[]
  const hasIpaColumn = info.some(c => c.name === 'Wiktionary_ipa')

  if (!hasIpaColumn) {
    console.log('➕ Adding column "Wiktionary_ipa"...')
    db.run('ALTER TABLE km_Dict ADD COLUMN Wiktionary_ipa TEXT')
  }

  if (CONFIG.CLEAN_COLUMNS_BEFORE_START) {
    console.log('🧹 Cleaning existing IPA data...')
    db.run('UPDATE km_Dict SET Wiktionary_ipa = NULL')
  }

  console.log('📖 Fetching rows from km_Dict with Wiktionary content...')
  const rows = db.query('SELECT Word, Wiktionary FROM km_Dict WHERE Wiktionary IS NOT NULL').all() as {
    Word: string
    Wiktionary: string
  }[]

  console.log(`   Found ${rows.length} rows to process`)

  const updateStmt = db.prepare('UPDATE km_Dict SET Wiktionary_ipa = $ipa WHERE Word = $word')

  console.log('🚀 Starting IPA extraction...')
  let processedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  const startTime = Date.now()

  db.transaction(() => {
    for (const { Word: word, Wiktionary: html } of rows) {
      processedCount++

      const ipa = extractIpaFromHtml(html)

      if (ipa) {
        const result = updateStmt.run({
          $word: word,
          $ipa: ipa,
        })
        updatedCount += result.changes
      } else {
        skippedCount++
      }

      if (processedCount % 500 === 0) {
        console.log(`   Progress: ${processedCount}/${rows.length} rows processed...`)
      }
    }
  })()

  const endTime = Date.now()
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)

  console.log('\n✨ Migration completed!')
  console.log(`   Total rows checked:      ${processedCount}`)
  console.log(`   IPA values extracted:    ${updatedCount}`)
  console.log(`   Rows with no IPA found:  ${skippedCount}`)
  console.log(`   Duration:                ${durationSeconds}s`)

  console.log('\n🧹 Optimizing database...')
  db.run('VACUUM;')

  db.close()
  console.log('✅ Done!')
}

main().catch(console.error)
