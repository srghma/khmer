import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAppToast } from '../../providers/ToastProvider'
import {
  IoVolumeHighOutline as Volume2,
  IoBookOutline as BookOpen,
  IoRepeat as Repeat,
  IoSquare as Square,
} from 'react-icons/io5'
import { Button } from '@heroui/button'
import { cn } from '@heroui/theme'
import { getWordDetailKm } from '../../db/dict/km'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiTable } from './AnkiTableContext'
import { useDictionary } from '../../providers/DictionaryProvider'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { type AnkiTableAudioPlayer, type AudioTrack } from './types'

interface Props {
  type: 'front' | 'back' | 'info'
  title: string | undefined
  children: React.ReactNode | undefined
  className?: string
  audioUrl: string | undefined
  word: NonEmptyStringTrimmed | undefined
  isRowRevealed: boolean
  isGlobalHidden: boolean
  audio: AnkiTableAudioPlayer
}

export const AnkiNoteCell: React.FC<Props> = React.memo(
  ({ type, title, children, className, audioUrl, word, isRowRevealed = false, isGlobalHidden, audio }) => {
    const { onWiktionaryClick } = useAnkiTable()
    const dictData = useDictionary()
    const toast = useAppToast()
    const [isTemporarilyShown, setIsTemporarilyShown] = useState(false)
    const [wiktionaryContent, setWiktionaryContent] = useState<string | null>(null)
    const [isLoadingWiktionary, setIsLoadingWiktionary] = useState(false)
    const [isWiktionaryNotFound, setIsWiktionaryNotFound] = useState(() => {
      const kmEntry = dictData.km_map.get(word as TypedContainsKhmer)

      return !kmEntry
    })
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
    const wasHiddenRef = useRef(isGlobalHidden && !isTemporarilyShown && !isRowRevealed)

    const isHidden = isGlobalHidden && !isTemporarilyShown && !isRowRevealed

    const textToPlay = title || (typeof children === 'string' ? children : '') || word || ''
    const currentCellTrack: AudioTrack | null = audioUrl ? { url: audioUrl, text: textToPlay } : null

    const isPlaying =
      audio.isPlaying &&
      currentCellTrack &&
      audio.currentTrack?.url === currentCellTrack.url &&
      audio.currentTrack?.text === currentCellTrack.text
    const isRepeating = !!currentCellTrack && audio.isInQueue(currentCellTrack)

    const hasContent = !!children
    const shouldRender = hasContent || !!audioUrl || type === 'info'

    const playAudio = useCallback(() => {
      if (!textToPlay || !audioUrl) return

      audio.playText({ text: textToPlay, audioUrl })
    }, [audio, audioUrl, textToPlay])

    // Auto-play when revealed via individual click
    useEffect(() => {
      if (wasHiddenRef.current && isTemporarilyShown) {
        // Individual click reveal
        playAudio()
      }
      wasHiddenRef.current = isHidden
    }, [isTemporarilyShown, isHidden, playAudio])

    const handleClick = useCallback(() => {
      if (isHidden) {
        setIsTemporarilyShown(true)

        if (timeoutId) clearTimeout(timeoutId)
        const id = setTimeout(() => {
          setIsTemporarilyShown(false)
          setTimeoutId(null)
        }, 10000)

        setTimeoutId(id)
      }
    }, [isHidden, timeoutId])

    useEffect(() => {
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }, [timeoutId])

    const handlePlayClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        playAudio()
      },
      [playAudio],
    )

    const toggleRepeat = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!currentCellTrack) return

        if (audio.isInQueue(currentCellTrack)) {
          audio.removeFromQueue(currentCellTrack)
        } else {
          audio.addToQueue(currentCellTrack)
        }
      },
      [audio, currentCellTrack],
    )

    const handleWiktionaryLookup = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!word) return

        if (wiktionaryContent) {
          onWiktionaryClick(wiktionaryContent)

          return
        }

        setIsLoadingWiktionary(true)
        try {
          const detail = await getWordDetailKm(word)

          if (detail?.wiktionary) {
            setWiktionaryContent(detail.wiktionary)
            onWiktionaryClick(detail.wiktionary)
          } else {
            setIsWiktionaryNotFound(true)
            toast.warn('Wiktionary' as NonEmptyStringTrimmed, 'No entry found in database.' as NonEmptyStringTrimmed)
          }
        } catch (err: any) {
          toast.error(
            'Wiktionary Lookup Error' as NonEmptyStringTrimmed,
            (err.message || 'Unknown error') as NonEmptyStringTrimmed,
          )
        } finally {
          setIsLoadingWiktionary(false)
        }
      },
      [onWiktionaryClick, toast, wiktionaryContent, word],
    )

    if (!shouldRender) return null

    return (
      <div
        className={cn(
          'relative flex min-h-[3rem] w-full flex-col gap-2 rounded-lg border border-transparent p-3 transition-colors duration-200',
          isHidden
            ? 'cursor-pointer border-zinc-800 bg-zinc-950 text-transparent shadow-inner select-none hover:bg-zinc-900'
            : 'bg-card text-card-foreground shadow-sm hover:border-muted-foreground/20',
          className,
        )}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
      >
        {children && (
          <div className={cn('flex-grow transition-opacity duration-200', isHidden ? 'opacity-0' : 'opacity-100')}>
            {children}
          </div>
        )}

        <div className="mt-auto flex flex-wrap justify-end gap-2">
          {type !== 'info' && (audioUrl || word || (typeof children === 'string' && children)) && (
            <div className="flex items-center gap-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900/50">
              <Button
                className={cn(
                  'h-7 gap-1.5 rounded-none px-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-300',
                  isPlaying
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'text-zinc-400 hover:text-zinc-100',
                  isHidden && !isPlaying ? 'text-zinc-500' : '',
                )}
                size="sm"
                variant="light"
                onClick={handlePlayClick}
              >
                {isPlaying ? (
                  <>
                    <Square fill="currentColor" size={12} />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 size={12} />
                    Play
                  </>
                )}
              </Button>
              {audioUrl && (
                <>
                  <div className="h-4 w-[1px] bg-zinc-700" />
                  <Button
                    className={cn(
                      'h-7 w-7 min-w-0 rounded-none transition-all duration-300',
                      isRepeating
                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                        : 'text-zinc-500 hover:text-zinc-100',
                    )}
                    size="sm"
                    title={isRepeating ? 'Disable Repeat' : 'Repeat Infinitely'}
                    variant="light"
                    onClick={toggleRepeat}
                  >
                    <Repeat className={cn(isRepeating ? 'animate-pulse' : '')} size={12} />
                  </Button>
                </>
              )}
            </div>
          )}

          {type === 'info' && word && !isWiktionaryNotFound && (
            <Button
              className={cn(
                'h-7 gap-1.5 px-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-300',
                isHidden ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : '',
              )}
              isLoading={isLoadingWiktionary}
              size="sm"
              variant="bordered"
              onClick={handleWiktionaryLookup}
            >
              <BookOpen size={12} />
              Wikt
            </Button>
          )}
        </div>
      </div>
    )
  },
)

AnkiNoteCell.displayName = 'AnkiNoteCell'
