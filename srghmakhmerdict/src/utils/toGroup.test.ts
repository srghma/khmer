import { describe, it, expect } from 'vitest'
import { processData } from './toGroup'
import { nonEmptyString_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { extractKeysEn } from './keyExtractionGeneric'

const T = nonEmptyString_afterTrim

describe('toGroup.processData', () => {
  it('groups standard English words and separates others', () => {
    const words = [T('Apple'), T('Ant'), T('Bat'), T('123')]
    const result = processData(extractKeysEn, words)

    expect(result).toMatchInlineSnapshot(`
      {
        "groups": [
          {
            "letter": "A",
            "subGroups": [
              {
                "letter": "N",
                "words": [
                  "Ant",
                ],
              },
              {
                "letter": "P",
                "words": [
                  "Apple",
                ],
              },
            ],
          },
          {
            "letter": "B",
            "subGroups": [
              {
                "letter": "A",
                "words": [
                  "Bat",
                ],
              },
            ],
          },
        ],
        "other": [
          "123",
        ],
      }
    `)
  })

  it('groups words with missing second letter under the first letter', () => {
    const words = [T('A'), T('An')]
    const result = processData(extractKeysEn, words)

    expect(result).toMatchInlineSnapshot(`
      {
        "groups": [
          {
            "letter": "A",
            "subGroups": [
              {
                "letter": "A",
                "words": [
                  "A",
                ],
              },
              {
                "letter": "N",
                "words": [
                  "An",
                ],
              },
            ],
          },
        ],
        "other": [],
      }
    `)
  })
})
