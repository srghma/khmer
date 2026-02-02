import React, { useCallback, memo } from 'react'
import { Tooltip } from '@heroui/tooltip'
import { HiSpeakerWave, HiArrowTopRightOnSquare } from 'react-icons/hi2'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { executeGoogleTts } from '../../utils/tts'

// TanStack Virtual

export const WordCard = memo(
  ({ word, highlight }: { word: NonEmptyStringTrimmed; highlight: NonEmptyStringTrimmed }) => {
    // Logic remains same
    const parts = React.useMemo(() => word.split(highlight), [word, highlight])
    const handleSpeak = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        executeGoogleTts(word, 'km')
      },
      [word],
    )

    const handleTranslate = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        window.open(`https://translate.google.com/?sl=km&text=${encodeURIComponent(word)}`, '_blank')
      },
      [word],
    )

    return (
      <div className="group bg-content1 border border-divider rounded-lg p-3 flex justify-between items-center hover:border-primary/50 hover:shadow-sm transition-all h-[64px]">
        <div className="text-lg font-khmer text-foreground/90 truncate mr-2">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 && (
                <span className="text-danger font-bold bg-danger/10 rounded px-0.5">{highlight}</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Tooltip closeDelay={0} content="Speak">
            <button
              className="p-1.5 text-default-400 hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={handleSpeak}
            >
              <HiSpeakerWave />
            </button>
          </Tooltip>
          <Tooltip closeDelay={0} content="Google Translate">
            <button
              className="p-1.5 text-default-400 hover:text-secondary hover:bg-secondary/10 rounded-full"
              onClick={handleTranslate}
            >
              <HiArrowTopRightOnSquare />
            </button>
          </Tooltip>
        </div>
      </div>
    )
  },
)

WordCard.displayName = 'WordCard'
