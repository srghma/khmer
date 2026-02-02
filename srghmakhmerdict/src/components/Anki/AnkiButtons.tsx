import React from 'react'
import { Button } from '@heroui/button'
import { ModalFooter } from '@heroui/modal'
import { formatDistanceToNow } from 'date-fns'

// --- FSRS Imports ---
import { Rating } from '@squeakyrobot/fsrs'

// --- Types & Interfaces ---

const formatInterval = (date: Date) => formatDistanceToNow(date, { addSuffix: true })

export const AnkiButtons = React.memo(
  ({
    isRevealed,
    isDisabled,
    nextIntervals,
    onReveal,
    onRate,
  }: {
    isRevealed: boolean
    isDisabled: boolean
    nextIntervals: Record<Rating, Date> | undefined
    onReveal: () => void
    onRate: (rating: Rating) => void
  }) => {
    return (
      <ModalFooter className="border-t border-divider bg-content2/30 p-4 justify-center">
        {!isRevealed ? (
          <Button className="font-bold px-12" color="primary" isDisabled={isDisabled} size="lg" onPress={onReveal}>
            Show Answer
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
            <div className="flex flex-col gap-1">
              <Button color="danger" variant="flat" onPress={() => onRate(Rating.Again)}>
                Again
              </Button>
              <span className="text-[10px] text-center text-default-400">
                {nextIntervals && formatInterval(nextIntervals[Rating.Again])}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Button color="warning" variant="flat" onPress={() => onRate(Rating.Hard)}>
                Hard
              </Button>
              <span className="text-[10px] text-center text-default-400">
                {nextIntervals && formatInterval(nextIntervals[Rating.Hard])}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Button color="success" variant="flat" onPress={() => onRate(Rating.Good)}>
                Good
              </Button>
              <span className="text-[10px] text-center text-default-400">
                {nextIntervals && formatInterval(nextIntervals[Rating.Good])}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Button color="primary" variant="flat" onPress={() => onRate(Rating.Easy)}>
                Easy
              </Button>
              <span className="text-[10px] text-center text-default-400">
                {nextIntervals && formatInterval(nextIntervals[Rating.Easy])}
              </span>
            </div>
          </div>
        )}
      </ModalFooter>
    )
  },
)

AnkiButtons.displayName = 'AnkiButtons'
