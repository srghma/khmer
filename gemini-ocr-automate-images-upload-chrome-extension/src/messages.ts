// src/messages.ts
import { z } from 'zod'
import { type ValidNonNegativeInt } from './utils/toNumber'

// --- Custom Zod Types ---
export const zodValidNonNegativeInt = z
  .number()
  .int()
  .nonnegative()
  .transform(val => val as ValidNonNegativeInt)

// --- Message Schemas ---

// Request to select files (AI Studio → Drive iframe)
export const AistudioToDriveIframe_SelectFilesSchema = z.strictObject({
  type: z.literal('SELECT_FILES'),
  startPage: zodValidNonNegativeInt,
  pageCount: zodValidNonNegativeInt,
})

export type AistudioToDriveIframe_SelectFiles = z.infer<typeof AistudioToDriveIframe_SelectFilesSchema>

// Response after selection (Drive iframe → AI Studio)
export const DriveToAistudio_SelectionResultSchema = z.strictObject({
  type: z.literal('SELECTION_RESULT'),
  status: z.enum(['success', 'partial_success', 'no_files_found']),
  selectedPages: z.array(zodValidNonNegativeInt),
  nextStartPage: zodValidNonNegativeInt,
})

export type DriveToAistudio_SelectionResult = z.infer<typeof DriveToAistudio_SelectionResultSchema>
