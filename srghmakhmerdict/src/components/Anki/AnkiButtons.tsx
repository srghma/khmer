import React, { useMemo } from 'react'
import { Button, type ButtonProps } from '@heroui/button'
import { Grade } from 'femto-fsrs'
import type { FourButtons } from './utils'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import type { TranslationFunctions } from '../../i18n/i18n-types'

// --- Types & Config ---

interface RatingConfig {
  rating: Grade
  label: (LL: TranslationFunctions) => string // The button text (Again, Hard, etc.)
  color: ButtonProps['color']
}

const getRatings = (LL: TranslationFunctions): RatingConfig[] => [
  { rating: Grade.AGAIN, label: () => LL.ANKI.BUTTONS.AGAIN(), color: 'danger' },
  { rating: Grade.HARD, label: () => LL.ANKI.BUTTONS.HARD(), color: 'warning' },
  { rating: Grade.GOOD, label: () => LL.ANKI.BUTTONS.GOOD(), color: 'success' },
  { rating: Grade.EASY, label: () => LL.ANKI.BUTTONS.EASY(), color: 'primary' },
]

// --- Sub-Component ---

interface AnkiRatingButtonProps {
  rating: Grade
  label: string
  color: ButtonProps['color']
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

export const AnkiRevealButton = React.memo(({ disabled, onReveal }: AnkiRevealButtonProps) => {
  const { LL } = useI18nContext()

  return (
    <Button
      className="font-bold px-12 w-full md:w-auto"
      color="primary"
      isDisabled={disabled}
      size="lg"
      onPress={onReveal}
    >
      {LL.ANKI.BUTTONS.SHOW_ANSWER()}
    </Button>
  )
})
AnkiRevealButton.displayName = 'AnkiRevealButton'

// --- Export 2: The Rating Buttons (Back Side) ---

interface AnkiRatingButtonsProps {
  buttons: FourButtons
  onRate: (rating: Grade) => void
}

export const AnkiRatingButtons = React.memo(({ buttons, onRate }: AnkiRatingButtonsProps) => {
  const { LL } = useI18nContext()
  const ratings = useMemo(() => getRatings(LL), [LL])

  return (
    <div className="flex justify-center w-full">
      <div className="grid grid-cols-4 gap-2 md:gap-4 w-full max-w-3xl">
        {ratings.map(config => (
          <AnkiRatingButton
            key={config.rating}
            color={config.color}
            intervalLabel={buttons[config.rating].label}
            label={config.label(LL)}
            rating={config.rating}
            onRate={onRate}
          />
        ))}
      </div>
    </div>
  )
})
AnkiRatingButtons.displayName = 'AnkiRatingButtons'
