// Copyright 2025 srghma

type Option<T> = { label: string; value: NonNullable<T> }

export function selectOptionLabel<T>(options: readonly Option<T>[], value: NonNullable<T>): string | undefined {
  return options.find(x => x.value === value)?.label
}

export function selectOptionLabelOrDefault<T, D>(
  options: readonly Option<T>[],
  value: NonNullable<T>,
  def: NonNullable<D>,
): string | NonNullable<D> {
  return selectOptionLabel(options, value) ?? def
}
