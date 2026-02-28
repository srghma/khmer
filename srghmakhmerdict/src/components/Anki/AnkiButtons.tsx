import React, { useCallback, useMemo } from 'react'
import { Button, type ButtonProps } from '@heroui/button'
import { Grade } from 'femto-fsrs'
import type { FourButtons } from './utils'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { cn } from '@heroui/theme'
import type { TranslationFunctions } from '../../i18n/i18n-types'

// --- Types & Config ---

interface RatingConfig {
  rating: Grade
  label: (LL: TranslationFunctions) => string // The button text (Again, Hard, etc.)
  color: ButtonProps['color']
}

export const getRatings = (LL: TranslationFunctions): RatingConfig[] => [
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
  size?: ButtonProps['size']
  className?: string
}

const AnkiRatingButton = React.memo(function AnkiRatingButton({
  rating,
  label,
  color,
  intervalLabel,
  onRate,
  size,
  className,
}: AnkiRatingButtonProps) {
  const onPress = useCallback(() => {
    onRate(rating)
  }, [onRate, rating])

  return (
    <div className={cn('flex flex-col gap-0.5 sm:gap-1', className)}>
      <Button color={color} size={size} variant="flat" onPress={onPress}>
        {label}
      </Button>
      <span className={cn('text-center text-default-400 min-h-[1em] text-xs sm:text-xs')}>{intervalLabel}</span>
    </div>
  )
})

AnkiRatingButton.displayName = 'AnkiRatingButton'

// --- Main Component ---

interface AnkiRevealButtonProps {
  disabled?: boolean
  onReveal: () => void
}

export const AnkiRevealButton = React.memo(function AnkiRevealButton({ disabled, onReveal }: AnkiRevealButtonProps) {
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
  size?: ButtonProps['size']
  className?: string
  buttonClassName?: string
}

export const AnkiRatingButtons = React.memo(function AnkiRatingButtons({
  buttons,
  onRate,
  size,
  className,
  buttonClassName,
}: AnkiRatingButtonsProps) {
  const { LL } = useI18nContext()
  const ratings = useMemo(() => getRatings(LL), [LL])

  return (
    <div className={cn('flex justify-center w-full', className)}>
      <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full max-w-3xl">
        {ratings.map(config => (
          <AnkiRatingButton
            key={config.rating}
            className={buttonClassName}
            color={config.color}
            intervalLabel={buttons[config.rating].label}
            label={config.label(LL)}
            rating={config.rating}
            size={size}
            onRate={onRate}
          />
        ))}
      </div>
    </div>
  )
})
AnkiRatingButtons.displayName = 'AnkiRatingButtons'
