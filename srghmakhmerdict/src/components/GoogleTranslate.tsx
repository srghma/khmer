import React, { useEffect, useState, useCallback, useMemo, type ChangeEvent } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Select, SelectItem } from '@heroui/select'
import { Button } from '@heroui/button'
import { Spinner } from '@heroui/spinner'
import { SiGoogletranslate } from 'react-icons/si'
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

interface GoogleTranslateProps {
  text: string
  defaultTarget?: ToTranslateLanguage
  className?: string
}

const SpeakStartContent = <span>🔊</span>

// Define this OUTSIDE the component to share the cache globally
// Max Size 40
const cachedTranslate = memoizeAsync3_LRU_cachePromise(translate, memoizeAsync3_LRU_cachePromise__default_keyMaker, 40)

const GoogleTranslateImpl: React.FC<GoogleTranslateProps> = ({ text, defaultTarget = 'km', className }) => {
  const [targetLang, setTargetLang] = useState(defaultTarget)
  const [result, setResult] = useState<TranslateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local state for debouncing
  const [debouncedText, setDebouncedText] = useState(text)

  // 1. Debounce logic: Wait 1000ms after user stops typing before updating debouncedText
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(text)
    }, 1000)

    return () => {
      clearTimeout(handler)
    }
  }, [text])

  // 2. The actual API call function
  const doTranslate = useCallback(async (inputText: string, target: ToTranslateLanguage) => {
    if (!inputText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await cachedTranslate(inputText, 'auto', target)

      setResult(res)
    } catch (err: any) {
      const msg = err.message || ''

      // Better error handling for rate limits
      if (msg.includes('429') || msg.includes('Too Many Requests')) {
        setError('Daily limit exceeded (429). Please wait a while.')
      } else {
        setError(`Translation failed. ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 3. Trigger translation only when DEBOUNCED text changes
  useEffect(() => {
    doTranslate(debouncedText, targetLang)
  }, [debouncedText, targetLang, doTranslate])

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

  return (
    // Added shrink-0 to prevent flex compression
    <Card className={`w-full shrink-0 ${className || ''}`}>
      <CardHeader className="flex justify-between items-center pb-0">
        <div className="flex items-center gap-2 text-default-500">
          <SiGoogletranslate />
          <span className="text-small font-bold">Google Translate</span>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : error ? (
            <div className="text-danger text-small">{error}</div>
          ) : result ? (
            <div className="bg-default-100 rounded-medium p-3">
              <div className="font-medium text-medium">{result.text}</div>

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
