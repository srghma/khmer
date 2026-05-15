import { useState, useEffect, useCallback, useMemo } from 'react'
import { createDeck, Grade, type Card } from 'femto-fsrs'
import { type NoteStatus, type DueInfo } from './types'

const getOneDayInMs = 24 * 60 * 60 * 1000
const INTERVAL_MS_AGAIN = 1 * 60 * 1000 // 1 min
const INTERVAL_MS_HARD = 5 * 60 * 1000 // 5 mins
const INTERVAL_MS_GOOD_NEW = 10 * 60 * 1000 // 10 mins

const deck = createDeck()

function calculateNextStep(
  item: Pick<NoteStatus, 'stability' | 'difficulty' | 'last_review'>,
  grade: Grade,
  now: number,
) {
  const daysSinceReview = () => {
    if (!item.last_review) throw new Error('item.last_review')

    return (now - item.last_review) / getOneDayInMs
  }

  const isNew = item.last_review === null
  const nextCard: Card = isNew
    ? deck.newCard(grade)
    : deck.gradeCard({ D: item.difficulty, S: item.stability }, daysSinceReview(), grade)

  const intervalMs = (() => {
    if (grade === Grade.AGAIN) return INTERVAL_MS_AGAIN
    if (grade === Grade.HARD) return INTERVAL_MS_HARD
    if (isNew && grade === Grade.GOOD) return INTERVAL_MS_GOOD_NEW
    const multiplier = (() => {
      return grade === Grade.GOOD ? 0.01 : 0.1
    })()

    return nextCard.I * multiplier * getOneDayInMs
  })()

  return {
    nextCard,
    intervalMs,
  }
}

export function formatInterval(milliseconds: number): string {
  const seconds = milliseconds / 1000

  if (seconds < 60) return `${seconds.toFixed(0)}s`

  const minutes = seconds / 60

  if (minutes < 60) return `${minutes.toFixed(1)}m`.replace('.0', '')

  const hours = minutes / 60

  if (hours < 24) return `${hours.toFixed(1)}h`.replace('.0', '')

  const days = hours / 24

  if (days < 30) return `${days.toFixed(2)}d`.replace('.00', '').replace(/(\.\d)0$/, '$1')

  const months = days / 30

  return `${months.toFixed(2)}mo`.replace('.00', '').replace(/(\.\d)0$/, '$1')
}

const DB_NAME = 'AnkiExplorer'
const STORE_NAME = 'noteStatus'
const DB_VERSION = 1

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'word' })
      }
    }
  })
}

export function useAnkiTableManager() {
  const [statuses, setStatuses] = useState<Map<string, NoteStatus>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const db = await getDB()
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          const results = request.result as NoteStatus[]
          const map = new Map<string, NoteStatus>()

          results.forEach(r => map.set(r.word, r))
          setStatuses(map)
          setIsLoaded(true)
        }
      } catch (e) {
        console.error('Failed to init IndexedDB', e)
        setIsLoaded(true)
      }
    }
    init()
  }, [])

  const getStatus = useCallback((word: string) => statuses.get(word), [statuses])

  const rate = useCallback(
    async (word: string, grade: Grade) => {
      const now = Date.now()
      const current = statuses.get(word) || {
        word,
        stability: 0,
        difficulty: 0,
        last_review: null,
        due: 0,
        reps: 0,
        lapses: 0,
      }

      const { nextCard, intervalMs } = calculateNextStep(current, grade, now)

      const updated: NoteStatus = {
        word,
        stability: nextCard.S,
        difficulty: nextCard.D,
        last_review: now,
        due: now + intervalMs,
        reps: current.reps + 1,
        lapses: grade === Grade.AGAIN ? current.lapses + 1 : current.lapses,
      }

      setStatuses(prev => {
        const next = new Map(prev)

        next.set(word, updated)

        return next
      })

      const db = await getDB()
      const transaction = db.transaction(STORE_NAME, 'readwrite')

      transaction.objectStore(STORE_NAME).put(updated)
    },
    [statuses],
  )

  const getDueInfo = useCallback(
    (word: string, now: number): DueInfo => {
      const status = getStatus(word)

      if (!status) {
        return { label: 'New', color: 'text-blue-500', isNew: true, isDue: false }
      }

      const isDue = status.due <= now
      const diff = status.due - now
      const isToday = status.last_review && new Date(status.last_review).toDateString() === new Date(now).toDateString()

      return {
        label: formatInterval(Math.abs(diff)),
        isDue,
        isNew: false,
        isToday: !!isToday,
        diff,
        color: isDue
          ? 'text-red-500'
          : diff <= 2 * 60000
            ? 'text-orange-500'
            : diff <= 5 * 60000
              ? 'text-purple-500'
              : 'text-zinc-500',
      }
    },
    [getStatus],
  )

  const getPreview = useCallback(
    (word: string) => {
      const now = Date.now()
      const current = getStatus(word) || {
        word,
        stability: 0,
        difficulty: 0,
        last_review: null,
        due: 0,
        reps: 0,
        lapses: 0,
      }

      return {
        [Grade.AGAIN]: formatInterval(calculateNextStep(current, Grade.AGAIN, now).intervalMs),
        [Grade.HARD]: formatInterval(calculateNextStep(current, Grade.HARD, now).intervalMs),
        [Grade.GOOD]: formatInterval(calculateNextStep(current, Grade.GOOD, now).intervalMs),
        [Grade.EASY]: formatInterval(calculateNextStep(current, Grade.EASY, now).intervalMs),
      }
    },
    [getStatus],
  )

  return useMemo(
    () => ({
      statuses,
      isLoaded,
      getStatus,
      rate,
      getDueInfo,
      getPreview,
    }),
    [statuses, isLoaded, getStatus, rate, getDueInfo, getPreview],
  )
}
