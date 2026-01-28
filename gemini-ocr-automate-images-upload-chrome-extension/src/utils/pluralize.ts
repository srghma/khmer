// Copyright 2025 srghma

export function pluralize(count: number, singular: string, plural = singular + 's'): string {
  return count === 1 ? singular : plural
}

export function capitalizeFirstLetter(string: string) {
  if (string.length === 0) {
    return string // Return original if not a string or empty
  }
  return string.charAt(0).toUpperCase() + string.slice(1)
}
