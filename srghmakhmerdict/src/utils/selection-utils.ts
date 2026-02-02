import type { SharedSelection } from '@heroui/system'

/**
 * Extracts a single string value from a HeroUI SharedSelection (Set).
 * Returns undefined if selection is empty or not a string.
 */
export const getSingleSelection_string = (keys: SharedSelection): string | undefined => {
  const selected = Array.from(keys)[0]

  if (!selected) return undefined

  if (typeof selected !== 'string') throw new Error(`getSingleSelection_string: not string ${keys}`)

  return selected
}
