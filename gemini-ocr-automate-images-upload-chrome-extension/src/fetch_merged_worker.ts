#!/usr/bin/env bun
import { WiktionaryCache_create } from './utils/wiktionary-cache-db.js'
import { EnglishKhmerCache_create } from './utils/english-khmer-en-kh-cache-db.js'
import { EnglishKhmerKhEnCache_create } from './utils/english-khmer-kh-en-cache-db.js'
import chalk from 'chalk'

import { run_fetch_khmer_english_definitions } from './fetch_khmer_english_definitions.js'
import { run_fetch_english_khmer_definitions } from './fetch_english_khmer_definitions.js'
import { run_fetch_khmer_english_wiktionary } from './fetch_khmer_english_wiktionary.js'
import { run_fetch_khmer_russian_wiktionary } from './fetch_khmer_russian_wiktionary.js'

const main = async () => {
  console.log(chalk.bgBlue.bold(' 🚀 Starting MERGED WORKER (All Tasks) '))

  // 1. Initialize Caches (Shared Instances)
  // Note: For simplicity in the generic runners, we pass these as "target" (writable) or "source" (readonly).
  // Since they are the SAME object instance in memory, opening them all as { readonly: false } is safe/necessary
  // if ANY task needs to write to them.
  // SQLite handles concurrency fine with WAL.

  console.log(chalk.gray('📂 Initializing Shared Caches...'))

  const wiktionaryEn = await WiktionaryCache_create('en', { readonly: false })
  const wiktionaryRu = await WiktionaryCache_create('ru', { readonly: false })
  const enKm = await EnglishKhmerCache_create({ readonly: false })
  const ekKhEn = await EnglishKhmerKhEnCache_create({ readonly: false })

  console.log(chalk.gray('⚡ Launching tasks concurrently...'))

  // 2. Run all cycles in parallel
  // They will interleave their "await" periods (network requests/sleeps).
  // Since "getNewWordsToFetch" is synchronous/CPU-heavy, they will block each other during harvest,
  // effectively serializing the harvest phase but parallelizing the fetch phase.

  await Promise.all([
    run_fetch_khmer_english_definitions(ekKhEn, wiktionaryEn, enKm),
    run_fetch_english_khmer_definitions(enKm, wiktionaryEn, ekKhEn),
    run_fetch_khmer_english_wiktionary(wiktionaryEn, enKm, ekKhEn),
    run_fetch_khmer_russian_wiktionary(wiktionaryRu, enKm, ekKhEn),
  ])

  console.log(chalk.bgGreen.bold(' ✅ ALL TASKS COMPLETED '))
}

main().catch(e => {
  console.error(chalk.bgRed.white(' CRITICAL WORKER ERROR '), e)
  process.exit(1)
})
