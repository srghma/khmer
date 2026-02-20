import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { marked } from 'marked'

const MarkdownToHtmlResult_empty = { t: 'empty' } as const

export type MarkdownToHtmlResult =
  | { t: 'success'; v: NonEmptyStringTrimmed }
  | { t: 'error'; error: unknown }
  | typeof MarkdownToHtmlResult_empty

/**
 * Converts markdown to HTML using the 'marked' library.
 * Supports GFM (GitHub Flavored Markdown), including tables.
 */
export function basicMarkdownToHtml(markdown: NonEmptyStringTrimmed): MarkdownToHtmlResult {
  try {
    // Synchronous parsing is default in marked unless async: true is passed
    // GFM is enabled by default in marked
    const html = String_toNonEmptyString_orUndefined_afterTrim(
      marked.parse(markdown, {
        async: false,
        gfm: true,
        breaks: true, // Treat newlines as <br>
      }),
    )

    if (html === undefined) {
      return MarkdownToHtmlResult_empty
    }

    return { t: 'success', v: html }
  } catch (error: unknown) {
    return { t: 'error', error }
  }
}
