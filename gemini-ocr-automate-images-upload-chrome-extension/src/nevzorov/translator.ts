import { getDB, shouldTranslateText } from './common'
import { translateSrt } from '../utils/open-google-translate-cached'
import { openDB as openCacheDB } from '../utils/open-google-translate-cache'
import { Set_toNonEmptySet_orThrow } from '../utils/non-empty-set'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '../utils/non-empty-string-trimmed'
import { translateWithRetryForever } from '../utils/retry'
import { Database } from 'bun:sqlite'

function cleanUpDuplicates(db: Database) {
  console.log('🧹 Scanning for duplicate texts...')
  const duplicates = db
    .query(
      `
    SELECT id, grouped_id FROM posts
    WHERE message_text IS NOT NULL AND trim(message_text) != ''
    AND id NOT IN (
      SELECT MIN(id) FROM posts
      WHERE message_text IS NOT NULL AND trim(message_text) != ''
      GROUP BY message_text
    )
  `,
    )
    .all() as { id: number; grouped_id: string | null }[]

  if (duplicates.length > 0) {
    console.log(`🗑️ Found ${duplicates.length} duplicates. Deleting...`)
    const deleteById = db.prepare('DELETE FROM posts WHERE id = ?')
    const deleteByGroup = db.prepare('DELETE FROM posts WHERE grouped_id = ?')
    db.transaction(() => {
      for (const dup of duplicates) {
        deleteById.run(dup.id)
        if (dup.grouped_id) deleteByGroup.run(dup.grouped_id)
      }
    })()
  }
}

function getStats(db: Database) {
  const total = (
    db.query(`SELECT COUNT(*) as c FROM posts WHERE message_text IS NOT NULL AND length(message_text) > 0`).get() as any
  ).c as number

  const remaining = (
    db
      .query(
        `SELECT COUNT(*) as c FROM posts WHERE translated_text IS NULL AND message_text IS NOT NULL AND length(message_text) > 0`,
      )
      .get() as any
  ).c as number

  return { total, remaining, translated: total - remaining }
}

export async function workTranslator(database: Database) {
  console.log('--- Translator Started ---')
  cleanUpDuplicates(database)

  const initialStats = getStats(database)
  if (initialStats.remaining === 0) {
    console.log('✅ Nothing to translate.')
    return
  }

  let processedSession = 0
  let batchCount = 1

  while (true) {
    const posts = database
      .query(
        `
      SELECT id, message_text FROM posts
      WHERE translated_text IS NULL AND message_text IS NOT NULL AND length(message_text) > 0
      ORDER BY id ASC LIMIT 50
    `,
      )
      .all() as { id: number; message_text: string }[]

    if (posts.length === 0) break

    const firstPost = posts[0]!
    const lastPost = posts[posts.length - 1]!
    console.log(`\n📦 Batch #${batchCount}: Processing IDs ${firstPost.id} -> ${lastPost.id}`)

    const uniqueTexts = new Set<NonEmptyStringTrimmed>()
    const textMap = new Map<number, NonEmptyStringTrimmed>()
    const updates: { id: number; text: string }[] = []

    for (const p of posts) {
      if (shouldTranslateText(p.message_text)) {
        const clean = String_toNonEmptyString_orUndefined_afterTrim(p.message_text)
        if (clean) {
          uniqueTexts.add(clean)
          textMap.set(p.id, clean)
        }
      } else {
        updates.push({ id: p.id, text: p.message_text })
      }
    }

    if (updates.length > 0) {
      const updateStmt = database.prepare('UPDATE posts SET translated_text = ? WHERE id = ?')
      database.transaction(() => {
        for (const up of updates) updateStmt.run(up.text, up.id)
      })()
    }

    if (uniqueTexts.size > 0) {
      const cacheDb = openCacheDB()
      const translations = await translateWithRetryForever(() =>
        translateSrt(cacheDb, {
          strs: Set_toNonEmptySet_orThrow(uniqueTexts),
          languageFrom: 'ru' as any,
          languageTo: 'km' as any,
        }),
      )
      const updateStmt = database.prepare('UPDATE posts SET translated_text = ? WHERE id = ?')
      database.transaction(() => {
        for (const p of posts) {
          if (textMap.has(p.id)) {
            const original = textMap.get(p.id)
            const translated = original ? translations.get(original) || '' : ''
            updateStmt.run(String(translated), p.id)
          }
        }
      })()
    }

    processedSession += posts.length
    const currentTranslated = initialStats.translated + processedSession
    const percent = ((currentTranslated / initialStats.total) * 100).toFixed(2)
    console.log(`   ✅ Batch done. Progress: ${currentTranslated}/${initialStats.total} (${percent}%)`)

    batchCount++
  }

  console.log(`\n🏁 Finished! Total processed this session: ${processedSession}`)
}

if (import.meta.main) {
  const db = getDB()
  await workTranslator(db)
  process.exit(0)
}
