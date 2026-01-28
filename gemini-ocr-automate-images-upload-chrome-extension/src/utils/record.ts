// Copyright 2023 srghma

export function Record_filterTrueKeys<T extends string | number | symbol>(obj: Record<T, boolean>): T[] {
  return Object.entries(obj)
    .filter(([_, v]) => v)
    .map(([k]) => k as T)
}
