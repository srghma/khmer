import React, { memo, useCallback, useMemo } from 'react'
import { diffChars } from 'diff'
import clsx from 'clsx'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { HiArrowDown } from 'react-icons/hi2'
import { GoogleOrNativeTtsState_speakIfCan, useGoogleOrNativeTts } from '../../hooks/useGoogleOrNativeTts'
import { useAppToast } from '../../providers/ToastProvider'

const Part = memo(function Part({
  part_added,
  part_removed,
  part_value,
  type,
}: {
  part_added: boolean
  part_removed: boolean
  part_value: string
  type: 'user' | 'expected'
}) {
  const { LL } = useI18nContext()
  const isDiff = part_added || part_removed
  // Add non-breaking space to diacritics so they don't float invisibly
  const value = isDiff ? Array.from(part_value).join('\u00A0') : part_value

  if (type === 'user') {
    // On the user row, we only show what they typed.
    // If 'added', it means it's in the dictionary but not their input -> skip it.
    if (part_added) return null

    // If 'removed', it means they typed something that shouldn't be there -> Red.
    if (part_removed) {
      return (
        <span key={value} className="bg-danger/20 text-danger font-bold rounded-sm px-0.5" title={LL.ANKI.DIFF.EXTRA()}>
          {value}
        </span>
      )
    }
  }

  if (type === 'expected') {
    // On the expected row, we only show the correct string.
    // If 'removed', it's the user's mistake -> skip it.
    if (part_removed) return null

    // If 'added', it's a character they missed -> Green.
    if (part_added) {
      return (
        <span
          key={value}
          className="bg-success/20 text-success font-bold rounded-sm px-0.5"
          title={LL.ANKI.DIFF.MISSING()}
        >
          {value}
        </span>
      )
    }
  }

  return <span key={value}>{value}</span>
})

interface KhmerDiffProps {
  inDictExpected: NonEmptyStringTrimmed
  userProvided: NonEmptyStringTrimmed
  className?: string
}

export const KhmerDiff = React.memo(function KhmerDiff({ inDictExpected, userProvided, className }: KhmerDiffProps) {
  const tts = useGoogleOrNativeTts()
  const toast = useAppToast()

  const handleUserWordClick = useCallback(() => {
    GoogleOrNativeTtsState_speakIfCan(tts, userProvided, toast)
  }, [tts, userProvided, toast])

  const handleExpectedWordClick = useCallback(() => {
    GoogleOrNativeTtsState_speakIfCan(tts, inDictExpected, toast)
  }, [tts, inDictExpected, toast])

  // Logic: diffChars(oldValue, newValue)
  // userProvider is what they typed (the "incorrect" baseline)
  // inDictExpected is the target (the "correct" goal)
  const diffs = useMemo(() => {
    return diffChars(userProvided, inDictExpected)
  }, [inDictExpected, userProvided])

  return (
    <div className={clsx('flex flex-col items-center gap-2 py-4 font-mono', className)}>
      {/* 1. User Input Row (The "Mistake") */}
      <button className="text-2xl leading-loose break-all text-center" onClick={handleUserWordClick}>
        {diffs.map(part => (
          <Part
            key={part.value}
            part_added={part.added}
            part_removed={part.removed}
            part_value={part.value}
            type="user"
          />
        ))}
      </button>

      {/* 2. The Anki Arrow */}
      <div className="text-default-400">
        <HiArrowDown size={20} />
      </div>

      {/* 3. Expected Row (The "Correction") */}
      <button className="text-2xl leading-loose break-all text-center" onClick={handleExpectedWordClick}>
        {diffs.map(part => (
          <Part
            key={part.value}
            part_added={part.added}
            part_removed={part.removed}
            part_value={part.value}
            type="expected"
          />
        ))}
      </button>
    </div>
  )
})

KhmerDiff.displayName = 'KhmerDiff'
