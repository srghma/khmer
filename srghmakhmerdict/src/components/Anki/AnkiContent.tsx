// ==== FILE: srghmakhmerdict/src/components/Anki/AnkiContent.tsx ====
import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@heroui/input'
import { ScrollShadow } from '@heroui/scroll-shadow'
import clsx from 'clsx'
import type { DictionaryLanguage } from '../../types'
import type { AnkiFlowMode } from './types'
import { KhmerDiff } from './KhmerDiff'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface AnkiContentProps {
  mode: AnkiFlowMode
  language: DictionaryLanguage
  cardWord: string
  isRevealed: boolean
  richContent: React.ReactNode // Replaces question/answer strings
}

export const AnkiContent = React.memo(({ mode, language, cardWord, isRevealed, richContent }: AnkiContentProps) => {
  const [guess, setGuess] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setGuess('')
    if (mode === 'DESC_TO_WORD' && !isRevealed) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [cardWord, mode, isRevealed])

  const normalizedGuess = guess.trim().toLowerCase()
  const normalizedCardWord = cardWord.toLowerCase()
  const isCorrect = normalizedGuess === normalizedCardWord
  const isKhmerWord = language === 'km' // Simplified assumption for display font

  // Prepare types for KhmerDiff safety
  const validExpected = isKhmerWord ? strToContainsKhmerOrUndefined(cardWord as NonEmptyStringTrimmed) : undefined
  const validGuess = String_toNonEmptyString_orUndefined_afterTrim(guess)

  return (
    <ScrollShadow className="flex-1 flex flex-col p-4 w-full max-w-4xl mx-auto gap-6">
      {/* ------------------------------------------------------
          MODE 1: WORD -> DESC
          Show Word. Reveal -> Show Description
         ------------------------------------------------------ */}
      {mode === 'WORD_TO_DESC' && (
        <>
          <div className="flex-1 flex items-center justify-center min-h-[20vh]">
            <div
              className={clsx(
                'text-5xl md:text-6xl font-bold text-center',
                isKhmerWord && 'font-khmer leading-relaxed',
              )}
            >
              {cardWord}
            </div>
          </div>

          {isRevealed && (
            <div className="animate-in fade-in slide-in-from-bottom-4 border-t border-divider pt-6">{richContent}</div>
          )}
        </>
      )}

      {/* ------------------------------------------------------
          MODE 2: DESC -> WORD
          Show Description (with hiding). Reveal -> Show Word
         ------------------------------------------------------ */}
      {mode === 'DESC_TO_WORD' && (
        <>
          {/* Always show description (Rich Content handles hiding internally via props) */}
          <div className="flex-1 overflow-visible">{richContent}</div>

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
                  // Optional: Block enter if needed, or allow it to bubble up to reveal
                  if (e.key === 'Enter') {
                    // logic to trigger reveal could go here if prop provided
                  }
                }}
                onValueChange={setGuess}
              />
            </div>
          )}

          {/* Answer Reveal */}
          {isRevealed && (
            <div className="w-full text-center py-6 bg-content2/50 rounded-xl border border-divider">
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
                  <div className="text-xs text-default-400 mt-2 flex gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success" /> Correct
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-warning" /> Missing
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-danger" /> Extra
                    </span>
                  </div>
                </div>
              )}

              {/* Fallback for non-Khmer words or simple typo display */}
              {validGuess && !isCorrect && !validExpected && (
                <div className="text-danger font-mono mt-2 bg-danger/10 px-4 py-2 rounded-lg inline-block">
                  You typed: {guess}
                </div>
              )}

              {validGuess && isCorrect && (
                <div className="text-success font-bold mt-2 animate-bounce">Perfect Match!</div>
              )}
            </div>
          )}
        </>
      )}
    </ScrollShadow>
  )
})

AnkiContent.displayName = 'AnkiContent'
