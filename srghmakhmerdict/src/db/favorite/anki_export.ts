import { stringify } from 'csv-stringify/sync'
import { Array_groupBy } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/array'
import { getUserDb } from '../core'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export async function getAnkiExportData(): Promise<NonEmptyStringTrimmed | undefined> {
  const db = await getUserDb()
  // User asked for 1 word on each line, trimmed. Exporting just the word.
  // We can export words from all languages together, separated by newlines.
  const rows = await db.select<
    { word: string; language: string; additional_html_front: string | null; additional_html_back: string | null }[]
  >('SELECT word, language, additional_html_front, additional_html_back FROM favorites ORDER BY timestamp DESC')

  const groupedByLang = Array_groupBy(rows, x => x.language)

  // key is header
  const printed = Object.entries(groupedByLang)
    .map(([lang, rows]) => {
      const csv = stringify(
        rows.map(r => [r.word, r.additional_html_front ?? '', r.additional_html_back ?? '']),
        { delimiter: '\t' },
      )

      return `${lang}\n\n${csv}`
    })
    .join('\n\n')

  return String_toNonEmptyString_orUndefined_afterTrim(printed)
}
