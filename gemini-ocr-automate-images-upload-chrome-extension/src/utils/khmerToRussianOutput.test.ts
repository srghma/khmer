import { describe, it, expect } from 'vitest'
import {
  isKhmerToRussianOutput,
  strToLowercaseCyrillicWithGroups_orUndefined,
  strToLowercaseCyrillicWithGroups_orThrow,
} from './khmerToRussianOutput'

describe('KhmerToRussianOutput', () => {
  describe('isKhmerToRussianOutput', () => {
    it('should return true for simple lowercase Cyrillic words', () => {
      expect(isKhmerToRussianOutput('привет')).toBe(true)
      expect(isKhmerToRussianOutput('ёлка')).toBe(true)
      expect(isKhmerToRussianOutput('щи')).toBe(true)
    })

    it('should return true for valid groups with alternatives', () => {
      expect(isKhmerToRussianOutput('ййй(й|й)ййй')).toBe(true)
      expect(isKhmerToRussianOutput('дом(а|ов)')).toBe(true)
      expect(isKhmerToRussianOutput('(с|п)вет')).toBe(true)
      expect(isKhmerToRussianOutput('красн(ый|ая|ое)')).toBe(true)
    })

    it('should return false for uppercase characters', () => {
      expect(isKhmerToRussianOutput('Привет')).toBe(false)
      expect(isKhmerToRussianOutput('дом(А|о)')).toBe(false)
      expect(isKhmerToRussianOutput('Ё')).toBe(false)
    })

    it('should return false for naked pipes (outside parentheses)', () => {
      expect(isKhmerToRussianOutput('а|б')).toBe(false)
      expect(isKhmerToRussianOutput('(а|б)|в')).toBe(false)
    })

    it('should return false for unbalanced or malformed parentheses', () => {
      expect(isKhmerToRussianOutput('слово(а|б')).toBe(false)
      expect(isKhmerToRussianOutput('словоа|б)')).toBe(false)
      expect(isKhmerToRussianOutput('слово((а|б))')).toBe(false) // Nested not supported by this regex
    })

    it('should return false for empty groups or single-item groups', () => {
      expect(isKhmerToRussianOutput('слово()')).toBe(false)
      expect(isKhmerToRussianOutput('слово(а)')).toBe(false)
    })

    it('should return false for empty alternatives in groups', () => {
      expect(isKhmerToRussianOutput('слово(|а)')).toBe(false)
      expect(isKhmerToRussianOutput('слово(а|)')).toBe(false)
      expect(isKhmerToRussianOutput('слово(а||б)')).toBe(false)
    })

    it('should return false for non-Cyrillic characters', () => {
      expect(isKhmerToRussianOutput('word')).toBe(false)
      expect(isKhmerToRussianOutput('слово123')).toBe(false)
      expect(isKhmerToRussianOutput('слово!')).toBe(false)
      expect(isKhmerToRussianOutput('слово ')).toBe(false) // No spaces allowed
    })
  })

  describe('strToLowercaseCyrillicWithGroups_orUndefined', () => {
    it('should return the string if valid', () => {
      const valid = 'дом(а|ов)'
      expect(strToLowercaseCyrillicWithGroups_orUndefined(valid)).toBe(valid)
    })

    it('should return undefined if invalid', () => {
      expect(strToLowercaseCyrillicWithGroups_orUndefined('Invalid(A|B)')).toBe(undefined)
      expect(strToLowercaseCyrillicWithGroups_orUndefined('')).toBe(undefined)
    })
  })

  describe('strToLowercaseCyrillicWithGroups_orThrow', () => {
    it('should return the string if valid', () => {
      const valid = 'ййй(й|й)ййй'
      expect(strToLowercaseCyrillicWithGroups_orThrow(valid)).toBe(valid)
    })

    it('should throw an error if invalid', () => {
      expect(() => strToLowercaseCyrillicWithGroups_orThrow('а(б)')).toThrow(
        /Invalid LowercaseCyrillicWithGroups format/,
      )
    })
  })
})
