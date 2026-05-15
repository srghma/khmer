import React from 'react'
import { Grade } from 'femto-fsrs'
import { cn } from '@heroui/theme'
import { useAnkiTable } from './AnkiTableContext'

export const ratingConfigs = [
  { rating: Grade.AGAIN, label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { rating: Grade.HARD, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600' },
  { rating: Grade.GOOD, label: 'Good', color: 'bg-green-500 hover:bg-green-600' },
  { rating: Grade.EASY, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600' },
]

import { type AnkiTableManager, type AnkiTableAudioPlayer } from './types'

interface Props {
  word: string
  sent?: string
  word_audio?: string
  sent_audio?: string
  isRevealed: boolean
  onReveal: (reveal: boolean) => void
  className?: string
  anki: AnkiTableManager
  audio: AnkiTableAudioPlayer
}

export const AnkiRatingButtons: React.FC<Props> = React.memo(
  ({ word, sent, word_audio, sent_audio, isRevealed, onReveal, className, anki, audio }) => {
    const { state: _state } = useAnkiTable()
    const preview = anki.getPreview(word)

    const handleRate = (e: React.MouseEvent, grade: Grade) => {
      e.stopPropagation()
      anki.rate(word, grade)
      onReveal(false)
    }

    const handleShowAnswer = (e: React.MouseEvent) => {
      e.stopPropagation()
      onReveal(true)

      const tracks = []

      if (word_audio) tracks.push({ text: word, audioUrl: word_audio })
      if (sent && sent_audio) tracks.push({ text: sent, audioUrl: sent_audio })

      audio.playMultipleTexts(tracks)
    }

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        <div className="flex flex-row md:flex-col gap-1 w-full">
          {!isRevealed ? (
            <>
              <button
                className={cn(
                  'flex-1 flex flex-col items-center justify-center rounded border border-transparent px-2 md:px-1 py-1.5 md:py-1 text-[10px] md:text-[8px] font-bold transition-all',
                  'bg-primary text-primary-foreground hover:scale-105 active:scale-95',
                )}
                onClick={handleShowAnswer}
              >
                SHOW ANSWER
              </button>
              <button
                className={cn(
                  'flex-1 flex flex-col items-center justify-center rounded border border-transparent px-2 md:px-1 py-1 md:py-0.5 text-[9px] md:text-[8px] font-bold transition-all',
                  'bg-zinc-100 text-zinc-900 hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100',
                )}
                onClick={e => handleRate(e, Grade.EASY)}
              >
                <span className="uppercase opacity-70">Easy</span>
                <span className="font-medium text-muted-foreground">{preview[Grade.EASY]}</span>
              </button>
            </>
          ) : (
            ratingConfigs.map(config => (
              <button
                key={config.rating}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center rounded border border-transparent px-1.5 md:px-1 py-1 md:py-0.5 text-[9px] md:text-[8px] font-bold transition-all',
                  'bg-zinc-100 text-zinc-900 hover:scale-105 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100',
                  'hover:border-zinc-400 dark:hover:border-zinc-500',
                )}
                onClick={e => handleRate(e, config.rating)}
              >
                <span className="uppercase opacity-70">{config.label}</span>
                <span className="font-medium text-muted-foreground">{preview[config.rating]}</span>
              </button>
            ))
          )}
        </div>
      </div>
    )
  },
)

AnkiRatingButtons.displayName = 'AnkiRatingButtons'
