import { getUserDb } from '../core'

export async function getAnkiExportData(): Promise<string> {
  const db = await getUserDb()
  // User asked for 1 word on each line, trimmed. Exporting just the word.
  // We can export words from all languages together, separated by newlines.
  const rows = await db.select<{ word: string }[]>('SELECT word FROM favorites ORDER BY timestamp DESC')

  return rows.map(r => r.word).join('\n')
}
