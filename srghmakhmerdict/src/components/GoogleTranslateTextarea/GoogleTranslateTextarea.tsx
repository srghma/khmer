import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Textarea, type TextAreaProps } from '@heroui/input'
import { Button, ButtonGroup } from '@heroui/button'
import { HiTranslate } from 'react-icons/hi'

import type { ToTranslateLanguage } from '../../utils/googleTranslate'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import type { KhmerWordsMap } from '../../db/dict'

import { useGoogleTranslation, useTtsHandlers } from './hooks'
import { LanguageSelector, SpeakButtons, ResultDisplay, StatusDisplay } from './components'

interface GoogleTranslateTextareaProps extends TextAreaProps {
  defaultTargetLang: ToTranslateLanguage
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
}

export const GoogleTranslateTextarea: React.FC<GoogleTranslateTextareaProps> = ({
  value,
  onValueChange,
  defaultTargetLang,
  km_map,
  maybeColorMode,
  classNames,
  ...props
}) => {
  const [targetLang, setTargetLang] = useState<ToTranslateLanguage>(defaultTargetLang)

  // Custom Hooks
  const { loading, error, result, performTranslate, clearResult } = useGoogleTranslation(
    typeof value === 'string' ? value : undefined,
    targetLang,
  )

  const { handleSpeakNative, handleSpeakGoogle } = useTtsHandlers()

  // Reset result when input changes
  useEffect(() => {
    if (result) clearResult()
  }, [value, clearResult]) // 'result' in dep array ensures we only clear if exists, prevent loops

  // Handlers for Input Text Speaking
  const onSpeakInputNative = useCallback(() => {
    if (typeof value === 'string' && value.trim().length > 0) {
      handleSpeakNative(value, 'km') // Assuming input is Khmer or Auto
    }
  }, [value, handleSpeakNative])

  const onSpeakInputGoogle = useCallback(() => {
    if (typeof value === 'string' && value.trim().length > 0) {
      handleSpeakGoogle(value, 'km')
    }
  }, [value, handleSpeakGoogle])

  // Handlers for Result Text Speaking
  const onSpeakResultNative = useCallback(() => {
    if (result?.text) {
      handleSpeakNative(result.text, targetLang)
    }
  }, [result, targetLang, handleSpeakNative])

  const onSpeakResultGoogle = useCallback(() => {
    if (result?.text) {
      handleSpeakGoogle(result.text, targetLang)
    }
  }, [result, targetLang, handleSpeakGoogle])

  // Memoize bottom toolbar content
  const endContent = useMemo(
    () => (
      <div className="flex justify-between items-center gap-2">
        {/* Left: Input Speak Actions */}
        <SpeakButtons onSpeakGoogle={onSpeakInputGoogle} onSpeakNative={onSpeakInputNative} />

        {/* Right: Translate Action */}
        <ButtonGroup color="primary" size="sm" variant="flat">
          <Button
            className="font-semibold"
            isLoading={loading}
            startContent={!loading && <HiTranslate />}
            onPress={performTranslate}
          >
            Translate
          </Button>
          <LanguageSelector targetLang={targetLang} onSelect={setTargetLang} />
        </ButtonGroup>
      </div>
    ),
    [loading, targetLang, onSpeakInputNative, onSpeakInputGoogle, performTranslate],
  )
  const bottomContent = useMemo(
    () => (
      <div className="flex flex-col gap-3 pt-2">
        <StatusDisplay error={error} loading={loading} />

        {result && !loading && !error && (
          <ResultDisplay
            km_map={km_map}
            maybeColorMode={maybeColorMode}
            result={result}
            targetLang={targetLang}
            onSpeakGoogle={onSpeakResultGoogle}
            onSpeakNative={onSpeakResultNative}
          />
        )}
      </div>
    ),
    [result, error, loading, targetLang, km_map, maybeColorMode, result, onSpeakResultNative, onSpeakResultGoogle],
  )

  // Memoize styles
  const memoizedClassNames = useMemo(
    () => ({
      ...classNames,
      inputWrapper: 'pb-2',
    }),
    [classNames],
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
      {bottomContent}
    </>
  )
}
