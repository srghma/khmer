import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Grade } from 'femto-fsrs'

export interface Note {
  word: NonEmptyStringTrimmed
  word_audio?: NonEmptyStringTrimmed
  wordrom: NonEmptyStringTrimmed
  worden: NonEmptyStringTrimmed
  sent: NonEmptyStringTrimmed
  sent_audio?: NonEmptyStringTrimmed
  sentrom: NonEmptyStringTrimmed
  senten: NonEmptyStringTrimmed
  pos?: NonEmptyStringTrimmed
  ety?: NonEmptyStringTrimmed
  pronunciation?: NonEmptyStringTrimmed
  senses?: NonEmptyStringTrimmed
  derivedTerms?: NonEmptyStringTrimmed
}

export interface NoteWithMetadata extends Note {
  id: number
}

export interface NoteStatus {
  word: string
  stability: number
  difficulty: number
  last_review: number | null
  due: number
  reps: number
  lapses: number
}

export type SortMode = 'index' | 'due'

export interface AnkiTableState {
  hideFront: boolean
  hideBack: boolean
  hideInfo: boolean
  sortMode: SortMode
  showDue: boolean
  showNew: boolean
  showNotDue: boolean
  disabledPosDue: string[]
  disabledPosNew: string[]
  disabledPosWait: string[]
  audioModeOpus: boolean
  audioModeGoogle: boolean
  audioModeNative: boolean
  showShortDefinitionOnSelect: boolean
}

export interface DueInfo {
  label: string
  isDue: boolean
  isNew: boolean
  isToday?: boolean
  diff?: number
  color: string
}

export interface AnkiTableManager {
  statuses: Map<string, NoteStatus>
  isLoaded: boolean
  getStatus: (word: string) => NoteStatus | undefined
  rate: (word: string, grade: Grade) => Promise<void>
  getDueInfo: (word: string, now: number) => DueInfo
  getPreview: (word: string) => Record<Grade, string>
}

export type AudioTrack = {
  url: string
  text: string
}

export interface AnkiTableAudioPlayer {
  queue: AudioTrack[]
  currentIndex: number
  setCurrentIndex: (index: number) => void
  playTrackAtIndex: (index: number) => void
  isPlaying: boolean
  isRepeatQueue: boolean
  setIsRepeatQueue: (repeat: boolean) => void
  currentTrack: AudioTrack | null
  addToQueue: (track: AudioTrack) => void
  removeFromQueue: (track: AudioTrack) => void
  isInQueue: (track: AudioTrack) => boolean
  play: () => void
  pause: () => void
  stop: () => void
  next: () => void
  prev: () => void
  clearQueue: () => void
  playOnce: (url: string) => Promise<void>
  playText: (params: { text: string; audioUrl: string }) => void
  playMultipleTexts: (items: { text: string; audioUrl: string }[]) => void
}
