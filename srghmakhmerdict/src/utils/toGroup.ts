import type { Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export interface AlphabetSubGroup<UC extends Char> {
  readonly letter: UC
  readonly words: NonEmptyArray<NonEmptyStringTrimmed>
}

export interface AlphabetGroup<UC extends Char> {
  readonly letter: UC
  readonly subGroups: NonEmptyArray<AlphabetSubGroup<UC>>
}

export type ProcessDataOutput<UC extends Char> = { groups: AlphabetGroup<UC>[]; other: NonEmptyStringTrimmed[] }

export function processData<UC extends Char>(
  extractKeys: (word: NonEmptyStringTrimmed) => readonly [UC, UC | undefined] | undefined,
  data: Iterable<NonEmptyStringTrimmed>,
): ProcessDataOutput<UC> {
  const grouped = new Map<UC, Map<UC, NonEmptyStringTrimmed[]>>()
  const other: NonEmptyStringTrimmed[] = []

  for (const word of data) {
    const extracted = extractKeys(word)

    if (!extracted) {
      other.push(word)
      continue
    }
    const [l1, l2] = extracted

    const primary = l1
    // If l2 is missing, use l1 as the secondary key (grouping under the letter itself)
    const secondary = l2 ?? l1

    let subMap = grouped.get(primary)

    if (!subMap) {
      subMap = new Map()
      grouped.set(primary, subMap)
    }

    let list = subMap.get(secondary)

    if (!list) {
      list = []
      subMap.set(secondary, list)
    }
    list.push(word)
  }

  const groups: AlphabetGroup<UC>[] = []
  const sortedL1 = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b))

  for (const l1 of sortedL1) {
    const subMap = grouped.get(l1)!
    const sortedL2 = Array.from(subMap.keys()).sort((a, b) => a.localeCompare(b))

    const subGroups: AlphabetSubGroup<UC>[] = []

    for (const l2 of sortedL2) {
      const words = subMap.get(l2)!

      subGroups.push({
        letter: l2,
        words: Array_toNonEmptyArray_orThrow(words),
      })
    }

    groups.push({
      letter: l1,
      subGroups: Array_toNonEmptyArray_orThrow(subGroups),
    })
  }

  return { groups, other }
}
