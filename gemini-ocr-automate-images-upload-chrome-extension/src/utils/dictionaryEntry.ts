import { NonEmptyString } from "./non-empty-string"
import { ValidNonNegativeInt } from "./toNumber"

export interface DictionaryEntry<W> {
  word: W
  content: NonEmptyString
  pageNumber: ValidNonNegativeInt
}

const splitPageIntoEntries = (
  pageNumber: ValidNonNegativeInt,
  pageContent: NonEmptyString,
): DictionaryEntry[] => {}
