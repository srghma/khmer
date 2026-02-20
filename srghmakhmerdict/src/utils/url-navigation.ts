export const KHMER_ANALYZER_PATH = '/khmer_analyzer'
export const KHMER_ANALYZER_PARAM_TEXT = 'text'

/**
 * Constructs the URL for the Khmer Analyzer with the text encoded as a query parameter.
 * Handles encoding and sanitization.
 */
export const makeKhmerAnalyzerUrl = (text: string | undefined | null): string => {
  if (!text || !text.trim()) {
    return KHMER_ANALYZER_PATH
  }

  const params = new URLSearchParams()

  params.set(KHMER_ANALYZER_PARAM_TEXT, text.trim())

  return `${KHMER_ANALYZER_PATH}?${params.toString()}`
}

/**
 * Safe helper to get a specific search param from the window location
 */
export const getUrlSearchParam = (key: string): string | null => {
  const params = new URLSearchParams(window.location.search)

  return params.get(key)
}
