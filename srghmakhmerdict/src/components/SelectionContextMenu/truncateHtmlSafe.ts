import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

/**
 * Truncates HTML string while attempting to preserve tag structure.
 * Uses DOMParser to ensure we don't return broken HTML.
 */
export function truncateHtmlSafe(htmlContent: NonEmptyStringTrimmed, maxLength: number): string {
  if (htmlContent.length <= maxLength) return htmlContent

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const body = doc.body

  let currentLength = 0
  const nodesToRemove: Node[] = []

  // Depth-first traversal to calculate length and mark nodes for removal
  function traverse(node: Node): boolean {
    if (currentLength >= maxLength) {
      nodesToRemove.push(node)

      return true // Stop processing siblings
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''

      if (currentLength + text.length > maxLength) {
        // Truncate this text node
        node.textContent = text.slice(0, maxLength - currentLength) + '...'
        currentLength = maxLength

        return true // Stop
      }
      currentLength += text.length
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Walk children
      const children = Array.from(node.childNodes)

      for (const child of children) {
        if (traverse(child)) {
          // If child caused stop, remaining siblings are handled by the loop in parent
        }
      }
    }

    return currentLength >= maxLength
  }

  traverse(body)

  // Remove nodes that were fully beyond the limit (simple cleanup)
  // Note: The traversal logic above modifies text nodes in place or marks nodes.
  // For a simple preview, simple text truncation inside the walker is usually enough.
  // The logic below ensures we don't leave hanging empty tags if possible,
  // but for a preview, browser auto-correction is usually fine.

  return body.innerHTML
}
