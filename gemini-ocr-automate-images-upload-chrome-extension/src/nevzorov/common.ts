import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import * as path from 'path'

export const CONFIG = {
  apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
  apiHash: process.env.TELEGRAM_API_HASH || '',
  phoneNumber: process.env.TELEGRAM_PHONE || '',
  password: process.env.TELEGRAM_PASSWORD || '',
  sourceChannel: 'nevzorovtv',
  targetChannel: process.env.TARGET_CHANNEL || 'nevzorov_khmer',
  dbPath: `${process.env.HOME}/.cache/nevzorov.sqlite`,
  sessionPath: `${process.env.HOME}/.cache/nevzorov_session`,
  useTempDb: process.env.USE_TEMP_DB === 'true',
}

export const getDB = (customPath?: string): Database => {
  const targetPath = customPath || CONFIG.dbPath
  const dir = path.dirname(targetPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const db = new Database(targetPath, { create: true })
  db.run('PRAGMA journal_mode = WAL;')

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,        -- Telegram Message ID
      date INTEGER,                  -- Timestamp
      grouped_id TEXT,               -- For Albums (multiple images/videos in one post)
      message_text TEXT,             -- The text content
      has_media INTEGER,             -- Boolean 1/0
      media_type TEXT,               -- 'photo', 'video', 'document', 'web_page'

      raw_data TEXT,                 -- SAVE ALL DATA: Full JSON of the message object

      translated_text TEXT,          -- Translation result
      is_posted INTEGER DEFAULT 0    -- 0: No, 1: Yes, -1: Skipped/Error
    );
  `)
  return db
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const shouldTranslateText = (text: string | null | undefined): boolean => {
  if (!text) return false
  const t = text.trim()
  if (t.length === 0) return false
  const hasLetters = /\p{L}/u.test(t)
  if (!hasLetters) return false
  const tokens = t.split(/\s+/)
  const isAllUrls = tokens.every(
    token =>
      token.startsWith('http://') ||
      token.startsWith('https://') ||
      token.startsWith('t.me/') ||
      token.startsWith('www.'),
  )
  return !isAllUrls
}
