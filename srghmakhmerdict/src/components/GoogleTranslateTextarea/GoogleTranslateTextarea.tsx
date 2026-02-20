import { useEffect, useMemo, memo, useCallback } from 'react'
import { Textarea, type TextAreaProps } from '@heroui/input'
import { Button, ButtonGroup } from '@heroui/button'
import { HiTranslate } from 'react-icons/hi'
import { HiArrowsRightLeft } from 'react-icons/hi2'

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
import { useSmartTargetLanguage } from './useSmartTargetLanguage'

// ---------------------------------------------------------------------------
// Sub-Component: Toolbar
// ---------------------------------------------------------------------------

interface GoogleTranslateToolbarProps {
  value: NonEmptyStringTrimmed | undefined
  loading: boolean
  targetLang: ToTranslateLanguage
  onTargetLangChange: (lang: ToTranslateLanguage) => void
  onTranslate: () => void
  onSwap: (() => void) | undefined
}

const GoogleTranslateToolbar = memo(function GoogleTranslateToolbar({
  value,
  loading,
  targetLang,
  onTargetLangChange,
  onTranslate,
  onSwap,
}: GoogleTranslateToolbarProps) {
  const inputMode = useMemo(() => (value ? detectModeFromText(value) : undefined) ?? 'km', [value])

  const translateButtonIsDisabled = !value || loading

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      {/* Left: Speech Actions */}
      <div className="flex items-center gap-1">
        <NativeSpeechAction mode={map_DictionaryLanguage_to_BCP47LanguageTagName[inputMode]} word={value} />
        <GoogleSpeechAction mode={inputMode} word={value} />
        <span className="text-tiny uppercase text-default-400 font-bold ml-1 tracking-wider">{inputMode}</span>

        {/* Swap Button */}
        {onSwap && (
          <Button
            isIconOnly
            className="ml-2 text-default-400 hover:text-primary"
            size="sm"
            title="Swap text and languages"
            variant="light"
            onPress={onSwap}
          >
            <HiArrowsRightLeft className="text-lg" />
          </Button>
        )}
      </div>

      {/* Right: Language + Translate button */}
      <div className="flex items-center gap-2 max-w-full sm:max-w-[50%]">
        <ButtonGroup className="shadow-sm" color="primary" size="sm" variant="flat">
          <Button
            className="font-bold px-4"
            isDisabled={translateButtonIsDisabled}
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
})

GoogleTranslateToolbar.displayName = 'GoogleTranslateToolbar'

// ---------------------------------------------------------------------------
// Sub-Component: BottomContent
// ---------------------------------------------------------------------------

interface GoogleTranslateBottomContentProps {
  state: GoogleTranslationState
  targetLang: ToTranslateLanguage
  maybeColorMode: MaybeColorizationMode
}

const GoogleTranslateBottomContent = memo(function GoogleTranslateBottomContent({
  state,
  targetLang,
  maybeColorMode,
}: GoogleTranslateBottomContentProps) {
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
      <ResultDisplay
        dictionaryMode_lonelyWordShouldBeSpilt={false}
        maybeColorMode={maybeColorMode}
        result={state.result}
        targetLang={targetLang}
      />
    </div>
  )
})

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

export const GoogleTranslateTextarea = memo(function GoogleTranslateTextarea({
  value_toShowInTextArea,
  value_toShowInBottom,
  onValueChange,
  defaultTargetLang,
  maybeColorMode,
  classNames,
  ...props
}: GoogleTranslateTextareaProps) {
  // Use the new smart hook
  const [targetLang, setTargetLang] = useSmartTargetLanguage(value_toShowInTextArea, defaultTargetLang)

  const { state, performTranslate, clearResult } = useGoogleTranslation(value_toShowInBottom, 'auto', targetLang)

  const handleSwap = useCallback(() => {
    if (state.t !== 'success' || !state.result.text) return

    const newText = state.result.text
    const currentSource = value_toShowInBottom ? detectModeFromText(value_toShowInBottom) : 'en'

    // 1. Update text
    onValueChange?.(newText)

    // 2. Update target lang (this counts as a manual override/explicit setting)
    if (currentSource) {
      setTargetLang(currentSource as ToTranslateLanguage)
    }
  }, [state, value_toShowInBottom, onValueChange, setTargetLang])

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
      <Textarea
        classNames={memoizedClassNames}
        minRows={3}
        value={value_toShowInTextArea}
        onValueChange={onValueChange}
        {...props}
      />

      <div className="bg-content2/50 p-2 border-t border-divider/50">
        <GoogleTranslateToolbar
          loading={state.t === 'loading'}
          targetLang={targetLang}
          value={value_toShowInBottom}
          onSwap={state.t === 'success' ? handleSwap : undefined}
          onTargetLangChange={setTargetLang} // hook handles the manual override logic
          onTranslate={performTranslate}
        />
      </div>

      <div className="px-4 pb-4">
        <GoogleTranslateBottomContent maybeColorMode={maybeColorMode} state={state} targetLang={targetLang} />
      </div>
    </div>
  )
})
