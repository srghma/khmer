import React, { useEffect, useState, useCallback, useMemo, type ChangeEvent } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/react'
import { Select, SelectItem } from '@heroui/react'
import { Button } from '@heroui/react'
import { SiGoogletranslate } from 'react-icons/si'
import { HiTranslate } from 'react-icons/hi'
import {
  memoizeAsync3_LRU_cachePromise,
  memoizeAsync3_LRU_cachePromise__default_keyMaker,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'

import {
  stringToToTranslateLanguageOrThrow,
  TO_LANGUAGES,
  translate,
  type ToTranslateLanguage,
  type TranslateResult,
} from '../utils/googleTranslate'
import { executeNativeTts } from '../utils/tts'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../db/dict'
import { type MaybeColorizationMode } from '../utils/text-processing/utils'
import { colorizeHtml } from '../utils/text-processing/html'

interface GoogleTranslateProps {
  text: string
  defaultTarget?: ToTranslateLanguage
  className?: string
  colorMode: MaybeColorizationMode
  km_map: KhmerWordsMap | undefined
}

const SpeakStartContent = <span>🔊</span>
const TranslateIcon = <HiTranslate className="text-lg" />

const cachedTranslate = memoizeAsync3_LRU_cachePromise(translate, memoizeAsync3_LRU_cachePromise__default_keyMaker, 40)

const GoogleTranslateImpl: React.FC<GoogleTranslateProps> = ({
  text,
  defaultTarget = 'km',
  className,
  colorMode,
  km_map,
}) => {
  const [targetLang, setTargetLang] = useState(defaultTarget)
  const [result, setResult] = useState<TranslateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset result if input text changes to avoid confusion
  useEffect(() => {
    setResult(null)
    setError(null)
  }, [text])

  const handleTranslate = useCallback(async () => {
    const inputText = String_toNonEmptyString_orUndefined_afterTrim(text)

    if (!inputText) return

    setLoading(true)
    setError(null)

    try {
      const res = await cachedTranslate(inputText, 'auto', targetLang)

      setResult(res)
    } catch (err: any) {
      const msg = err.message || ''

      if (msg.includes('429') || msg.includes('Too Many Requests')) {
        setError('Daily limit exceeded (429). Please wait a while.')
      } else {
        setError(`Translation failed. ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }, [text, targetLang])

  const handleSpeak = () => {
    if (result?.text) {
      executeNativeTts(result.text, targetLang)
    }
  }

  const selectedKeys = useMemo(() => [targetLang], [targetLang])
  const selectOnChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => setTargetLang(stringToToTranslateLanguageOrThrow(e.target.value)),
    [],
  )

  // Calculate Colorized HTML for the RESULT if target is Khmer
  const resultHtml = useMemo(() => {
    if (!result?.text) return null
    if (targetLang !== 'km' || colorMode === 'none' || !km_map) return { __html: result.text }

    return { __html: colorizeHtml(result.text, colorMode, km_map) }
  }, [result?.text, targetLang, colorMode, km_map])

  return (
    <Card className={`w-full shrink-0 ${className || ''}`}>
      <CardHeader className="flex justify-between items-center pb-0 gap-2">
        <div className="flex items-center gap-2 text-default-500 shrink-0">
          <SiGoogletranslate />
          <span className="text-small font-bold hidden sm:block">Google Translate</span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <Select
            isRequired
            aria-label="Target Language"
            className="w-32"
            selectedKeys={selectedKeys}
            size="sm"
            onChange={selectOnChange}
          >
            {TO_LANGUAGES.map(x => (
              <SelectItem key={x.code}>{x.name}</SelectItem>
            ))}
          </Select>

          <Button
            isIconOnly
            className="shrink-0"
            color="primary"
            isLoading={loading}
            size="sm"
            variant="flat"
            onPress={handleTranslate}
          >
            {!loading && TranslateIcon}
          </Button>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        <div className="flex flex-col gap-3">
          {error ? (
            <div className="text-danger text-small">{error}</div>
          ) : result ? (
            <div className="bg-default-100 rounded-medium p-3 animate-in fade-in duration-200">
              {resultHtml ? (
                <div
                  dangerouslySetInnerHTML={resultHtml}
                  className="font-medium text-medium font-khmer leading-relaxed"
                />
              ) : (
                <div className="font-medium text-medium">{result.text}</div>
              )}

              {result.transliteration && (
                <div className="text-small text-default-500 font-mono mt-1">{result.transliteration}</div>
              )}

              <div className="flex justify-end mt-2">
                <Button size="sm" startContent={SpeakStartContent} variant="light" onPress={handleSpeak}>
                  Speak
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}

export const GoogleTranslate = React.memo(GoogleTranslateImpl)
