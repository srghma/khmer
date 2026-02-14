import React, { useMemo } from 'react'
import { diffChars } from 'diff'
import clsx from 'clsx'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface KhmerDiffProps {
  inDictExpected: NonEmptyStringTrimmed
  userProvider: NonEmptyStringTrimmed
  className?: string
}

export const KhmerDiff = React.memo(({ inDictExpected, userProvider, className }: KhmerDiffProps) => {
  const diffs = useMemo(() => {
    // diffChars(oldValue, newValue)
    // oldValue: inDictExpected (the correct version)
    // newValue: userProvider (what the user typed)
    return diffChars(userProvider, inDictExpected)
  }, [inDictExpected, userProvider])

  return (
    <div className={clsx('text-2xl leading-loose', className)}>
      {diffs.map((part, index) => {
        const isDiff = part.added || part.removed
        // If it's a difference, we split into characters and add non-breaking spaces
        // to make diacritics visible and prevent composition issues.
        const value = isDiff ? Array.from(part.value).join('\u00A0') : part.value

        // Case 1: Extra characters user typed that shouldn't be there
        if (part.added) {
          return (
            <span key={index} className="text-success font-bold" title="Extra character">
              {value}
            </span>
          )
        }

        // Case 2: Characters missing from user input (present in expected)
        if (part.removed) {
          return (
            <span key={index} className="text-danger font-bold" title="Missing character">
              {value}
            </span>
          )
        }

        // Case 3: Correct matches
        return <span key={index}>{value}</span>
      })}
    </div>
  )
})

KhmerDiff.displayName = 'KhmerDiff'
