import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardBody } from '@heroui/react'
import type { TypedWithoutKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-without-khmer'

const maskKhmerTextInHtml = (html: NonEmptyStringTrimmed): TypedWithoutKhmer => {
  return html.replace(
    /[\p{Script=Khmer}]+/gu,
    '<span class="bg-foreground text-foreground select-none rounded-[2px] px-1 mx-0.5 animate-pulse cursor-help">REDACTED</span>',
  ) as TypedWithoutKhmer
}

export const AnkiContent = React.memo(
  ({
    word,
    definitionHtml,
    isRevealed,
  }: {
    word: TypedContainsKhmer | undefined
    definitionHtml: NonEmptyStringTrimmed | undefined
    isRevealed: boolean
  }) => {
    if (!word) {
      return <div className="flex-1 flex items-center justify-center text-default-400">Select a card to start</div>
    }

    if (!definitionHtml) {
      return (
        <div className="flex-1 flex items-center justify-center text-default-400">Error: no definition word {word}</div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl flex flex-col gap-8 items-center">
          {/* Question Side (Definition with Mask) */}
          <Card className="w-full shadow-md bg-default-50 border border-default-100">
            <CardBody className="p-6">
              <div className="text-tiny text-default-400 uppercase tracking-widest mb-2 font-bold">
                Definition / Context
              </div>
              <div
                dangerouslySetInnerHTML={{
                  __html: isRevealed ? definitionHtml : maskKhmerTextInHtml(definitionHtml),
                }}
                className="prose prose-sm dark:prose-invert max-w-none text-lg leading-relaxed select-none"
              />
            </CardBody>
          </Card>

          {/* Answer Side (Revealed) */}
          {isRevealed && (
            <motion.div animate={{ opacity: 1, y: 0 }} className="w-full" initial={{ opacity: 0, y: 20 }}>
              <Card className="w-full border-primary/20 bg-primary/5">
                <CardBody className="p-8 flex flex-col items-center text-center">
                  <div className="text-tiny text-primary/60 uppercase tracking-widest mb-4 font-bold">Answer</div>
                  <div className="text-6xl font-khmer font-bold text-primary mb-2 leading-relaxed">{word}</div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    )
  },
)

AnkiContent.displayName = 'AnkiContent'
