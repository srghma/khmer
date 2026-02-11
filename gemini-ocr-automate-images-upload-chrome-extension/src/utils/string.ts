export const unknown_shouldBeStringOrThrow = (v: unknown) => {
  if (typeof v !== 'string') throw new Error(`expected string but got ${v}`)
  return v
}
