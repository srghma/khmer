import { getFavorites } from '../db/favorite'
import { getNotes, saveNote } from '../db/notes'
import { getUserDb } from '../db/core'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

/**
 * Escapes a string for CSV
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Parses a CSV line handling quotes properly
 */
function parseCsvLine(text: string): string[] {
  const result: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"' && text[i + 1] === '"') {
      cell += '"'
      i++ // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }
  result.push(cell)
  return result
}

export const exportAllUserStateToCSV = async (): Promise<string> => {
  const headers = [
    'type', // "favorite" | "history" | "note"
    'word',
    'language',
    'timestamp',
    'stability',
    'difficulty',
    'due',
    'last_review',
    'additional_html_front',
    'additional_html_back',
    'check_again',
    'note_text',
  ]

  const lines = [headers.join(',')]

  // 1. Favorites
  const favorites = await getFavorites()
  for (const f of favorites) {
    const row = [
      'favorite',
      f.word,
      f.language,
      f.timestamp,
      f.stability,
      f.difficulty,
      f.due,
      f.last_review ?? '',
      f.additional_html_front ?? '',
      f.additional_html_back ?? '',
      f.check_again ? '1' : '0',
      '', // no note_text
    ]
    lines.push(row.map(escapeCsvValue).join(','))
  }

  // 2. History
  const db = await getUserDb()
  const history = await db.select<{ word: string; language: string; timestamp: number }[]>(
    'SELECT word, language, timestamp FROM history ORDER BY timestamp DESC',
  )
  for (const h of history) {
    const row = ['history', h.word, h.language, h.timestamp, '', '', '', '', '', '', '', '']
    lines.push(row.map(escapeCsvValue).join(','))
  }

  // 3. Notes
  const notes = await getNotes()
  for (const n of notes) {
    const row = ['note', n.word, n.language, n.timestamp, '', '', '', '', '', '', '', n.note]
    lines.push(row.map(escapeCsvValue).join(','))
  }

  return lines.join('\n')
}

export const importAllUserStateFromCSV = async (csvContent: string): Promise<void> => {
  const lines = csvContent
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
  if (lines.length < 1) return // empty

  const headers = parseCsvLine(assertIsDefinedAndReturn(lines[0]))
  const typeIdx = headers.indexOf('type')
  const wordIdx = headers.indexOf('word')
  const langIdx = headers.indexOf('language')
  const timeIdx = headers.indexOf('timestamp')

  const stabIdx = headers.indexOf('stability')
  const diffIdx = headers.indexOf('difficulty')
  const dueIdx = headers.indexOf('due')
  const lrIdx = headers.indexOf('last_review')
  const frontIdx = headers.indexOf('additional_html_front')
  const backIdx = headers.indexOf('additional_html_back')
  const caIdx = headers.indexOf('check_again')

  const noteIdx = headers.indexOf('note_text')

  const db = await getUserDb()

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(assertIsDefinedAndReturn(lines[i]))
    const type = cols[typeIdx]
    const word = cols[wordIdx] as NonEmptyStringTrimmed
    const lang = cols[langIdx] as DictionaryLanguage
    const timestamp = parseInt(cols[timeIdx] || '0', 10)

    if (!word || !lang) continue

    if (type === 'favorite') {
      const stability = parseFloat(cols[stabIdx] || '0')
      const difficulty = parseFloat(cols[diffIdx] || '0')
      const due = parseInt(cols[dueIdx] || '0', 10)
      const last_review = cols[lrIdx] ? parseInt(cols[lrIdx], 10) : null
      const check_again = cols[caIdx] === '1'
      const front = cols[frontIdx] || null
      const back = cols[backIdx] || null

      await db.execute(
        `INSERT INTO favorites (word, language, timestamp, stability, difficulty, due, last_review, additional_html_front, additional_html_back, check_again)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT(word, language) DO UPDATE SET
         timestamp = excluded.timestamp,
         stability = excluded.stability,
         difficulty = excluded.difficulty,
         due = excluded.due,
         last_review = excluded.last_review,
         additional_html_front = excluded.additional_html_front,
         additional_html_back = excluded.additional_html_back,
         check_again = excluded.check_again`,
        [word, lang, timestamp, stability, difficulty, due, last_review, front, back, check_again ? 1 : 0],
      )
    } else if (type === 'history') {
      await db.execute(
        `INSERT INTO history (word, language, timestamp) VALUES ($1, $2, $3)
         ON CONFLICT(word, language) DO UPDATE SET timestamp = excluded.timestamp`,
        [word, lang, timestamp],
      )
    } else if (type === 'note') {
      const text = cols[noteIdx] || ''
      if (text) {
        await saveNote(word, lang, text)
      }
    }
  }
}
