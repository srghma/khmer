// Copyright 2023 srghma

import { strToWithoutKhmer_remove_orUndefined, type TypedWithoutKhmer } from './string-without-khmer'

export type TypedWithoutKhmerAndHtml = TypedWithoutKhmer & {
  readonly __brandTypedWithoutKhmerAndHtml: 'TypedWithoutKhmerAndHtml'
}

export const strToWithoutKhmerAndHtml_remove_orUndefined = (value: string): TypedWithoutKhmerAndHtml | undefined => {
  const div = document.createElement('div')

  div.innerHTML = value
  const text = div.textContent || ''

  return strToWithoutKhmer_remove_orUndefined(text) as TypedWithoutKhmerAndHtml | undefined
}

export const strToWithoutKhmerAndHtml_remove_orThrow = (value: string): TypedWithoutKhmerAndHtml => {
  const v = strToWithoutKhmerAndHtml_remove_orUndefined(value)
  if (!v) throw new Error(`Invalid WithoutKhmerAndHtml format: '${value}'`)
  return v
}
