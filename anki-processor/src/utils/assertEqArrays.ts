// Copyright 2025 srghma

export function assertEqArrays(arrayA: readonly string[], arrayB: readonly string[]): void {
  if (arrayA.length !== arrayB.length) {
    throw new Error(
      `Dynamic attribute group count mismatch:\nnow:    ${JSON.stringify(arrayA)}\nbefore: ${JSON.stringify(arrayB)}`,
    )
  }

  const mismatchIndex = arrayA.findIndex((label, i) => label !== arrayB[i])
  if (mismatchIndex !== -1) {
    throw new Error(
      `Dynamic attribute group label mismatch at index ${mismatchIndex}:\nnow:    ${JSON.stringify(
        arrayA,
      )}\nbefore: ${JSON.stringify(arrayB)}`,
    )
  }
}

export const throwInDevelopment: (message: string) => void =
  process.env.NODE_ENV === 'production'
    ? (message: string) => {
        throw new Error(message)
      }
    : console.error
