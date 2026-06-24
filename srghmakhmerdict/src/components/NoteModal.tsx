import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Button } from '@heroui/button'
import { Textarea } from '@heroui/input'
import { Tabs, Tab } from '@heroui/tabs'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { useNotes } from '../providers/NotesProvider'
import { FaEdit, FaEye } from 'react-icons/fa'
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

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
}

export const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, word, language }) => {
  const { getNote, saveNote, deleteNote } = useNotes()
  const initialNote = getNote(word, language) || ''
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

  // Reset state when opened with a different word or if initial note changes
  useEffect(() => {
    if (isOpen) {
      const note = getNote(word, language) || ''

      setText(note)
      setMode(note ? 'show' : 'edit')

      // Push a history state WITHOUT modifying the hash, because wouter uses hash routing
      // Any change to the hash would break routing when the app re-renders
      window.history.pushState({ noteModal: true }, '')

      const handlePopState = (e: PopStateEvent) => {
        // When the user presses back, the browser pops the state.
        // If our state is gone, it means they pressed back.
        if (!e.state?.noteModal) {
          onClose()
        }
      }

      window.addEventListener('popstate', handlePopState)

      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [isOpen, word, language, getNote, onClose])

  const handleClose = useCallback(() => {
    if (window.history.state?.noteModal) {
      window.history.back()
    }
    onClose()
  }, [onClose])

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
    <Modal
      classNames={{
        base: 'm-0 sm:m-0 w-full max-w-full rounded-none bg-background',
        header: 'pt-[calc(1rem+env(safe-area-inset-top))] px-4 md:px-6 pb-2',
        body: 'px-4 md:px-6 py-4 overflow-y-auto',
        footer: 'pb-[calc(1rem+env(safe-area-inset-bottom))] px-4 md:px-6 pt-4',
      }}
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      size="full"
      onClose={handleClose}
    >
      <ModalContent>
        {onCloseModal => (
          <>
            <ModalHeader className="flex flex-col gap-3">
              <div className="flex justify-between items-center w-full">
                <span className="text-xl">My Notes</span>
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
            </ModalHeader>
            <ModalBody>
              {mode === 'edit' ? (
                <Textarea
                  classNames={{ input: 'text-base' }}
                  maxRows={20}
                  minRows={10}
                  placeholder="Write your note here using Markdown..."
                  value={text}
                  onValueChange={setText}
                />
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
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onCloseModal}>
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
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
