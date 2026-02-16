import { describe, it, expect } from 'vitest'
import { russianToKhmerRegex } from './russianToKhmerRegex'

describe('russianToKhmerRegex', () => {
  it('handles basic consonant mappings (к matches ក, គ, ខ, ឃ)', () => {
    const regexStr = russianToKhmerRegex('к')
    const regex = new RegExp(regexStr)
    expect(regex.test('ក')).toBe(true)
    expect(regex.test('គ')).toBe(true)
    expect(regex.test('ខ')).toBe(true)
    expect(regex.test('ឃ')).toBe(true)
  })

  it('handles "тоу" matching "ទូ" and "តូ"', () => {
    const regexStr = russianToKhmerRegex('тоу')
    const regex = new RegExp(regexStr)
    // ទូ is 'ту', តូ is 'тоу'
    expect(regex.test('ទូ')).toBe(true)
    expect(regex.test('តូ')).toBe(true)
  })

  it('handles "ка" matching "ក" (inherent) and "កា" (explicit vovel)', () => {
    const regexStr = russianToKhmerRegex('ка')
    const regex = new RegExp(regexStr)
    expect(regex.test('ក')).toBe(true)
    expect(regex.test('កា')).toBe(true)
    expect(regex.test('គ')).toBe(true)
    expect(regex.test('គា')).toBe(true)
  })

  it('handles "кх" matching "ខ" and "ឃ"', () => {
    const regexStr = russianToKhmerRegex('кх')
    const regex = new RegExp(regexStr)
    expect(regex.test('ខ')).toBe(true)
    expect(regex.test('ឃ')).toBe(true)
  })

  it('handles "ы" matching "ឹ" and "ឺ"', () => {
    const regexStr = russianToKhmerRegex('ы')
    const regex = new RegExp(regexStr)
    expect(regex.test('ឹ')).toBe(true)
    expect(regex.test('ឺ')).toBe(true)
  })

  it('handles special sequences like "ам"', () => {
    const regexStr = russianToKhmerRegex('ам')
    const regex = new RegExp(regexStr)
    expect(regex.test('កំ')).toBe(true)
    expect(regex.test('កាំ')).toBe(true)
  })

  it('works with "starts from" (prefixing with ^)', () => {
    const pattern = russianToKhmerRegex('ба')
    const regex = new RegExp(`^${pattern}`)
    expect(regex.test('ប')).toBe(true)
    expect(regex.test('បា')).toBe(true)
    expect(regex.test('សប')).toBe(false)
  })

  it('works with "includes" (default pattern)', () => {
    const pattern = russianToKhmerRegex('ба')
    const regex = new RegExp(pattern)
    expect(regex.test('សប')).toBe(true)
  })

  it('handles mixed case and spaces', () => {
    const regexStr = russianToKhmerRegex('К а')
    const regex = new RegExp(regexStr)
    expect(regex.test('ក')).toBe(true)
    expect(regex.test('កា')).toBe(true)
  })

  it('handles complex words like "капу" matching "កាពូ"', () => {
    const regexStr = russianToKhmerRegex('капу')
    const regex = new RegExp(regexStr)
    // កា (ка) + ពូ (пу)
    expect(regex.test('កាពូ')).toBe(true)
    // ក (ка) + ពុ (пу)
    expect(regex.test('កពុ')).toBe(true)
  })

  it('handles "сра" matching "ស្រា"', () => {
    const regexStr = russianToKhmerRegex('сра')
    const regex = new RegExp(regexStr)
    // ស (с) + ្រ (р) + ា (а)
    expect(regex.test('ស្រា')).toBe(true)
  })

  it('handles "плов" matching "ផ្លូវ"', () => {
    const regexStr = russianToKhmerRegex('плов')
    const regex = new RegExp(regexStr)
    // ផ (п) + ្ល (л) + ូ (о) + វ (в) ?
    // ផ្លូវ is pronounced like 'плов' or 'плав'
    expect(regex.test('ផ្លូវ')).toBe(true)
  })
})
