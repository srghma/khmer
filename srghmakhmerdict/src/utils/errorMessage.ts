export function unknown_to_errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  return String(error)
}
