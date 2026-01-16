// Copyright 2023 srghma

export function roundToMaxDecimals(num: number, maxDecimals: number): number {
  const factor = Math.pow(10, maxDecimals)
  return Math.round((num + Number.EPSILON) * factor) / factor
}
