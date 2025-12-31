export function getExpectedFilenames(start: number, count: number): Set<string> {
  return new Set(
    Array.from({ length: count }, (_, i) => {
      const index = start + i
      return `page-${String(index).padStart(3, '0')}.png`
    }),
  )
}
