// Copyright 2023 srghma

// A simple regex to validate the UUID format.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type TypedUUID = string & { readonly __uuidbrand: 'TypedUUID' }
export const isUuid = (value: string): value is TypedUUID => UUID_REGEX.test(value)
export const strToUuidOrUndefined = (value: string): TypedUUID | undefined => (isUuid(value) ? value : undefined)
export const strToUuidOrThrow = (value: string): TypedUUID => {
  const uuid = strToUuidOrUndefined(value)
  if (!uuid) throw new Error(`Invalid UUID format: '${value}'`)
  return uuid
}
