import React, { useState, useEffect, useMemo, memo } from 'react'
import { Textarea, type TextAreaProps } from '@heroui/input'
import { Button, ButtonGroup } from '@heroui/button'
import { HiTranslate } from 'react-icons/hi'

import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import type { KhmerWordsMap } from '../../db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { detectModeFromText } from '../../utils/detectModeFromText'

import { LanguageSelector, LoadingStatus, ResultDisplay } from './components'
import { useGoogleTranslation, type GoogleTranslationState } from '../../hooks/useGoogleTranslation'
import { GoogleSpeechAction } from '../DetailView/GoogleSpeechAction'
import { NativeSpeechAction } from '../DetailView/NativeSpeechAction'
import { Alert } from '@heroui/alert'
import type { ToTranslateLanguage } from '../../utils/googleTranslate/toTranslateLanguage'
import { map_DictionaryLanguage_to_BCP47LanguageTagName } from '../../utils/my-bcp-47'

// ---------------------------------------------------------------------------
// Sub-Component: EndContent (Toolbar)
// ---------------------------------------------------------------------------

interface GoogleTranslateEndContentProps {
  value: NonEmptyStringTrimmed | undefined
  loading: boolean
  targetLang: ToTranslateLanguage
  onTargetLangChange: (lang: ToTranslateLanguage) => void
  onTranslate: () => void
}

const GoogleTranslateEndContent = memo(
  ({ value, loading, targetLang, onTargetLangChange, onTranslate }: GoogleTranslateEndContentProps) => {
    // Auto-detect mode for input text, fallback to 'km' if detection fails or empty
    const inputMode = useMemo(() => (value ? detectModeFromText(value) : undefined) ?? 'km', [value])

    return (
      <div className="flex justify-between items-center gap-2">
        {/* Left: Input Speak Actions (Auto-detected) */}
        <div className="flex gap-1">
          <NativeSpeechAction mode={map_DictionaryLanguage_to_BCP47LanguageTagName[inputMode]} word={value} />
          <GoogleSpeechAction mode={inputMode} word={value} />
        </div>

        {/* Right: Translate Action */}
        <ButtonGroup color="primary" size="sm" variant="flat">
          <Button
            className="font-semibold"
            isLoading={loading}
            startContent={!loading && <HiTranslate />}
            onPress={onTranslate}
          >
            Translate
          </Button>
          <LanguageSelector targetLang={targetLang} onSelect={onTargetLangChange} />
        </ButtonGroup>
      </div>
    )
  },
)

GoogleTranslateEndContent.displayName = 'GoogleTranslateEndContent'

// ---------------------------------------------------------------------------
// Sub-Component: BottomContent (Results/Status)
// ---------------------------------------------------------------------------

interface GoogleTranslateBottomContentProps {
  state: GoogleTranslationState
  targetLang: ToTranslateLanguage
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
}

const GoogleTranslateBottomContent = memo(
  ({ state, targetLang, km_map, maybeColorMode }: GoogleTranslateBottomContentProps) => {
    if (state.t === 'idle') return null

    // We construct the error object here, inside the child render.
    // This prevents the parent from re-rendering just to create an object literal.
    if (state.t === 'error') {
      return <Alert color="danger" description={state.description} title={state.title} />
    }

    if (state.t === 'loading') return LoadingStatus

    // Success Case
    const { result } = state

    return (
      <div className="flex flex-col gap-3 pt-2">
        <ResultDisplay km_map={km_map} maybeColorMode={maybeColorMode} result={result} targetLang={targetLang} />
      </div>
    )
  },
)

GoogleTranslateBottomContent.displayName = 'GoogleTranslateBottomContent'

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface GoogleTranslateTextareaProps extends Pick<
  TextAreaProps,
  'classNames' | 'labelPlacement' | 'maxRows' | 'minRows' | 'placeholder' | 'variant' | 'onValueChange'
> {
  defaultTargetLang: ToTranslateLanguage
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
  value: string
  value_nonEmptyTrimmed: NonEmptyStringTrimmed | undefined
  // onValueChange: (value: string) => void
}

export const GoogleTranslateTextarea: React.FC<GoogleTranslateTextareaProps> = ({
  value,
  value_nonEmptyTrimmed,
  onValueChange,
  defaultTargetLang,
  km_map,
  maybeColorMode,
  classNames,
  ...props
}) => {
  const [targetLang, setTargetLang] = useState<ToTranslateLanguage>(defaultTargetLang)

  const { state, performTranslate, clearResult } = useGoogleTranslation(value_nonEmptyTrimmed, 'auto', targetLang)

  // Clear result when input changes
  useEffect(() => {
    if (state.t === 'success') clearResult()
  }, [value, clearResult, state.t])

  // Memoize styles to prevent unnecessary prop updates to Textarea
  const memoizedClassNames = useMemo(
    () => ({
      ...classNames,
      inputWrapper: 'pb-2',
    }),
    [classNames],
  )

  // Memoize EndContent to avoid re-rendering Textarea's internal slots unnecessarily
  const endContent = useMemo(
    () => (
      <GoogleTranslateEndContent
        loading={state.t === 'loading'}
        targetLang={targetLang}
        value={value_nonEmptyTrimmed}
        onTargetLangChange={setTargetLang}
        onTranslate={performTranslate}
      />
    ),
    [state.t, targetLang, value_nonEmptyTrimmed, performTranslate],
  )

  return (
    <>
      <Textarea
        classNames={memoizedClassNames}
        endContent={endContent}
        value={value}
        onValueChange={onValueChange}
        {...props}
      />
      <GoogleTranslateBottomContent
        km_map={km_map}
        maybeColorMode={maybeColorMode}
        state={state}
        targetLang={targetLang}
      />
    </>
  )
}
