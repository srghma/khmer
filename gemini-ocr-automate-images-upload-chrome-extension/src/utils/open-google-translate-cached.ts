import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { type NonEmptySet } from './non-empty-set'
import { Map_mkOrThrowIfDuplicateKeys, Map_union_onCollisionThrow } from './map'
import { Set_diff } from './sets'
import { Map_assertNonEmptyMap, Map_toNonEmptyMap_orThrow, type NonEmptyMap } from './non-empty-map'
// import { translateBulk, type LanguageCode } from "./google-translate"
import { translateBulk, type LanguageCode } from './google-translate-puppeteer'
import { type DbConnection, db__getArrayOfTranslations, db__upsertTranslation } from './open-google-translate-cache'

// --- Main Translation Logic ---

export const translateSrt = async (
  db: DbConnection,
  {
    strs,
    languageFrom,
    languageTo,
  }: {
    readonly strs: NonEmptySet<NonEmptyStringTrimmed>
    readonly languageFrom: LanguageCode
    readonly languageTo: LanguageCode
  },
): Promise<NonEmptyMap<NonEmptyStringTrimmed, NonEmptyStringTrimmed>> => {
  // 2. Fetch Cached Translations
  const cachedTranslations: Map<NonEmptyStringTrimmed, NonEmptyStringTrimmed> = db__getArrayOfTranslations(db, {
    languageFrom,
    languageTo,
    strs,
  })

  // 3. Determine Missing
  const missingOriginals: Set<NonEmptyStringTrimmed> = Set_diff(strs, new Set(cachedTranslations.keys()))

  if (missingOriginals.size <= 0) return Map_toNonEmptyMap_orThrow(cachedTranslations)

  // 4. Translate Missing (and update DB incrementally)
  const apiResultRaw = await translateBulk({
    listOfWordsToTranslate: Array.from(missingOriginals),
    fromLanguage: languageFrom,
    toLanguage: languageTo,
    onSuccess: (original, translation) => {
      // Upsert immediately after each successful translation
      db__upsertTranslation(db, {
        languageFrom,
        languageTo,
        original,
        translation,
      })
    },
  })
  console.log('apiResultRaw', apiResultRaw)

  // Validate API response
  const apiResultTranslations = Map_mkOrThrowIfDuplicateKeys(
    apiResultRaw.map((item: { original: string; translation: string }) => {
      return [nonEmptyString_afterTrim(item.original), nonEmptyString_afterTrim(item.translation)]
    }),
  )

  // Sanity Check
  if (apiResultTranslations.size !== missingOriginals.size)
    throw new Error(
      `[Warning] apiResultTranslations.size ${apiResultTranslations.size} !== missingOriginals.size ${missingOriginals.size}`,
    )

  // Note: We no longer perform a bulk upsert here because we upserted incrementally.

  // 5. Return Merged Map
  // Even if partial results occurred (due to abort), apiResultTranslations contains what finished.
  // We return whatever we have.
  const allTranslations = Map_union_onCollisionThrow(cachedTranslations, apiResultTranslations)

  // If we had missing items but got empty results (e.g. immediate abort), we might
  // fail Map_assertNonEmptyMap if cached was also empty. But the return type demands NonEmptyMap.
  // If the input 'strs' was non-empty, and we found everything in cache, we returned early.
  // If we had missing, and got nothing back, and cache was empty, we can't return a NonEmptyMap of results covering 'strs'.
  // However, the function signature assumes we succeed or throw.
  // For the purpose of this refactor, we attempt to cast or throw.
  Map_assertNonEmptyMap(allTranslations)

  return Map_toNonEmptyMap_orThrow(allTranslations)
}
