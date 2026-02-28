import {
  Record_toNonEmptyRecord_orUndefined,
  type NonEmptyRecord,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const getNEStringProp = (obj: Record<string, unknown>, key: string): NonEmptyStringTrimmed | undefined => {
  const value = key in obj ? obj[key] : undefined

  if (typeof value !== 'string') return undefined

  return String_toNonEmptyString_orUndefined_afterTrim(value)
}

const partitionRecordOnMessageAndCode = (
  obj: Record<string, unknown>,
): {
  message: NonEmptyStringTrimmed | undefined
  code: NonEmptyStringTrimmed | undefined
  otherThanMessageAndCode: NonEmptyRecord<string, unknown> | undefined
} => {
  const message = getNEStringProp(obj, 'message')
  const code = getNEStringProp(obj, 'code')
  const otherThanMessageAndCode: Record<string, unknown> = {}

  for (const key in obj) {
    if (key === 'message' && message !== undefined) continue
    if (key === 'code' && code !== undefined) continue
    otherThanMessageAndCode[key] = obj[key]
  }

  return {
    message,
    code,
    otherThanMessageAndCode: Record_toNonEmptyRecord_orUndefined(otherThanMessageAndCode),
  }
}

export function unknown_to_errorMessage(error: unknown): NonEmptyStringTrimmed | undefined {
  console.error(error)

  return (
    (() => {
      if (!(error instanceof Error)) return undefined

      return String_toNonEmptyString_orUndefined_afterTrim(error.message)
    })() ||
    (() => {
      if (!isRecord(error)) return undefined

      const { message, code, otherThanMessageAndCode } = partitionRecordOnMessageAndCode(error)

      const output = [
        code ? `Code: ${code}` : '',
        message ? `Message: ${message}` : '',
        otherThanMessageAndCode ? `Other: ${JSON.stringify(otherThanMessageAndCode)}` : '',
      ].filter(Boolean)

      return String_toNonEmptyString_orUndefined_afterTrim(output.join('; '))
    })() ||
    String_toNonEmptyString_orUndefined_afterTrim(JSON.stringify(error))
  )
}
