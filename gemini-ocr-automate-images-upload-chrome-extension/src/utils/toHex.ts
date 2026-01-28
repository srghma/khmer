export function toHex(str: string): string {
  let result = ''

  for (let i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16)
  }

  return result
}
