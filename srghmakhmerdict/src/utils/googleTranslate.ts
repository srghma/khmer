import { fetch } from '@tauri-apps/plugin-http'
import {
  isEnumValue,
  stringToEnumOrUndefined,
  stringToEnumOrThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'
import {
  nonEmptyString_afterTrim,
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// ==========================================
// To
// ==========================================

export const TO_TRANSLATE_LANGUAGES = ['en', 'km', 'ru', 'fr', 'th', 'zh-CN'] as const

export type ToTranslateLanguage = (typeof TO_TRANSLATE_LANGUAGES)[number]

export function isToTranslateLanguage(value: string): value is ToTranslateLanguage {
  return isEnumValue(value, TO_TRANSLATE_LANGUAGES)
}

export function stringToToTranslateLanguageOrUndefined(value: string): ToTranslateLanguage | undefined {
  return stringToEnumOrUndefined(value, TO_TRANSLATE_LANGUAGES)
}

export function stringToToTranslateLanguageOrThrow(value: string): ToTranslateLanguage {
  return stringToEnumOrThrow(value, TO_TRANSLATE_LANGUAGES, 'ToTranslateLanguage')
}

export const ToTranslateLanguageName: Record<ToTranslateLanguage, NonEmptyStringTrimmed> = {
  km: 'Khmer',
  en: 'English',
  ru: 'Russian',
  fr: 'French',
  th: 'Thai',
  'zh-CN': 'Chinese',
} as any

export const TO_LANGUAGES: { code: ToTranslateLanguage; name: NonEmptyStringTrimmed }[] = TO_TRANSLATE_LANGUAGES.map(
  x => ({ code: x, name: ToTranslateLanguageName[x] }),
)

// ==========================================
// From
// ==========================================

export const FROM_TRANSLATE_LANGUAGES = ['en', 'km', 'ru', 'fr', 'th', 'zh-CN', 'auto'] as const

export type FromTranslateLanguage = (typeof FROM_TRANSLATE_LANGUAGES)[number]

export function isFromTranslateLanguage(value: string): value is FromTranslateLanguage {
  return isEnumValue(value, FROM_TRANSLATE_LANGUAGES)
}

export function stringFromFromTranslateLanguageOrUndefined(value: string): FromTranslateLanguage | undefined {
  return stringToEnumOrUndefined(value, FROM_TRANSLATE_LANGUAGES)
}

export function stringFromFromTranslateLanguageOrThrow(value: string): FromTranslateLanguage {
  return stringToEnumOrThrow(value, FROM_TRANSLATE_LANGUAGES, 'FromTranslateLanguage')
}

export const FromTranslateLanguageName: Record<FromTranslateLanguage, NonEmptyStringTrimmed> = {
  ...ToTranslateLanguageName,
  auto: 'Auto',
} as any

///////////////
export interface TranslateResult {
  text: NonEmptyStringTrimmed
  transliteration?: NonEmptyStringTrimmed
  src: NonEmptyStringTrimmed
}

export async function translate(
  inputText: NonEmptyStringTrimmed,
  from: FromTranslateLanguage,
  to: ToTranslateLanguage,
): Promise<TranslateResult> {
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

  if (!response.ok) {
    throw new Error(`Google Translate API Error: ${response.status} ${response.statusText}`)
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

  return {
    text: nonEmptyString_afterTrim(translatedText),
    transliteration: String_toNonEmptyString_orUndefined_afterTrim(transliteration),
    src: nonEmptyString_afterTrim(data.src || from),
  }
}

// --- Internal Types for the JSON response ---

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
