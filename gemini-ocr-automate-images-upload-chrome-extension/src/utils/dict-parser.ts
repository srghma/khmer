import { assertIsDefinedAndReturn } from './asserts'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'

export type DictEntry = {
  readonly headword: NonEmptyStringTrimmed
  readonly definition: NonEmptyStringTrimmed
}

export const parseDictionaryFile = (content: string): ReadonlyArray<DictEntry> => {
  // The format is <k>HEADWORD</k>\n<dtrn>DEFINITION</dtrn>
  // We use regex with 'g' and 's' (dotAll) flags
  const regex = /<k>(.*?)<\/k>\s*<dtrn>(.*?)<\/dtrn>/gs
  const matches: RegExpExecArray[] = [...content.matchAll(regex)]

  return matches.map((m: RegExpExecArray) => {
    const headword = nonEmptyString_afterTrim(assertIsDefinedAndReturn(m[1]))
    const definition = nonEmptyString_afterTrim(assertIsDefinedAndReturn(m[2]))

    return { headword, definition }
  })
}
