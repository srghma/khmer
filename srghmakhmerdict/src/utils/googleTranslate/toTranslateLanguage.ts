import {
  stringToEnumOrUndefinedUsingCustomChecker,
  stringToEnumOrThrowUsingCustomChecker,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Record_invertValuesToKeys_preferSmallestValue } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/record'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'

// ==========================================
// To
// ==========================================

// from https://github.com/DarinRowe/googletrans/blob/master/src/languages.ts
const ToTranslateLanguage_codeNameRecord_impl = {
  // af: 'Afrikaans',
  // sq: 'Albanian',
  // am: 'Amharic',
  // ar: 'Arabic',
  // hy: 'Armenian',
  // as: 'Assamese',
  // ay: 'Aymara',
  // az: 'Azerbaijani',
  // bm: 'Bambara',
  // eu: 'Basque',
  // be: 'Belarusian',
  // bn: 'Bengali',
  // bho: 'Bhojpuri',
  // bs: 'Bosnian',
  // bg: 'Bulgarian',
  // ca: 'Catalan',
  // ceb: 'Cebuano',
  // ny: 'Chichewa',
  // zh: 'Chinese (Simplified)',
  // 'zh-cn': 'Chinese (Simplified)',
  // 'zh-sg': 'Chinese (Simplified)',
  // 'zh-tw': 'Chinese (Traditional)',
  // 'zh-hk': 'Chinese (Traditional)',
  // co: 'Corsican',
  // hr: 'Croatian',
  // cs: 'Czech',
  // da: 'Danish',
  // dv: 'Dhivehi',
  // doi: 'Dogri',
  // nl: 'Dutch',
  en: 'English',
  // eo: 'Esperanto',
  // et: 'Estonian',
  // tl: 'Filipino',
  // ee: 'Ewe',
  // fi: 'Finnish',
  // fr: 'French',
  // fy: 'Frisian',
  // gl: 'Galician',
  // ka: 'Georgian',
  // de: 'German',
  // el: 'Greek',
  // gn: 'Guarani',
  // gu: 'Gujarati',
  // ht: 'Haitian Creole',
  // ha: 'Hausa',
  // haw: 'Hawaiian',
  // he: 'Hebrew',
  // iw: 'Hebrew',
  // hi: 'Hindi',
  // hmn: 'Hmong',
  // hu: 'Hungarian',
  // is: 'Icelandic',
  // ig: 'Igbo',
  // ilo: 'Ilocano',
  // id: 'Indonesian',
  // ga: 'Irish',
  // it: 'Italian',
  // ja: 'Japanese',
  // jw: 'Javanese',
  // kn: 'Kannada',
  // kk: 'Kazakh',
  km: 'Khmer',
  // rw: 'Kinyarwanda',
  // gom: 'Konkani',
  // ko: 'Korean',
  // ku: 'Kurdish (Kurmanji)',
  // kri: 'Krio',
  // ckb: 'Kurdish (Sorani)',
  // ky: 'Kyrgyz',
  // lo: 'Lao',
  // la: 'Latin',
  // lv: 'Latvian',
  // ln: 'Lingala',
  // lt: 'Lithuanian',
  // lg: 'Luganda',
  // lb: 'Luxembourgish',
  // mk: 'Macedonian',
  // mai: 'Maithili',
  // mg: 'Malagasy',
  // ms: 'Malay',
  // ml: 'Malayalam',
  // mt: 'Maltese',
  // mi: 'Maori',
  // mr: 'Marathi',
  // lus: 'Mizo',
  // mn: 'Mongolian',
  // my: 'Myanmar (Burmese)',
  // ne: 'Nepali',
  // no: 'Norwegian',
  // or: 'Odia (Oriya)',
  // om: 'Oromo',
  // ps: 'Pashto',
  // fa: 'Persian',
  // pl: 'Polish',
  // pt: 'Portuguese',
  // pa: 'Punjabi (Gurmukhi)',
  // qu: 'Quechua',
  // ro: 'Romanian',
  ru: 'Russian',
  // sm: 'Samoan',
  // sa: 'Sanskrit',
  // gd: 'Scots Gaelic',
  // nso: 'Sepedi',
  // sr: 'Serbian',
  // st: 'Sesotho',
  // sn: 'Shona',
  // sd: 'Sindhi',
  // si: 'Sinhala',
  // sk: 'Slovak',
  // sl: 'Slovenian',
  // so: 'Somali',
  // es: 'Spanish',
  // su: 'Sundanese',
  // sw: 'Swahili',
  // sv: 'Swedish',
  // tg: 'Tajik',
  // ta: 'Tamil',
  // tt: 'Tatar',
  // te: 'Telugu',
  // th: 'Thai',
  // ti: 'Tigrinya',
  // ts: 'Tsonga',
  // tr: 'Turkish',
  // tk: 'Turkmen',
  // ak: 'Twi',
  uk: 'Ukrainian',
  // ur: 'Urdu',
  // ug: 'Uyghur',
  // uz: 'Uzbek',
  // vi: 'Vietnamese',
  // cy: 'Welsh',
  // xh: 'Xhosa',
  // yi: 'Yiddish',
  // yo: 'Yoruba',
  // zu: 'Zulu',
  // fil: 'Filipino',
} as const

export type ToTranslateLanguage = keyof typeof ToTranslateLanguage_codeNameRecord_impl

export const ToTranslateLanguage_codeNameRecord = ToTranslateLanguage_codeNameRecord_impl as NonEmptyRecord<
  ToTranslateLanguage,
  NonEmptyStringTrimmed
>

export function isToTranslateLanguage(value: string): value is ToTranslateLanguage {
  return value in ToTranslateLanguage_codeNameRecord
}

export function stringToToTranslateLanguageOrUndefined(value: string): ToTranslateLanguage | undefined {
  return stringToEnumOrUndefinedUsingCustomChecker(value, isToTranslateLanguage)
}

export function stringToToTranslateLanguageOrThrow(value: string): ToTranslateLanguage {
  return stringToEnumOrThrowUsingCustomChecker(value, isToTranslateLanguage, 'ToTranslateLanguage')
}

/**
 * @deprecated prefer ToTranslateLanguage_codeNameRecord
 */
export const ToTranslateLanguage_nameCodeRecord: NonEmptyRecord<NonEmptyStringTrimmed, ToTranslateLanguage> =
  Record_invertValuesToKeys_preferSmallestValue(ToTranslateLanguage_codeNameRecord) as any
