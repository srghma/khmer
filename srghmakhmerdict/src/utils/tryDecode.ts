export const tryDecode = (str: string): string => {
  try {
    return decodeURIComponent(str)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Router] Failed to decode URL component:', str, e)

    return str
  }
}
