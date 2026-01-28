import * as path from 'path'
import * as fs from 'fs'

import { Database } from 'bun:sqlite'

export const ensureDbGeneral = (readonly: boolean, dbPath: string, initMigration: string): Database => {
  // if (readonly) {
  //   // Copy to temp location for isolated reading
  //   const tempPath = `${dbPath}.${process.pid}.readonly.tmp`
  //
  //   // Copy main database
  //   fs.copyFileSync(dbPath, tempPath)
  //
  //   // Copy WAL if it exists
  //   const tempWalPath = `${dbPath}-wal`
  //   if (fs.existsSync(tempWalPath)) fs.copyFileSync(tempWalPath, `${tempPath}-wal`)
  //
  //   // Copy SHM if it exists
  //   const tempShmPath = `${dbPath}-shm`
  //   if (fs.existsSync(tempShmPath)) fs.copyFileSync(tempShmPath, `${tempPath}-shm`)
  //
  //   console.log(`made copy of db ${dbPath} to ${tempPath}`)
  //
  //   const db = new Database(tempPath, { readonly: true })
  //   // For readonly connections, ensure proper isolation
  //   db.run('PRAGMA query_only = ON;') // Enforce read-only
  //   db.run('PRAGMA journal_mode = WAL;') // Must enable WAL to read WAL databases
  //   db.run('PRAGMA synchronous = NORMAL;') // Reduce lock contention
  //
  //   let cleanup_running = false
  //   const cleanup = () => {
  //     if (cleanup_running) return
  //     cleanup_running = true
  //     console.log(`deleting copy of db ${dbPath} at ${tempPath}`)
  //     try {
  //       db.close() // Close database first
  //       if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
  //       if (fs.existsSync(tempWalPath)) fs.unlinkSync(tempWalPath)
  //       if (fs.existsSync(tempShmPath)) fs.unlinkSync(tempShmPath)
  //     } catch (e: any) {
  //       console.log('cleanup error', e.message)
  //     }
  //   }
  //
  //   // Register cleanup for all exit scenarios
  //   process.on('exit', cleanup)
  //   process.on('SIGINT', () => {
  //     console.log('\n\n🛑 Received SIGINT (Ctrl+C), cleaning up...')
  //     cleanup()
  //     process.exit(130)
  //   })
  //   process.on('SIGTERM', () => {
  //     console.log('\n\n🛑 Received SIGTERM, cleaning up...')
  //     cleanup()
  //     process.exit(143)
  //   })
  //   process.on('uncaughtException', err => {
  //     console.error('Uncaught exception:', err)
  //     cleanup()
  //     process.exit(1)
  //   })
  //
  //   return db
  // }

  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const db = new Database(dbPath, readonly ? { readonly } : { create: true })

  if (!readonly) {
    db.run('PRAGMA journal_mode = WAL;')
    db.run(initMigration)
  } else {
    // For readonly connections, ensure proper isolation
    db.run('PRAGMA query_only = ON;') // Enforce read-only
    db.run('PRAGMA journal_mode = WAL;') // Must enable WAL to read WAL databases
    db.run('PRAGMA synchronous = NORMAL;') // Reduce lock contention

    // Optional: Use a transaction to get a consistent snapshot
    // db.run('BEGIN TRANSACTION;')
  }

  return db
}
