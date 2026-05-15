import { type ValidNonNegativeInt } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber/validNonNegativeInt'

export type ScalingPercentage = ValidNonNegativeInt & { __brandScalingPercentage: 'ScalingPercentage' }

export const ScalingPercentage_min: ScalingPercentage = 50 as ScalingPercentage
export const ScalingPercentage_max: ScalingPercentage = 200 as ScalingPercentage
export const ScalingPercentage_default: ScalingPercentage = 100 as ScalingPercentage

export const ScalingPercentage_sliderMarks = [
  { value: 50, label: '50%' },
  { value: 100, label: '100%' },
  { value: 150, label: '150%' },
  { value: 200, label: '200%' },
]

export const isScalingPercentage = (val: number): val is ScalingPercentage => {
  if (!Number.isInteger(val)) return false

  return val >= ScalingPercentage_min && val <= ScalingPercentage_max
}

export const numberToScalingPercentageOrUndefined = (val: number): ScalingPercentage | undefined => {
  if (!isScalingPercentage(val)) return undefined

  return val
}

export const numberToScalingPercentageOrThrow = (val: number): ScalingPercentage => {
  if (!isScalingPercentage(val)) throw new Error(`Invalid font size: ${val}`)

  return val
}

export const unknownToScalingPercentageOrThrow = (val: unknown): ScalingPercentage => {
  if (typeof val !== 'number') throw new Error(`Invalid font size: ${val}`)

  return numberToScalingPercentageOrThrow(val)
}

// // what we set to ui styles should be valid
// export type FontSizeRem = ValidNonNegativeNumber & { __brandFontSizeRem: 'FontSizeRem' }

// export const MIN_FONT_SIZE_REM: FontSizeRem = 1 as FontSizeRem
// export const MAX_FONT_SIZE_REM: FontSizeRem = 100 as FontSizeRem

// export const isFontSizeRem = (val: number): val is FontSizeRem => {
//   if (!number_isValidNonNegativeNumber(val)) return false

//   return val >= MIN_FONT_SIZE_REM && val <= MAX_FONT_SIZE_REM
// }

// export const numberToFontSizeRemOrUndefined = (val: number): FontSizeRem | undefined => {
//   if (!isFontSizeRem(val)) return undefined

//   return val
// }

// export const numberToFontSizeRemOrThrow = (val: number): FontSizeRem => {
//   if (!isFontSizeRem(val)) throw new Error(`Invalid font size: ${val}`)

//   return val
// }

// export const unknownToFontSizeRemOrThrow = (val: unknown): FontSizeRem => {
//   if (typeof val !== 'number') throw new Error(`Invalid font size: ${val}`)

//   return numberToFontSizeRemOrThrow(val)
// }

// export const font_findY_Interpolated = (
//   y0: FontSizeRem,
//   y1: FontSizeRem,
//   y2: FontSizeRem,
//   x: ScalingPercentage,
// ): FontSizeRem => {
//   const x0 = MIN_FONT_SIZE_PERCENTAGE
//   const x1 = DEFAULT_FONT_SIZE_PERCENTAGE
//   const x2 = MAX_FONT_SIZE_PERCENTAGE

//   const o: number = findY_Interpolated(x0, y0, x1, y1, x2, y2, x)
//   const oInt: number = Math.round(o)

//   if (!isFontSizeRem(oInt)) throw new Error(`Invalid font size: ${oInt}`)

//   return oInt
// }
