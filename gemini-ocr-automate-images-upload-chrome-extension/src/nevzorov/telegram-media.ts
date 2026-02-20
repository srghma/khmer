import { Api } from 'telegram'

/**
 * Extracts sendable file entities (Photos or Documents) from Telegram Messages.
 * Specifically excludes MessageMediaWebPage (link previews) which are not
 * files and cause "Cannot use [object Object] as file" errors in sendFile.
 */
export function extractSendableMedia(messages: Api.Message[]): (Api.Photo | Api.Document)[] {
  return messages
    .map(m => {
      if (!m.media) return null

      // Photos
      if (m.media instanceof Api.MessageMediaPhoto && m.media.photo) {
        return m.media.photo
      }

      // Documents (Videos, GIFs, Files)
      if (m.media instanceof Api.MessageMediaDocument && m.media.document) {
        return m.media.document
      }

      return null
    })
    .filter((m): m is Api.Photo | Api.Document => m !== null)
}
