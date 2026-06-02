import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'

export interface NoteItem {
  readonly id: string // format: `${language}_${word}`
  readonly word: NonEmptyStringTrimmed
  readonly language: DictionaryLanguage
  readonly note: string
  readonly timestamp: number
}

const DB_NAME = 'NotesDB'
const STORE_NAME = 'notes'
const DB_VERSION = 1

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export const getNotes = async (): Promise<NoteItem[]> => {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result as NoteItem[])
    request.onerror = () => reject(request.error)
  })
}

export const saveNote = async (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  note: string,
): Promise<void> => {
  const db = await getDB()
  const timestamp = Date.now()
  const id = `${language}_${word}`

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put({ id, word, language, note, timestamp })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const deleteNote = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<void> => {
  const db = await getDB()
  const id = `${language}_${word}`

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
