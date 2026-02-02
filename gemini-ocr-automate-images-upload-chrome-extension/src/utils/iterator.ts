export function* Iterator_yieldUnique_usingSet<T extends PropertyKey>(iterable: Iterable<T>): Generator<T> {
  const seen = new Set<T>()

  for (const item of iterable) {
    if (!seen.has(item)) {
      seen.add(item)
      yield item
    }
  }
}

// will not make unique 100%

// export function* Iterator_yieldUnique_usingSet_lru<
//   T extends PropertyKey
// >(
//   iterable: Iterable<T>,
//   maxSetSize = 100_000
// ): Generator<T> {
//   const seen = new Set<T>()
//   const order: T[] = []
//
//   for (const item of iterable) {
//     if (seen.has(item)) continue
//
//     seen.add(item)
//     order.push(item)
//     yield item
//
//     if (seen.size > maxSetSize) {
//       const oldest = order.shift()!
//       seen.delete(oldest)
//     }
//   }
// }
