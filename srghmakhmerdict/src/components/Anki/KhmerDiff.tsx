import React, { useMemo } from 'react'
import { diffChars } from 'diff'
import clsx from 'clsx'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { HiArrowDown } from 'react-icons/hi2'

interface KhmerDiffProps {
  inDictExpected: NonEmptyStringTrimmed
  userProvider: NonEmptyStringTrimmed
  className?: string
}

export const KhmerDiff = React.memo(function KhmerDiff({ inDictExpected, userProvider, className }: KhmerDiffProps) {
  const { LL } = useI18nContext()

  // Logic: diffChars(oldValue, newValue)
  // userProvider is what they typed (the "incorrect" baseline)
  // inDictExpected is the target (the "correct" goal)
  const diffs = useMemo(() => {
    return diffChars(userProvider, inDictExpected)
  }, [inDictExpected, userProvider])

  const renderPart = (part: any, type: 'user' | 'expected') => {
    const isDiff = part.added || part.removed
    // Add non-breaking space to diacritics so they don't float invisibly
    const value = isDiff ? Array.from(part.value).join('\u00A0') : part.value

    if (type === 'user') {
      // On the user row, we only show what they typed.
      // If 'added', it means it's in the dictionary but not their input -> skip it.
      if (part.added) return null

      // If 'removed', it means they typed something that shouldn't be there -> Red.
      if (part.removed) {
        return (
          <span
            key={value}
            className="bg-danger/20 text-danger font-bold rounded-sm px-0.5"
            title={LL.ANKI.DIFF.EXTRA()}
          >
            {value}
          </span>
        )
      }
    }

    if (type === 'expected') {
      // On the expected row, we only show the correct string.
      // If 'removed', it's the user's mistake -> skip it.
      if (part.removed) return null

      // If 'added', it's a character they missed -> Green.
      if (part.added) {
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
  }

  return (
    <div className={clsx('flex flex-col items-center gap-2 py-4 font-mono', className)}>
      {/* 1. User Input Row (The "Mistake") */}
      <div className="text-2xl leading-loose break-all text-center">{diffs.map(part => renderPart(part, 'user'))}</div>

      {/* 2. The Anki Arrow */}
      <div className="text-default-400">
        <HiArrowDown size={20} />
      </div>

      {/* 3. Expected Row (The "Correction") */}
      <div className="text-2xl leading-loose break-all text-center">
        {diffs.map(part => renderPart(part, 'expected'))}
      </div>
    </div>
  )
})

KhmerDiff.displayName = 'KhmerDiff'
