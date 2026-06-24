import React, { useState, useMemo, useCallback, useRef, memo } from 'react'
import { Button } from '@heroui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { useNotes } from '../providers/NotesProvider'
import { FaEdit, FaRegEdit } from 'react-icons/fa'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useSettings } from '../providers/SettingsProvider'
import { useLocation } from 'wouter'
import { setLocation_khmerWord_ifInDictionary } from '../utils/url-navigation'
import { useDictionary } from '../providers/DictionaryProvider'
import { useAppToast } from '../providers/ToastProvider'
import { useI18nContext } from '../i18n/i18n-react-custom'
import { RenderHtmlColorized } from './DetailView/atoms'
import { basicMarkdownToHtml } from './../utils/text-processing/markdown'
import { Alert } from '@heroui/alert'
import { generateTextSegments, yieldUniqueKhmerWords } from '../utils/text-processing/text'
import { Set_toNonEmptySet_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useKhmerDefinitions } from '../hooks/useKhmerDefinitions'
import { TooltipMobileFriendly } from './TooltipMobileFriendly'

const NotePreviewPopoverContent = memo(function NotePreviewPopoverContent({ noteText }: { noteText: string }) {
  const { khmerWordsHidingMode, nonKhmerWordsHidingMode, isShowShortDetailAboutKhmerWordEnabled, maybeColorMode } =
    useSettings()

  const { km_map } = useDictionary()
  const toast = useAppToast()
  const [, setLocation] = useLocation()
  const { LL } = useI18nContext()

  const handleWordClick = useCallback(
    (w: NonEmptyStringTrimmed) => {
      setLocation_khmerWord_ifInDictionary(w, km_map, toast, setLocation, LL)
    },
    [km_map, toast, setLocation, LL],
  )

  const htmlResult = useMemo(() => {
    const trimmedText = String_toNonEmptyString_orUndefined_afterTrim(noteText)

    if (!trimmedText) return null

    return basicMarkdownToHtml(trimmedText)
  }, [noteText])

  const uniqueKhmerWordsInNote = useMemo(() => {
    if (!isShowShortDetailAboutKhmerWordEnabled) return undefined

    const words = new Set<TypedKhmerWord>()
    const trimmedHtml = String_toNonEmptyString_orUndefined_afterTrim(noteText)

    if (!trimmedHtml) return undefined

    const rawText = String_toNonEmptyString_orUndefined_afterTrim(trimmedHtml.replace(/<[^>]*>/g, ' '))

    if (!rawText) return undefined

    const segments = generateTextSegments(rawText, maybeColorMode, km_map, false)

    for (const w of yieldUniqueKhmerWords(segments)) {
      words.add(w)
    }

    return Set_toNonEmptySet_orUndefined(words)
  }, [noteText, isShowShortDetailAboutKhmerWordEnabled, km_map, maybeColorMode])

  const shortDefinitionsResult = useKhmerDefinitions(uniqueKhmerWordsInNote)
  const shortDefinitions = useMemo(() => {
    return shortDefinitionsResult.t === 'success' ? shortDefinitionsResult.definitions : undefined
  }, [shortDefinitionsResult])

  return (
    <div className="p-3 max-w-[min(350px,calc(100vw-32px))] max-h-[300px] overflow-y-auto">
      {htmlResult?.t === 'error' ? (
        <Alert color="danger" variant="flat">
          {LL.ANALYZER.MARKDOWN_ERROR()}
        </Alert>
      ) : htmlResult?.t === 'empty' ? (
        <Alert color="warning" variant="flat">
          {LL.ANALYZER.MARKDOWN_ERROR_EMPTY()}
        </Alert>
      ) : htmlResult?.t === 'success' ? (
        <RenderHtmlColorized
          className="overflow-x-auto text-medium leading-relaxed break-words whitespace-pre-wrap"
          dictionaryMode_lonelyWordShouldBeSpilt={false}
          excludeWord={undefined}
          hideBrokenImages_enable={false}
          html={htmlResult.v}
          isKhmerLinksEnabled_ifTrue_passOnNavigateKm={handleWordClick}
          isKhmerPronunciationHidingEnabled={false}
          isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
          khmerWordsHidingMode={khmerWordsHidingMode}
          nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
          pronunciationSource={undefined}
          shortDefinitions={shortDefinitions}
        />
      ) : (
        <p className="text-default-400 italic">No notes yet.</p>
      )}
    </div>
  )
})

interface NoteEditButtonProps {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  className?: string
  iconClassName?: string
  variant?: 'light' | 'flat' | 'solid'
  size?: 'sm' | 'md' | 'lg'
}

export const NoteEditButton: React.FC<NoteEditButtonProps> = memo(
  ({ word, language, radius, className, iconClassName, variant = 'light', size = 'sm' }) => {
    const { getNote } = useNotes()
    const [, setLocation] = useLocation()
    const { LL } = useI18nContext()

    const [isOpen, setIsOpen] = useState(false)
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isLongPressActive = useRef(false)
    const pointerStartPos = useRef<{ x: number; y: number } | null>(null)

    const noteText = getNote(word, language) || ''
    const hasNote = !!noteText

    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        if (!hasNote) return // No preview if there's no note

        isLongPressActive.current = false
        pointerStartPos.current = { x: e.clientX, y: e.clientY }

        longPressTimer.current = setTimeout(() => {
          isLongPressActive.current = true
          setIsOpen(true)
        }, 500)
      },
      [hasNote],
    )

    const handlePointerUp = useCallback(
      (e: React.PointerEvent) => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }

        if (isLongPressActive.current) {
          e.preventDefault()
          e.stopPropagation()
        } else {
          setLocation(`/notes/${language}/${encodeURIComponent(word)}`)
        }
      },
      [language, word, setLocation],
    )

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      if (!pointerStartPos.current) return
      const dx = Math.abs(e.clientX - pointerStartPos.current.x)
      const dy = Math.abs(e.clientY - pointerStartPos.current.y)

      if (dx > 10 || dy > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      }
    }, [])

    const handlePointerCancel = useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }, [])

    const buttonContent = (
      <Button
        isIconOnly
        className={className}
        radius={radius}
        size={size}
        variant={variant}
        onContextMenu={e => e.preventDefault()}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerCancel}
        onPointerUp={handlePointerUp}
      >
        {hasNote ? <FaEdit className={iconClassName} /> : <FaRegEdit className={iconClassName} />}
      </Button>
    )

    return (
      <Popover showArrow backdrop="transparent" isOpen={isOpen} placement="bottom" onOpenChange={setIsOpen}>
        <PopoverTrigger>
          {!isOpen ? (
            <TooltipMobileFriendly closeDelay={0} content={LL.ACTIONS.ADD_NOTE()}>
              {buttonContent}
            </TooltipMobileFriendly>
          ) : (
            buttonContent
          )}
        </PopoverTrigger>
        {hasNote && (
          <PopoverContent className="p-0 border border-divider shadow-lg bg-content1 rounded-medium">
            <NotePreviewPopoverContent noteText={noteText} />
          </PopoverContent>
        )}
      </Popover>
    )
  },
)
NoteEditButton.displayName = 'NoteEditButton'
