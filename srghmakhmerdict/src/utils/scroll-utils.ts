/**
 * Helper to find the index of the word closest to the center of the scroll container
 */
export const findCenterWordIndex = (container: HTMLDivElement): number | null => {
  const containerRect = container.getBoundingClientRect()
  const centerY = containerRect.top + containerRect.height / 2

  const words = container.querySelectorAll('[data-word-index]')
  let closestIndex: number | null = null
  let minDistance = Infinity

  words.forEach(word => {
    const rect = word.getBoundingClientRect()
    const wordCenterY = rect.top + rect.height / 2
    const distance = Math.abs(centerY - wordCenterY)

    if (distance < minDistance) {
      minDistance = distance
      const idxAttr = word.getAttribute('data-word-index')

      if (idxAttr) {
        closestIndex = parseInt(idxAttr, 10)
      }
    }
  })

  return closestIndex
}
