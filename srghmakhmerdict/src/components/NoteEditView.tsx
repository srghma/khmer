import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@heroui/button'
import { Textarea } from '@heroui/input'
import { Tabs, Tab } from '@heroui/tabs'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { useNotes } from '../providers/NotesProvider'
import { FaEdit, FaEye } from 'react-icons/fa'
import { HiArrowLeft } from 'react-icons/hi2'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useSettings } from '../providers/SettingsProvider'
import { useLocation } from 'wouter'
import { setLocation_khmerWord_ifInDictionary } from '../utils/url-navigation'
import { useDictionary } from '../providers/DictionaryProvider'
import { useAppToast } from '../providers/ToastProvider'
import { useI18nContext } from '../i18n/i18n-react-custom'
import { RenderHtmlColorized } from './DetailView/atoms'
import { basicMarkdownToHtml } from '../utils/text-processing/markdown'
import { Alert } from '@heroui/alert'
import { ColorizationAction, ShortDetailAboutKhmerWordAction } from './DetailView/DetailViewHeaderActions'
import { generateTextSegments, yieldUniqueKhmerWords } from '../utils/text-processing/text'
import { Set_toNonEmptySet_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useKhmerDefinitions } from '../hooks/useKhmerDefinitions'

interface NoteEditViewProps {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
}

export const NoteEditView: React.FC<NoteEditViewProps> = ({ word, language }) => {
  const { getNote, saveNote, deleteNote } = useNotes()
  const initialNote = useMemo(() => getNote(word, language) || '', [getNote, word, language])
  const [text, setText] = useState(initialNote)

  // Default to show mode if there's text, otherwise edit mode
  const [mode, setMode] = useState<'show' | 'edit'>(initialNote ? 'show' : 'edit')

  const {
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isShowShortDetailAboutKhmerWordEnabled,
    maybeColorMode,
    setMaybeColorMode,
    toggleShowShortDetailAboutKhmerWord,
  } = useSettings()

  const { km_map } = useDictionary()
  const toast = useAppToast()
  const [, setLocation] = useLocation()
  const { LL } = useI18nContext()

  // Update text if initialNote changes
  useEffect(() => {
    setText(initialNote)
    setMode(initialNote ? 'show' : 'edit')
  }, [initialNote])

  const handleClose = useCallback(() => {
    window.history.back()
  }, [])

  const handleSave = async () => {
    if (text.trim()) {
      await saveNote(word, language, text.trim())
    } else {
      await deleteNote(word, language)
    }
    handleClose()
  }

  const handleWordClick = useCallback(
    (w: NonEmptyStringTrimmed) => {
      setLocation_khmerWord_ifInDictionary(w, km_map, toast, setLocation, LL)
    },
    [km_map, toast, setLocation, LL],
  )

  const htmlResult = useMemo(() => {
    if (mode === 'show' && text) {
      const trimmedText = String_toNonEmptyString_orUndefined_afterTrim(text)

      if (!trimmedText) {
        return { t: 'empty' } as const
      }

      return basicMarkdownToHtml(trimmedText)
    }

    return null
  }, [text, mode])

  const uniqueKhmerWordsInNote = useMemo(() => {
    if (mode !== 'show' || !text || !isShowShortDetailAboutKhmerWordEnabled) return undefined

    const words = new Set<TypedKhmerWord>()
    const trimmedHtml = String_toNonEmptyString_orUndefined_afterTrim(text)

    if (!trimmedHtml) return undefined

    // Basic text extraction for segmenting
    const rawText = String_toNonEmptyString_orUndefined_afterTrim(trimmedHtml.replace(/<[^>]*>/g, ' '))

    if (!rawText) return undefined

    const segments = generateTextSegments(rawText, maybeColorMode, km_map, false)

    for (const w of yieldUniqueKhmerWords(segments)) {
      words.add(w)
    }

    return Set_toNonEmptySet_orUndefined(words)
  }, [text, mode, isShowShortDetailAboutKhmerWordEnabled, km_map, maybeColorMode])

  const shortDefinitionsResult = useKhmerDefinitions(uniqueKhmerWordsInNote)

  const shortDefinitions = useMemo(() => {
    return shortDefinitionsResult.t === 'success' ? shortDefinitionsResult.definitions : undefined
  }, [shortDefinitionsResult])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="pt-[calc(1rem+env(safe-area-inset-top))] px-4 md:px-6 pb-2 border-b border-divider shrink-0">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              className="text-default-500"
              variant="light"
              onPress={handleClose}
            >
              <HiArrowLeft className="w-6 h-6" />
            </Button>
            <span className="text-xl font-semibold">Notes: {word}</span>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'show' && (
              <>
                <ShortDetailAboutKhmerWordAction
                  isEnabled={isShowShortDetailAboutKhmerWordEnabled}
                  onToggle={toggleShowShortDetailAboutKhmerWord}
                />
                <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
              </>
            )}
            <Tabs
              color="primary"
              selectedKey={mode}
              size="sm"
              onSelectionChange={k => setMode(k as 'show' | 'edit')}
            >
              <Tab
                key="show"
                title={
                  <div className="flex items-center gap-2">
                    <FaEye /> Show
                  </div>
                }
              />
              <Tab
                key="edit"
                title={
                  <div className="flex items-center gap-2">
                    <FaEdit /> Edit
                  </div>
                }
              />
            </Tabs>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={`flex-1 px-4 md:px-6 py-4 min-h-0 ${mode === 'edit' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        {mode === 'edit' ? (
          <div className="flex-grow h-full min-h-0 [&>div]:h-full [&>div>div]:h-full">
            <Textarea
              classNames={{
                base: 'h-full',
                inputWrapper: 'h-full',
                input: 'text-base h-full resize-none',
              }}
              placeholder="Write your note here using Markdown..."
              value={text}
              onValueChange={setText}
            />
          </div>
        ) : (
          <div className="min-h-[150px]">
            {!text ? (
              <p className="text-default-400 italic">No notes yet. Switch to edit mode to add some.</p>
            ) : htmlResult?.t === 'error' ? (
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
            ) : null}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="pb-[calc(1rem+env(safe-area-inset-bottom))] px-4 md:px-6 pt-4 border-t border-divider flex justify-end gap-2 shrink-0">
        <Button color="danger" variant="light" onPress={handleClose}>
          Cancel
        </Button>
        {mode === 'edit' && (
          <Button color="primary" onPress={handleSave}>
            Save
          </Button>
        )}
        {mode === 'show' && text !== initialNote && (
          <Button color="primary" onPress={handleSave}>
            Save Changes
          </Button>
        )}
      </footer>
    </div>
  )
}
