import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@heroui/input'
import { ScrollShadow } from '@heroui/scroll-shadow'
import clsx from 'clsx'
import type { DictionaryLanguage } from '../../types'
import { KhmerDiff } from './KhmerDiff'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface AnkiContentProps {
  language: DictionaryLanguage
  cardWord: string
  isCardWordHidden: boolean // Derived from Direction + Language in DeckView
  isRevealed: boolean
  frontContent: () => React.ReactNode
  richContent: () => React.ReactNode // The Back side (Full Detail)
}

export const AnkiContent = React.memo(
  ({ language, cardWord, isCardWordHidden, isRevealed, frontContent, richContent }: AnkiContentProps) => {
    const [guess, setGuess] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input when applicable
    useEffect(() => {
      setGuess('')
      if (isCardWordHidden && !isRevealed) {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }, [cardWord, isCardWordHidden, isRevealed])

    // Logic to determine if we check the input against the card word
    // Only valid if we are "Guessing the Word" (isCardWordHidden is True)
    const normalizedGuess = guess.trim().toLowerCase()
    const normalizedCardWord = cardWord.toLowerCase()
    const isCorrect = normalizedGuess === normalizedCardWord
    const isKhmerWord = language === 'km'

    // Validation helpers
    const validExpected = isKhmerWord ? strToContainsKhmerOrUndefined(cardWord as NonEmptyStringTrimmed) : undefined
    const validGuess = String_toNonEmptyString_orUndefined_afterTrim(guess)

    return (
      <ScrollShadow className="flex-1 flex flex-col p-4 w-full max-w-4xl mx-auto gap-6">
        {/* ------------------------------------------------------
          FRONT CONTENT (The Question)
          - If Word Hidden: Shows Definition / Extracted Text
          - If Word Visible: Shows Word
         ------------------------------------------------------ */}
        <div className={clsx('flex-1', !isCardWordHidden && 'flex items-center justify-center min-h-[20vh]')}>
          {frontContent()}
        </div>

        {/* ------------------------------------------------------
          CASE A: WORD VISIBLE -> GUESS DEFINITION
          Reveal -> Show Full Detail
         ------------------------------------------------------ */}
        {!isCardWordHidden && isRevealed && (
          <div className="animate-in fade-in slide-in-from-bottom-4 border-t border-divider pt-6">{richContent()}</div>
        )}

        {/* ------------------------------------------------------
          CASE B: WORD HIDDEN -> GUESS WORD (Type it)
          Reveal -> Show Word + Diff + Full Detail
         ------------------------------------------------------ */}
        {isCardWordHidden && (
          <>
            {/* Input Area (Hidden when revealed) */}
            {!isRevealed && (
              <div className="w-full max-w-sm mx-auto my-4 sticky bottom-0 bg-content1/80 backdrop-blur-md p-4 rounded-xl border border-default-200">
                <Input
                  ref={inputRef}
                  classNames={{
                    input: clsx('text-center text-xl font-bold', isKhmerWord && 'font-khmer'),
                  }}
                  color="primary"
                  placeholder="Type the word..."
                  size="lg"
                  value={guess}
                  variant="faded"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      // Could trigger reveal via parent if we added onReveal here
                    }
                  }}
                  onValueChange={setGuess}
                />
              </div>
            )}

            {/* Answer Reveal */}
            {isRevealed && (
              <div className="w-full pt-4 border-t border-divider">
                {/* The correct word + Diff logic */}
                <div className="w-full text-center py-6 bg-content2/50 rounded-xl border border-divider mb-6">
                  <div className="text-tiny uppercase tracking-widest text-default-400 mb-2">Answer</div>

                  <div
                    className={clsx(
                      'text-4xl font-bold mb-2',
                      isCorrect ? 'text-success' : 'text-primary',
                      isKhmerWord && 'font-khmer',
                    )}
                  >
                    {cardWord}
                  </div>

                  {/* Show Diff if user typed something but got it wrong */}
                  {validGuess && !isCorrect && validExpected && (
                    <div className="mt-4 flex flex-col items-center animate-in zoom-in-95">
                      <div className="text-tiny text-default-400 mb-1">Difference:</div>
                      <div className="bg-content1 px-6 py-3 rounded-lg border border-default-200 shadow-sm">
                        <KhmerDiff inDictExpected={validExpected} userProvider={validGuess} />
                      </div>
                    </div>
                  )}

                  {validGuess && !isCorrect && !validExpected && (
                    <div className="text-danger font-mono mt-2 bg-danger/10 px-4 py-2 rounded-lg inline-block">
                      You typed: {guess}
                    </div>
                  )}

                  {validGuess && isCorrect && (
                    <div className="text-success font-bold mt-2 animate-bounce">Perfect Match!</div>
                  )}
                </div>

                {/* Full Details below the answer */}
                <div className="opacity-80">{richContent()}</div>
              </div>
            )}
          </>
        )}
      </ScrollShadow>
    )
  },
)

AnkiContent.displayName = 'AnkiContent'
