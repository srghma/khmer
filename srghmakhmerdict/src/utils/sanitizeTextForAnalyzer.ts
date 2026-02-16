/**
 * Sanitizes text before passing it to the Khmer Analyzer.
 * Removes section headers, normalizes whitespace, and cleans up formatting.
 *
 * This is useful when users select multi-line text that includes:
 * - Section headers (e.g., "N-KM DICTIONARY", "GORGONIEV DICTIONARY")
 * - Non-breaking spaces (\u00A0)
 * - Multiple consecutive newlines or spaces
 *
 * @param text - The raw selected text
 * @returns Sanitized text suitable for analysis
 */
export const sanitizeTextForAnalyzer = (text: string): string => {
  return (
    text
      // Replace non-breaking spaces with regular spaces
      .replace(/\u00A0/g, ' ')
      // Collapse multiple whitespace characters (including newlines) into single spaces
      .replace(/\s+/g, ' ')
      // Remove leading and trailing whitespace
      .trim()
  )
}
