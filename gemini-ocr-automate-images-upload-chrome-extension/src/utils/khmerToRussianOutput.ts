import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

/**
 * A strict regex for Lowercase Cyrillic with Groups.
 *
 * Breakdown:
 * ^(?:                                - Start of string, begin non-capturing group
 *   [\p{Script=Cyrillic}]             - Match a single Cyrillic character
 *   |                                 - OR
 *   \([\p{Script=Cyrillic}]+          - Opening '(' followed by 1+ Cyrillic chars
 *     (?:\|[\p{Script=Cyrillic}]+)+   - 1 or more pipes followed by 1+ Cyrillic chars
 *   \)                                - Closing ')'
 * )+$                                 - Match 1 or more of the above until end of string
 */
// Add \. to the allowed character class
export const KhmerToRussianOutput_REGEX =
  /^(?:[\p{Script=Cyrillic}.]|\([\p{Script=Cyrillic}.]+(?:\|[\p{Script=Cyrillic}.]+)+\))+$/u

export type KhmerToRussianOutput = NonEmptyStringTrimmed & {
  readonly __brandKhmerToRussianOutput: 'KhmerToRussianOutput'
}

/**
 * Validates structural integrity:
 * - Cyrillic only
 * - Lowercase only
 * - Groups must be formatted as (alt1|alt2)
 * - No empty groups, no leading/trailing pipes
 */
export const isKhmerToRussianOutput = (value: string): value is KhmerToRussianOutput => {
  // 1. Basic structural check
  if (!KhmerToRussianOutput_REGEX.test(value)) return false

  // 2. Case check (must be lowercase)
  if (value !== value.toLowerCase()) return false

  // 3. Prevent balanced but empty-ish logic (already handled by regex + and | requirement)
  return true
}

export const strToLowercaseCyrillicWithGroups_orUndefined = (value: string): KhmerToRussianOutput | undefined => {
  if (!value) return undefined
  return isKhmerToRussianOutput(value) ? value : undefined
}

export const strToLowercaseCyrillicWithGroups_orThrow = (value: string): KhmerToRussianOutput => {
  const v = strToLowercaseCyrillicWithGroups_orUndefined(value)
  if (!v) {
    throw new Error(
      `Invalid LowercaseCyrillicWithGroups format: '${value}'. ` +
        `Must be lowercase Cyrillic with strict group syntax e.g., 'ййй(й|й)ййй'`,
    )
  }
  return v
}
