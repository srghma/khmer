#!/usr/bin/env bun
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import * as fs from 'fs'
import { CONFIG, getDB, sleep } from './common'
// @ts-ignore-next
import input from 'input'
import { workScraper } from './scraper'
import { workPoster } from './poster'
import { workTranslator } from './translator'

async function main() {
  console.log('🏗️ Starting Orchestrator (Scraper + Translator + Poster)...')

  const db = getDB() // Single DB instance shared by all
  const stringSession = new StringSession(
    fs.existsSync(CONFIG.sessionPath) ? fs.readFileSync(CONFIG.sessionPath, 'utf-8') : '',
  )

  const client = new TelegramClient(stringSession, CONFIG.apiId, CONFIG.apiHash, {
    connectionRetries: 5,
  })

  await client.start({
    phoneNumber: async () => CONFIG.phoneNumber,
    password: async () => CONFIG.password,
    phoneCode: async () => await input.text('Code: '),
    onError: console.error,
  })

  while (true) {
    try {
      // 1. Scrape latest
      await workScraper(client, db)

      // 2. Translate everything (Run until done)
      const translatorPromise = workTranslator(db)

      // 3. Post everything
      const posterPromise = workPoster(client, db)

      await Promise.all([translatorPromise, posterPromise])

      console.log('😴 Cycle complete. Sleeping for 5 minutes...')
      await sleep(1000 * 60 * 5)
    } catch (e) {
      console.error('❌ Orchestrator Error:', e)
      await sleep(10000)
    }
  }
}

main().catch(e => {
  console.error('Fatal Error:', e)
  process.exit(1)
})
