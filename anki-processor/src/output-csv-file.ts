import type { NonEmptyString } from './utils/non-empty-string.js'

export const toCSVRow = ({
  id,
  html1,
  html2,
  html3,
  html4,
  html5,
  html6,
}: {
  id: NonEmptyString
  html1: NonEmptyString | undefined
  html2: NonEmptyString | undefined
  html3: NonEmptyString | undefined
  html4: NonEmptyString | undefined
  html5: NonEmptyString | undefined
  html6: NonEmptyString | undefined
}): string => {
  const fields = [id, html1, html2, html3, html4, html5, html6]

  return fields
    .map(f => {
      if (f === undefined) return ''
      const s = f.replace(/\n/g, '<br/>').replace(/[ \t]+/g, ' ')
      return `"${s}"`
    })
    .join('\t')
}

/**
 * formats a field for Anki Text Import (Tab separated)
 * Ref: https://docs.ankiweb.net/importing/text-files.html
 */
const formatField = (text: string | undefined): string => {
  if (!text) return ''

  // 1. Flatten whitespace (replace tabs with spaces to avoid breaking separator)
  let s = text.replace(/[ \t]+/g, ' ')

  // 2. Handle newlines:
  // Since we use #html:true, we should use <br> for visual newlines.
  // Literal \n is allowed in quoted fields, but <br> is safer for HTML fields.
  s = s.replace(/\n/g, '<br>')

  // 3. Escape double quotes:
  // "Anki uses double quotes to escape fields."
  // "If you wish to include them inside your field, you need to replace a single doublequote with two doublequotes"
  s = s.replace(/"/g, '""')

  // 4. Wrap entire field in double quotes
  return `"${s}"`
}

export const toTXTRow = ({
  word,
  html1,
  html2,
  html3,
  html4,
  html5,
  html6,
}: {
  word: NonEmptyString
  html1: NonEmptyString | undefined
  html2: NonEmptyString | undefined
  html3: NonEmptyString | undefined
  html4: NonEmptyString | undefined
  html5: NonEmptyString | undefined
  html6: NonEmptyString | undefined
}): string => {
  const fields = [word, html1, html2, html3, html4, html5, html6]

  // Join with Tab separator
  return fields.map(formatField).join('\t')
}
