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
    return diffChars(inDictExpected, userProvider)
  }, [inDictExpected, userProvider])

  return (
    <div className={clsx('font-khmer text-2xl leading-loose', className)}>
      {diffs.map((part, index) => {
        // Case 1: Extra characters user typed that shouldn't be there
        if (part.added) {
          return (
            <span
              key={index}
              className="bg-danger/20 text-danger line-through decoration-danger decoration-2 mx-0.5 rounded px-0.5"
              title="Extra character"
            >
              {part.value}
            </span>
          )
        }

        // Case 2: Characters missing from user input (present in expected)
        if (part.removed) {
          return (
            <span
              key={index}
              className="text-warning border-b-2 border-warning border-dashed mx-0.5"
              title="Missing character"
            >
              {part.value}
            </span>
          )
        }

        // Case 3: Correct matches
        return (
          <span key={index} className="text-success font-bold">
            {part.value}
          </span>
        )
      })}
    </div>
  )
})

KhmerDiff.displayName = 'KhmerDiff'
