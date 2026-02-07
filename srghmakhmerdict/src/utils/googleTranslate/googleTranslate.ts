import { fetch } from '@tauri-apps/plugin-http'

import {
  nonEmptyString_afterTrim,
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { FromTranslateLanguage } from './fromTranslateLanguage'
import type { ToTranslateLanguage } from './toTranslateLanguage'
import { Except_error, Except_ok, type Except } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/types'

///////////////
export interface TranslateResultSuccess {
  text: NonEmptyStringTrimmed
  transliteration?: NonEmptyStringTrimmed
  src: NonEmptyStringTrimmed
}

export interface TranslateResultError {
  status: number
  statusText: string
}

export async function translate(
  inputText: NonEmptyStringTrimmed,
  from: FromTranslateLanguage,
  to: ToTranslateLanguage,
): Promise<Except<TranslateResultError, TranslateResultSuccess>> {
  // Google Translate API Endpoint (Single request mode)
  // client=at is what the referenced library uses.
  // dt=t (text), dt=rm (romanization/translit), dj=1 (json format)
  const url = 'https://translate.google.com/translate_a/single?client=at&dt=t&dt=rm&dj=1'

  const params = new URLSearchParams()

  params.append('sl', from)
  params.append('tl', to)
  params.append('q', inputText)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      // Generic User Agent
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: params.toString(),
  })

  if (!response.ok) return Except_error(response)

  interface GoogleTranslateResponse {
    sentences?: Array<{
      trans?: string
      orig?: string
      translit?: string
      src_translit?: string
    }>
    src?: string
    spell?: any
  }

  const data = (await response.json()) as GoogleTranslateResponse

  // console.log('translated', data)

  // Parse the dj=1 format
  let translatedText = ''
  let transliteration = ''

  if (data.sentences) {
    data.sentences.forEach(s => {
      if (s.trans) {
        translatedText += s.trans
      }
      if (s.translit) {
        transliteration += s.translit
      }
    })
  }

  return Except_ok({
    text: nonEmptyString_afterTrim(translatedText),
    transliteration: String_toNonEmptyString_orUndefined_afterTrim(transliteration),
    src: nonEmptyString_afterTrim(data.src || from),
  })
}
