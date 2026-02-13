// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { stripHtml } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/strip-html'

describe('stripHtml with block elements and line breaks', () => {
  it('should replace <BR> with a space', () => {
    const input = "<B><font color='brown'>Stage</font></B><BR>excavated, rummage, rummage around, mined"
    const expected = 'Stage excavated, rummage, rummage around, mined'

    expect(stripHtml(input)).toBe(expected)
  })

  it('should handle multiple <BR> tags', () => {
    const input =
      "<B><font color='brown'>viroid disease</font></B><BR>viroid: viroid <BR>ឺ: disease, diseases, sunshine, ill, the menu"
    const expected = 'viroid disease viroid: viroid ឺ: disease, diseases, sunshine, ill, the menu'

    expect(stripHtml(input)).toBe(expected)
  })

  it('should trim and collapse spaces', () => {
    const input = '  <B>Team</B> <BR> groups  '
    const expected = 'Team groups'

    expect(stripHtml(input)).toBe(expected)
  })

  it('should handle empty tags for line breaks', () => {
    const input = "<B><font color='brown'>retardant</font></B><BR>"
    const expected = 'retardant'

    expect(stripHtml(input)).toBe(expected)
  })

  it('should handle complex nesting', () => {
    const input = '<div><span>Hello</span><p>World</p></div>'
    const expected = 'Hello World'

    expect(stripHtml(input)).toBe(expected)
  })
})
