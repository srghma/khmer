import React from 'react'
import { Button, type ButtonProps } from '@heroui/button'
import { Grade } from 'femto-fsrs'
import type { FourButtons } from './utils'

// --- Types & Config ---

interface RatingConfig {
  rating: Grade
  label: string // The button text (Again, Hard, etc.) - actually we might want to override this or use from config
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
  intervalLabel: string
  onRate: (rating: Grade) => void
}

const AnkiRatingButton = React.memo(({ rating, label, color, intervalLabel, onRate }: AnkiRatingButtonProps) => {
  return (
    <div className="flex flex-col gap-1">
      <Button color={color} variant="flat" onPress={() => onRate(rating)}>
        {label}
      </Button>
      <span className="text-[10px] text-center text-default-400 min-h-[1em]">{intervalLabel}</span>
    </div>
  )
})

AnkiRatingButton.displayName = 'AnkiRatingButton'

// --- Main Component ---

interface AnkiRevealButtonProps {
  disabled?: boolean
  onReveal: () => void
}

export const AnkiRevealButton = React.memo(({ disabled, onReveal }: AnkiRevealButtonProps) => (
  <div className="p-4 flex justify-center">
    <Button className="font-bold px-12" color="primary" isDisabled={disabled} size="lg" onPress={onReveal}>
      Show Answer
    </Button>
  </div>
))
AnkiRevealButton.displayName = 'AnkiRevealButton'

// --- Export 2: The Rating Buttons (Back Side) ---

interface AnkiRatingButtonsProps {
  buttons: FourButtons
  onRate: (rating: Grade) => void
}

export const AnkiRatingButtons = React.memo(({ buttons, onRate }: AnkiRatingButtonsProps) => (
  <div className="p-4 flex justify-center">
    <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
      {RATINGS.map(config => (
        <AnkiRatingButton
          key={config.rating}
          {...config}
          intervalLabel={buttons[config.rating].label}
          onRate={onRate}
        />
      ))}
    </div>
  </div>
))
AnkiRatingButtons.displayName = 'AnkiRatingButtons'
