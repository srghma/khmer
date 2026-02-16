import React, { useState, useEffect, useMemo, memo } from 'react'
import { Textarea, type TextAreaProps } from '@heroui/input'
import { Button, ButtonGroup } from '@heroui/button'
import { HiTranslate } from 'react-icons/hi'

import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { detectModeFromText } from '../../utils/detectModeFromText'

import { LanguageSelector, LoadingStatus, ResultDisplay } from './components'
import { useGoogleTranslation, type GoogleTranslationState } from '../../hooks/useGoogleTranslation'
import { GoogleSpeechAction } from '../DetailView/Tooltips/GoogleSpeechAction'
import { NativeSpeechAction } from '../DetailView/Tooltips/NativeSpeechAction'
import { Alert } from '@heroui/alert'
import type { ToTranslateLanguage } from '../../utils/googleTranslate/toTranslateLanguage'
import { map_DictionaryLanguage_to_BCP47LanguageTagName } from '../../utils/my-bcp-47'

// ---------------------------------------------------------------------------
// Sub-Component: Toolbar
// ---------------------------------------------------------------------------

interface GoogleTranslateToolbarProps {
  value: NonEmptyStringTrimmed | undefined
  loading: boolean
  targetLang: ToTranslateLanguage
  onTargetLangChange: (lang: ToTranslateLanguage) => void
  onTranslate: () => void
}

const GoogleTranslateToolbar = memo(
  ({ value, loading, targetLang, onTargetLangChange, onTranslate }: GoogleTranslateToolbarProps) => {
    const inputMode = useMemo(() => (value ? detectModeFromText(value) : undefined) ?? 'km', [value])

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Left: Speech Actions */}
        <div className="flex items-center gap-1">
          <NativeSpeechAction mode={map_DictionaryLanguage_to_BCP47LanguageTagName[inputMode]} word={value} />
          <GoogleSpeechAction mode={inputMode} word={value} />
          <span className="text-tiny uppercase text-default-400 font-bold ml-1 tracking-wider">{inputMode}</span>
        </div>

        {/* Right: Language + Translate button */}
        <div className="flex items-center gap-2 max-w-full sm:max-w-[50%]">
          <ButtonGroup className="shadow-sm" color="primary" size="sm" variant="flat">
            <Button
              className="font-bold px-4"
              isLoading={loading}
              startContent={!loading && <HiTranslate className="text-lg" />}
              onPress={onTranslate}
            >
              Translate to
            </Button>
            <LanguageSelector targetLang={targetLang} onSelect={onTargetLangChange} />
          </ButtonGroup>
        </div>
      </div>
    )
  },
)

GoogleTranslateToolbar.displayName = 'GoogleTranslateToolbar'

// ---------------------------------------------------------------------------
// Sub-Component: BottomContent
// ---------------------------------------------------------------------------

interface GoogleTranslateBottomContentProps {
  state: GoogleTranslationState
  targetLang: ToTranslateLanguage
  maybeColorMode: MaybeColorizationMode
}

const GoogleTranslateBottomContent = memo(
  ({ state, targetLang, maybeColorMode }: GoogleTranslateBottomContentProps) => {
    if (state.t === 'idle') return null

    if (state.t === 'error') {
      return (
        <div className="pt-4">
          <Alert color="danger" description={state.description} title={state.title} variant="flat" />
        </div>
      )
    }

    if (state.t === 'loading') return <div className="pt-4">{LoadingStatus}</div>

    return (
      <div className="flex flex-col gap-3 pt-4 border-t border-divider mt-2">
        <div className="text-tiny font-bold text-default-400 uppercase tracking-widest px-1">Translation</div>
        <ResultDisplay maybeColorMode={maybeColorMode} result={state.result} targetLang={targetLang} />
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
  maybeColorMode: MaybeColorizationMode
  value_toShowInTextArea: string
  value_toShowInBottom: NonEmptyStringTrimmed | undefined
}

export const GoogleTranslateTextarea: React.FC<GoogleTranslateTextareaProps> = ({
  value_toShowInTextArea,
  value_toShowInBottom,
  onValueChange,
  defaultTargetLang,
  maybeColorMode,
  classNames,
  ...props
}) => {
  const [targetLang, setTargetLang] = useState<ToTranslateLanguage>(defaultTargetLang)
  const { state, performTranslate, clearResult } = useGoogleTranslation(value_toShowInBottom, 'auto', targetLang)

  useEffect(() => {
    clearResult()
  }, [value_toShowInTextArea, clearResult])

  const memoizedClassNames = useMemo(
    () => ({
      ...classNames,
      input: 'text-lg font-khmer leading-relaxed p-4',
      inputWrapper: 'bg-content2/50 hover:bg-content2 shadow-none border-divider border-b-0 rounded-b-none p-0',
    }),
    [classNames],
  )

  return (
    <div className="flex flex-col w-full bg-content1 rounded-xl shadow-sm border border-divider overflow-hidden">
      {/* Input Area */}
      <Textarea
        classNames={memoizedClassNames}
        minRows={3}
        value={value_toShowInTextArea}
        onValueChange={onValueChange}
        {...props}
      />

      {/* Toolbar Area */}
      <div className="bg-content2/50 p-2 border-t border-divider/50">
        <GoogleTranslateToolbar
          loading={state.t === 'loading'}
          targetLang={targetLang}
          value={value_toShowInBottom}
          onTargetLangChange={setTargetLang}
          onTranslate={performTranslate}
        />
      </div>

      {/* Translation Result Area */}
      <div className="px-4 pb-4">
        <GoogleTranslateBottomContent maybeColorMode={maybeColorMode} state={state} targetLang={targetLang} />
      </div>
    </div>
  )
}
