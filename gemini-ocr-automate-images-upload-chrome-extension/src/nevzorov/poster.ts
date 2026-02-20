import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'
import * as fs from 'fs'
import { CONFIG, getDB, sleep } from './common'
import {
  type NonEmptyStringTrimmed,
  String_toNonEmptyString_orUndefined_afterTrim,
} from '../utils/non-empty-string-trimmed'
import { Database } from 'bun:sqlite'
import { extractSendableMedia } from './telegram-media'
import { assertIsDefinedAndReturn } from '../utils/asserts'

interface PostRow {
  id: number
  grouped_id: string | null
  message_text: string | null
  has_media: number
  media_type: string
  translated_text: string | null
  is_posted: number
}

const TEST_MODE = process.env.TEST_MODE === 'true'

const getPostStats = (db: Database) => {
  const query = (sql: string) => (db.query(sql).get() as any).c as number
  const total = query(`SELECT COUNT(*) as c FROM posts WHERE message_text IS NOT NULL AND length(message_text) > 0`)
  const posted = query(`SELECT COUNT(*) as c FROM posts WHERE is_posted = 1`)
  return { total, posted }
}

export async function workPoster(client: TelegramClient, db: Database) {
  console.log('📤 Poster Started...')
  const processedGroupIds = new Set<NonEmptyStringTrimmed>()
  const initialStats = getPostStats(db)
  let sessionPosted = 0

  while (true) {
    // We process in small batches but preserve ID order
    const candidates = db.query(`SELECT * FROM posts WHERE is_posted = 0 ORDER BY id ASC LIMIT 20`).all() as PostRow[]
    if (candidates.length === 0) break

    for (const candidate of candidates) {
      const gid = String_toNonEmptyString_orUndefined_afterTrim(candidate.grouped_id || '')
      if (gid && processedGroupIds.has(gid)) continue

      const relatedPosts = gid
        ? (db.query(`SELECT * FROM posts WHERE grouped_id = ? ORDER BY id ASC`).all(gid) as PostRow[])
        : [candidate]

      // 1. Check for translations
      if (relatedPosts.some(p => p.message_text?.trim() && !p.translated_text)) {
        console.log(`⏳ ID ${candidate.id} missing translation. Stopping poster to preserve order.`)
        return // Exit function, orchestrator will try translator again
      }

      if (gid) processedGroupIds.add(gid)

      // 2. Prepare media
      const sourceMsgs = await client.getMessages(CONFIG.sourceChannel, { ids: relatedPosts.map(p => p.id) })
      const validMsgs = sourceMsgs.filter((m): m is Api.Message => m instanceof Api.Message)

      // Use the utility
      const mediaList = extractSendableMedia(validMsgs)

      const captionPart = relatedPosts.find(p => p.translated_text)?.translated_text || ''
      const finalCaption = (captionPart + `\n\n🔗 ប្រភពដើម: t.me/${CONFIG.sourceChannel}/${candidate.id}`)
        .trim()
        .substring(0, 1024)

      if (mediaList.length > 0) {
        await client.sendFile(CONFIG.targetChannel, {
          file: mediaList.length === 1 ? assertIsDefinedAndReturn(mediaList[0]) : mediaList,
          caption: finalCaption,
          parseMode: 'html',
        })
      } else {
        // Fallback for text-only or posts that only had link previews (like YouTube)
        await client.sendMessage(CONFIG.targetChannel, {
          message: finalCaption,
          parseMode: 'html',
          linkPreview: true,
        })
      }

      // 4. Only if posting succeeded, mark as posted
      db.transaction(() => {
        for (const p of relatedPosts) db.run(`UPDATE posts SET is_posted = 1 WHERE id = ?`, [p.id])
      })()

      sessionPosted++
      console.log(`✅ Posted ${candidate.id}. Progress: ${initialStats.posted + sessionPosted}/${initialStats.total}`)

      if (TEST_MODE) process.exit(0)
      await sleep(5000)
    }
  }
}

if (import.meta.main) {
  const originalPath = CONFIG.dbPath
  const tempPath = `/tmp/nevzorov_${Date.now()}.sqlite`
  if (CONFIG.useTempDb) fs.copyFileSync(originalPath, tempPath)

  const db = getDB(CONFIG.useTempDb ? tempPath : originalPath)
  const session = new StringSession(
    fs.existsSync(CONFIG.sessionPath) ? fs.readFileSync(CONFIG.sessionPath, 'utf-8') : '',
  )
  const client = new TelegramClient(session, CONFIG.apiId, CONFIG.apiHash, { connectionRetries: 5 })

  await client.start({
    phoneNumber: async () => CONFIG.phoneNumber,
    password: async () => CONFIG.password,
    phoneCode: async () => '',
    onError: console.error,
  })

  await workPoster(client, db)

  if (CONFIG.useTempDb) {
    const mainDb = getDB(originalPath)
    const posted = db.query('SELECT id FROM posts WHERE is_posted = 1').all() as { id: number }[]
    mainDb.transaction(() => {
      for (const row of posted) mainDb.run('UPDATE posts SET is_posted = 1 WHERE id = ?', [row.id])
    })()
    fs.unlinkSync(tempPath)
  }
  process.exit(0)
}
