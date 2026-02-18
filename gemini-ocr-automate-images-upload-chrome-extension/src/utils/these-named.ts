import { type These, These_this, These_that, These_both } from './these'
import { assertNever } from './asserts'

/**
 * TheseNamed represents an inclusive disjunction with domain-specific labels.
 * N1/V1: Name and Value for the "This" side (e.g., 'imported', NonEmptyMap)
 * N2/V2: Name and Value for the "That" side (e.g., 'skipped', NonEmptyMap)
 */
export type TheseNamed<N1 extends string, V1, N2 extends string, V2> =
  | ({ t: N1 } & { [K in N1]: V1 })
  | ({ t: N2 } & { [K in N2]: V2 })
  | ({ t: 'both' } & { [K in N1]: V1 } & { [K in N2]: V2 })

/**
 * Converts a Labeled (Talking) These to a Standard These.
 * Useful for passing named types into generic utility functions.
 */
export function TheseNamed_toStandard<N1 extends string, V1, N2 extends string, V2>(
  tn: TheseNamed<N1, V1, N2, V2>,
  n1: N1,
  n2: N2,
): These<V1, V2> {
  // Using 'in' operator for type-safe property checking
  if (tn.t === 'both') {
    return These_both((tn as any)[n1], (tn as any)[n2])
  }
  if (tn.t === n1) {
    return These_this((tn as any)[n1])
  }
  if (tn.t === n2) {
    return These_that((tn as any)[n2])
  }
  return assertNever(tn as never)
}

/**
 * Converts a Standard These back to a Labeled (Talking) These.
 */
export function TheseNamed_fromStandard<N1 extends string, V1, N2 extends string, V2>(
  ts: These<V1, V2>,
  n1: N1,
  n2: N2,
): TheseNamed<N1, V1, N2, V2> {
  switch (ts.t) {
    case 'this':
      return { t: n1, [n1]: ts.vThis } as TheseNamed<N1, V1, N2, V2>
    case 'that':
      return { t: n2, [n2]: ts.vThat } as TheseNamed<N1, V1, N2, V2>
    case 'both':
      return { t: 'both', [n1]: ts.vThis, [n2]: ts.vThat } as TheseNamed<N1, V1, N2, V2>
    default:
      return assertNever(ts)
  }
}

/**
 * Helper type for the object returned by the factory.
 */
export type TheseNamedFactory<N1 extends string, N2 extends string> = {
  n1: N1
  n2: N2
  mk1: <V1, V2>(v1: V1) => TheseNamed<N1, V1, N2, V2>
  mk2: <V1, V2>(v2: V2) => TheseNamed<N1, V1, N2, V2>
  mkBoth: <V1, V2>(v1: V1, v2: V2) => TheseNamed<N1, V1, N2, V2>
}

/**
 * Creates a set of constructors for a specific Named These relationship.
 * UPDATED: Now includes n1 and n2 in the returned object.
 */
export function TheseNamed_factory<N1 extends string, N2 extends string>(n1: N1, n2: N2): TheseNamedFactory<N1, N2> {
  return {
    n1,
    n2,
    mk1: <V1, V2>(v1: V1): TheseNamed<N1, V1, N2, V2> => ({ t: n1, [n1]: v1 }) as any,
    mk2: <V1, V2>(v2: V2): TheseNamed<N1, V1, N2, V2> => ({ t: n2, [n2]: v2 }) as any,
    mkBoth: <V1, V2>(v1: V1, v2: V2): TheseNamed<N1, V1, N2, V2> => ({ t: 'both', [n1]: v1, [n2]: v2 }) as any,
  }
}

/**
 * Asynchronously transforms the first branch (mk1) of a Named These.
 *
 * CRITICAL FIX: The cast inside the implementation must handle the union discrimination properly.
 */
export async function TheseNamed_map1Async<N1 extends string, V1, N2 extends string, V2, V1New>(
  tn: TheseNamed<N1, V1, N2, V2>,
  factory: TheseNamedFactory<N1, N2>,
  f: (v1: V1) => Promise<V1New>,
): Promise<TheseNamed<N1, V1New, N2, V2>> {
  const { n1, n2, mk1, mkBoth } = factory

  // Use type narrowing via the discriminator 't'
  if (tn.t === 'both') {
    // We must cast to access the specific properties safely because TS
    // can't verify dynamic keys (n1, n2) against the generic union.
    const tnBoth = tn as any
    const v1 = tnBoth[n1] as V1
    const v2 = tnBoth[n2] as V2
    return mkBoth(await f(v1), v2)
  }

  if (tn.t === n1) {
    const tn1 = tn as any
    const v1 = tn1[n1] as V1
    return mk1(await f(v1)) as any
  }

  if (tn.t === n2) {
    // If it's the second branch, it remains unchanged.
    // However, the return type expects V1New in the first slot.
    // Since this branch doesn't HAVE the first slot, it is structurally compatible.
    return tn as any
  }

  throw new Error(`Unhandled state in TheseNamed_map1Async: ${(tn as any).t}\n${new Error().stack}`)
}
