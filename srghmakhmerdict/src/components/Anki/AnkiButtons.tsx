import React from 'react'
import { Button, type ButtonProps } from '@heroui/button'
import { ModalFooter } from '@heroui/modal'
import { formatDistanceToNow } from 'date-fns'
import { Rating } from '@squeakyrobot/fsrs'
import type { ValidDate } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toValidDate'

// --- Types & Config ---

interface RatingConfig {
  rating: Rating
  label: string
  color: ButtonProps['color']
}

const RATINGS: RatingConfig[] = [
  { rating: Rating.Again, label: 'Again', color: 'danger' },
  { rating: Rating.Hard, label: 'Hard', color: 'warning' },
  { rating: Rating.Good, label: 'Good', color: 'success' },
  { rating: Rating.Easy, label: 'Easy', color: 'primary' },
]

// --- Sub-Component ---

interface AnkiRatingButtonProps extends RatingConfig {
  interval: ValidDate
  onRate: (rating: Rating) => void
}

const AnkiRatingButton = React.memo(({ rating, label, color, interval, onRate }: AnkiRatingButtonProps) => (
  <div className="flex flex-col gap-1">
    <Button color={color} variant="flat" onPress={() => onRate(rating)}>
      {label}
    </Button>
    <span className="text-[10px] text-center text-default-400 min-h-[1em]">
      {formatDistanceToNow(interval, { addSuffix: true })}
    </span>
  </div>
))

AnkiRatingButton.displayName = 'AnkiRatingButton'

// --- Main Component ---

interface AnkiButtonsProps {
  isRevealed: boolean
  isDisabled: boolean
  nextIntervals: Record<Rating, ValidDate>
  onReveal: () => void
  onRate: (rating: Rating) => void
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
              interval={nextIntervals?.[config.rating]}
              onRate={onRate}
            />
          ))}
        </div>
      </ModalFooter>
    )
  },
)

AnkiButtons.displayName = 'AnkiButtons'
