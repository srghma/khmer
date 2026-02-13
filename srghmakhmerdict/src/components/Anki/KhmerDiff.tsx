import React, { useMemo } from 'react'
import { diffArrays } from 'diff'
import clsx from 'clsx'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface KhmerDiffProps {
  inDictExpected: NonEmptyStringTrimmed
  userProvider: NonEmptyStringTrimmed
  className?: string
}

export const KhmerDiff = React.memo(({ inDictExpected, userProvider, className }: KhmerDiffProps) => {
  const diffs = useMemo(() => {
    // We use Intl.Segmenter to split Khmer text into grapheme clusters.
    // This is crucial because standard character-based diffing can split a base character
    // from its diacritics, which breaks Khmer rendering in separate <span> elements.
    const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' })
    const expectedClusters = Array.from(segmenter.segment(inDictExpected)).map(s => s.segment)
    const userClusters = Array.from(segmenter.segment(userProvider)).map(s => s.segment)

    // diffArrays(oldValue, newValue)
    // oldValue: inDictExpected (the correct version)
    // newValue: userProvider (what the user typed)
    // - added: present in newValue (user) but not oldValue (dict) -> Extra character
    // - removed: present in oldValue (dict) but not newValue (user) -> Missing character
    return diffArrays(expectedClusters, userClusters)
  }, [inDictExpected, userProvider])

  return (
    <div className={clsx('text-2xl leading-loose', className)}>
      {diffs.map((part, index) => {
        const value = part.value.join('')

        // Case 1: Extra characters user typed that shouldn't be there
        if (part.added) {
          return (
            <span key={index} className="text-success" title="Extra character">
              {value}
            </span>
          )
        }

        // Case 2: Characters missing from user input (present in expected)
        if (part.removed) {
          return (
            <span key={index} className="text-danger" title="Missing character">
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
