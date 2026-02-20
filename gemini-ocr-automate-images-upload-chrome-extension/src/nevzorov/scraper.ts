// bun --env-file=/home/srghma/.dotfiles/secrets/nevzorov-telegram-scraper-app.env run src/nevzorov/scraper.ts
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
// @ts-ignore-next
import input from 'input'
import * as fs from 'fs'
import { CONFIG, getDB } from './common'

const db = getDB()

async function scrape() {
  console.log('🚀 Starting Scraper...')

  // 1. Initialize Client
  const stringSession = new StringSession(
    fs.existsSync(CONFIG.sessionPath) ? fs.readFileSync(CONFIG.sessionPath, 'utf-8') : '',
  )

  const client = new TelegramClient(stringSession, CONFIG.apiId, CONFIG.apiHash, {
    connectionRetries: 5,
    // useWSS: false, // Optional: Force TCP
  })

  await client.start({
    phoneNumber: async () => CONFIG.phoneNumber,
    password: async () => CONFIG.password,
    phoneCode: async () => await input.text('Code: '),
    onError: err => console.error(err),
  })

  // Save session
  fs.writeFileSync(CONFIG.sessionPath, client.session.save() as unknown as string)
  console.log('✅ Connected to Telegram.')

  // 2. Determine Start Position (Resume Capability)
  const lastPost = db.query('SELECT MAX(id) as last_id FROM posts').get() as { last_id: number | null }
  const startId = lastPost.last_id || 0

  console.log(`📊 Last saved Message ID: ${startId}. Resuming scrape from there...`)

  // 3. Prepare DB Statement
  const upsert = db.prepare(`
    INSERT INTO posts (id, date, grouped_id, message_text, has_media, media_type, raw_data)
    VALUES ($id, $date, $gid, $text, $media, $mtype, $raw)
    ON CONFLICT(id) DO NOTHING
  `)

  // 4. Scrape Loop
  // We use iterMessages with 'minId' to only get new stuff.
  // 'reverse: true' ensures we read chronological order (Creation -> Now).
  const iter = client.iterMessages(CONFIG.sourceChannel, {
    minId: startId,
    limit: undefined, // No limit, get everything available
    reverse: true, // Start from oldest available message after minId
    waitTime: 2, // Wait 2s between requests to be polite to server
  })

  let count = 0

  for await (const msg of iter) {
    if (!msg.id || msg.action) continue // Skip service messages

    // Detect Media Type
    let mediaType = 'none'
    if (msg.photo) mediaType = 'photo'
    else if (msg.video) mediaType = 'video'
    else if (msg.document) mediaType = 'document'
    else if (msg.webPreview) mediaType = 'web_page'

    // Serialize Raw Data (Custom serialization needed for BigInts usually, but GramJS objects are complex)
    // We try a safe stringify.
    const rawJson = JSON.stringify(msg, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))

    upsert.run({
      $id: msg.id,
      $date: msg.date,
      $gid: msg.groupedId ? msg.groupedId.toString() : null,
      $text: msg.text,
      $media: msg.media ? 1 : 0,
      $mtype: mediaType,
      $raw: rawJson,
    })

    count++
    if (count % 100 === 0) console.log(`📥 Scraped ${count} messages... (Current ID: ${msg.id})`)
  }

  console.log(`🎉 Scrape complete. Added ${count} new messages.`)
  await client.disconnect()
}

export async function workScraper(client: TelegramClient, db: ReturnType<typeof getDB>) {
  console.log('🚀 Scraper Started...')
  const lastPost = db.query('SELECT MAX(id) as last_id FROM posts').get() as { last_id: number | null }
  const startId = lastPost.last_id || 0

  const upsert = db.prepare(`
    INSERT INTO posts (id, date, grouped_id, message_text, has_media, media_type, raw_data)
    VALUES ($id, $date, $gid, $text, $media, $mtype, $raw) ON CONFLICT(id) DO NOTHING
  `)

  const iter = client.iterMessages(CONFIG.sourceChannel, { minId: startId, reverse: true })
  let count = 0
  for await (const msg of iter) {
    if (!msg.id || msg.action) continue
    const rawJson = JSON.stringify(msg, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
    upsert.run({
      $id: msg.id,
      $date: msg.date,
      $gid: msg.groupedId?.toString() || null,
      $text: msg.text || null,
      $media: msg.media ? 1 : 0,
      $mtype: msg.photo ? 'photo' : msg.video ? 'video' : 'document',
      $raw: rawJson,
    })
    count++
  }
  console.log(`🎉 Scraper: Added ${count} new messages.`)
}

if (import.meta.main) {
  const { StringSession } = await import('telegram/sessions')
  const session = new StringSession(fs.readFileSync(CONFIG.sessionPath, 'utf-8'))
  const client = new TelegramClient(session, CONFIG.apiId, CONFIG.apiHash, {})
  await client.start({
    phoneNumber: async () => CONFIG.phoneNumber,
    password: async () => CONFIG.password,
    phoneCode: async () => '',
    onError: console.error,
  })
  await workScraper(client, getDB())
  process.exit(0)
}
