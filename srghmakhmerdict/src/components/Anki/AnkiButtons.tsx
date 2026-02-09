import React from 'react'
import { Button, type ButtonProps } from '@heroui/button'
import { ModalFooter } from '@heroui/modal'
import { Grade } from 'femto-fsrs'
import type { NextIntervals } from './AnkiStateManager'
import type { NOfDays } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/n-of-days'
import { useRelativeInterval } from '../../hooks/useRelativeInterval'
import { useAnkiPulseStore } from './AnkiPulseContext'

// --- Types & Config ---

interface RatingConfig {
  rating: Grade
  label: string
  color: ButtonProps['color']
}

const RATINGS: RatingConfig[] = [
  { rating: Grade.AGAIN, label: 'Again', color: 'danger' },
  { rating: Grade.HARD, label: 'Hard', color: 'warning' },
  { rating: Grade.GOOD, label: 'Good', color: 'success' },
  { rating: Grade.EASY, label: 'Easy', color: 'primary' },
]

// --- Sub-Component ---

interface AnkiRatingButtonProps extends RatingConfig {
  intervalDays: NOfDays
  onRate: (rating: Grade) => void
}

const AnkiRatingButton = React.memo(({ rating, label, color, intervalDays, onRate }: AnkiRatingButtonProps) => {
  // 1. Get the shared store from context
  const pulseStore = useAnkiPulseStore()

  // 2. Use the generic hook
  const relativeTime = useRelativeInterval(pulseStore, intervalDays)

  return (
    <div className="flex flex-col gap-1">
      <Button color={color} variant="flat" onPress={() => onRate(rating as unknown as Grade)}>
        {label}
      </Button>
      <span className="text-[10px] text-center text-default-400 min-h-[1em]">{relativeTime}</span>
    </div>
  )
})

AnkiRatingButton.displayName = 'AnkiRatingButton'

// --- Main Component ---

interface AnkiButtonsProps {
  isRevealed: boolean
  isDisabled: boolean
  nextIntervals: NextIntervals
  onReveal: () => void
  onRate: (rating: Grade) => void
}

export const AnkiButtons = React.memo(
  ({ isRevealed, isDisabled, nextIntervals, onReveal, onRate }: AnkiButtonsProps) => {
    // Determine if we should show the "Show Answer" button or the rating grid
    if (!isRevealed) {
      return (
        <ModalFooter className="border-t border-divider bg-content2/30 p-4 justify-center">
          <Button className="font-bold px-12" color="primary" isDisabled={isDisabled} size="lg" onPress={onReveal}>
            Show Answer
          </Button>
        </ModalFooter>
      )
    }

    return (
      <ModalFooter className="border-t border-divider bg-content2/30 p-4 justify-center">
        <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
          {RATINGS.map(config => (
            <AnkiRatingButton
              key={config.rating}
              {...config}
              intervalDays={nextIntervals?.[config.rating]}
              onRate={onRate}
            />
          ))}
        </div>
      </ModalFooter>
    )
  },
)

AnkiButtons.displayName = 'AnkiButtons'
