import { String_toNonEmptyString_orUndefined, type NonEmptyString } from './non-empty-string'
import { type NonEmptyStringTrimmed, nonEmptyString_afterTrim } from './non-empty-string-trimmed'

/**
 * A generic pure function that parses an HTML string, walks the DOM,
 * and allows transformation of Text Nodes.
 *
 * @param html - The input HTML string
 * @param transformFn - A function that takes a text node's content and returns the new content (text or HTML)
 * @returns The modified HTML string
 */
export const replaceHtmlTextNodesWithMaybeOtherHtml = (
  // 1. Create a temporary container to parse the HTML
  // Note: In a Node.js/SSR environment, this would require JSDOM.
  // In Tauri/Browser, `document` is available.
  tempDiv: HTMLDivElement,
  html: NonEmptyStringTrimmed,
  transformFn: (text: NonEmptyString) => NonEmptyString,
): NonEmptyStringTrimmed => {
  tempDiv.innerHTML = html

  // 2. Recursive function to traverse and process Text Nodes only
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.nodeValue ? String_toNonEmptyString_orUndefined(node.nodeValue) : undefined

      if (textContent) {
        // Run the transformation function provided by the caller
        const newHtml = transformFn(textContent)

        // If changes were made, replace the text node with HTML elements
        if (newHtml !== textContent) {
          const wrapper = document.createElement('span')

          wrapper.innerHTML = newHtml

          // Replace the single text node with the new nodes (unwrapping the temporary span)
          // We use replaceWith with the spread operator on childNodes to avoid adding extra spans
          if (node.parentNode) {
            // Convert NodeList to Array to avoid live collection issues during insertion
            const newNodes = Array.from(wrapper.childNodes)

            ;(node as ChildNode).replaceWith(...newNodes)
          }
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Don't traverse inside <script> or <style> tags
      const tagName = (node as Element).tagName.toLowerCase()

      if (tagName !== 'script' && tagName !== 'style') {
        // Convert childNodes to array to safely iterate even if DOM changes
        Array.from(node.childNodes).forEach(processNode)
      }
    }
  }

  // 3. Start processing
  Array.from(tempDiv.childNodes).forEach(processNode)

  const output = nonEmptyString_afterTrim(tempDiv.innerHTML)
  tempDiv.innerHTML = ''

  return output
}
