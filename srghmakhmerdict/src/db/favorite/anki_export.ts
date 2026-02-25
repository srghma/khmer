import { Array_groupBy } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/array'
import { getUserDb } from '../core'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

const printLine = ({
  word,
  additional_html_front,
  additional_html_back,
}: {
  word: string
  additional_html_front: string | null
  additional_html_back: string | null
}) => `${word}\t${additional_html_front ?? ''}\t${additional_html_back ?? ''}`

export async function getAnkiExportData(): Promise<NonEmptyStringTrimmed | undefined> {
  const db = await getUserDb()
  // User asked for 1 word on each line, trimmed. Exporting just the word.
  // We can export words from all languages together, separated by newlines.
  const rows = await db.select<
    { word: string; lang: string; additional_html_front: string | null; additional_html_back: string | null }[]
  >('SELECT word, lang, additional_html_front, additional_html_back FROM favorites ORDER BY timestamp DESC')

  const groupedByLang = Array_groupBy(rows, x => x.lang)

  const groupedByLang_: Record<string, string> = Object.fromEntries(
    Object.entries(groupedByLang).map(([lang, rows]) => [lang, rows.map(r => printLine(r)).join('\n')]),
  )

  // key is header
  const printed = Object.entries(groupedByLang_)
    .map(([lang, rows]) => `${lang}\n\n${rows}`)
    .join('\n\n')

  return String_toNonEmptyString_orUndefined_afterTrim(printed)
}
