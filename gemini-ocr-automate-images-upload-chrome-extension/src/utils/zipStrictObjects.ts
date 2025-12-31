// Copyright 2025 srghma

export function zipStrictObjects<A, B>(a: Record<string, A>, b: Record<string, B>): Record<string, [A, B]> {
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()

  const missingInB = aKeys.filter(k => !bKeys.includes(k))
  const missingInA = bKeys.filter(k => !aKeys.includes(k))

  if (missingInA.length > 0 || missingInB.length > 0) {
    throw new Error(
      `zipStrictObjects: keys do not match.\n` +
        (missingInA.length > 0 ? `Extra keys in B: ${missingInA.join(', ')}\n` : '') +
        (missingInB.length > 0 ? `Extra keys in A: ${missingInB.join(', ')}\n` : ''),
    )
  }

  const result: Record<string, [A, B]> = {}
  for (const key of aKeys) {
    result[key] = [a[key]!, b[key]!]
  }
  return result
}

export function zipStrictObjectsValues<A, B>(a: Record<string, A>, b: Record<string, B>): [A, B][] {
  return Object.values(zipStrictObjects(a, b))
}

export function zipStrictObjects3<A, B, C>(
  a: Record<string, A>,
  b: Record<string, B>,
  c: Record<string, C>,
): Record<string, [A, B, C]> {
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  const cKeys = Object.keys(c).sort()

  const missingInB = aKeys.filter(k => !bKeys.includes(k))
  const missingInC = aKeys.filter(k => !cKeys.includes(k))
  const missingInAfromB = bKeys.filter(k => !aKeys.includes(k))
  const missingInAfromC = cKeys.filter(k => !aKeys.includes(k))

  if (missingInB.length > 0 || missingInC.length > 0 || missingInAfromB.length > 0 || missingInAfromC.length > 0) {
    throw new Error(
      `zipStrictObjects3: keys do not match.\n` +
        (missingInB.length > 0 ? `Extra keys in A not in B: ${missingInB.join(', ')}\n` : '') +
        (missingInC.length > 0 ? `Extra keys in A not in C: ${missingInC.join(', ')}\n` : '') +
        (missingInAfromB.length > 0 ? `Extra keys in B not in A: ${missingInAfromB.join(', ')}\n` : '') +
        (missingInAfromC.length > 0 ? `Extra keys in C not in A: ${missingInAfromC.join(', ')}\n` : ''),
    )
  }

  const result: Record<string, [A, B, C]> = {}
  for (const key of aKeys) {
    result[key] = [a[key]!, b[key]!, c[key]!]
  }
  return result
}
