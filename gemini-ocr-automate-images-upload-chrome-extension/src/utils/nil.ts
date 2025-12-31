// Copyright 2025 srghma

// A generic utility function to check for non-null/undefined values
export function isNotNil<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
