import { describe, it, expect } from 'vitest'
import { wiktionary_km__get_short_info__only_en_or_ru_text_without_html } from './wiktionary-short-description-km-extractor'
import { wiktionary_ru__get_short_info__only_ru_text_without_html } from './wiktionary-short-description-ru-extractor'
import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

const mkHTML = (s: string) => s as NonEmptyStringTrimmed

describe('wiktionary_km extractor (English)', () => {
  it('should extract simple table definitions (Legacy format)', () => {
    const html1 = mkHTML(
      `<table><tbody><tr><td>&nbsp; </td></tr></tbody></table><table><tbody><tr><td> &nbsp; </td><td class="khbat12"> &nbsp; អំបូរ</td><td> &nbsp; &nbsp; </td><td class="text2">family; group<br></td></tr></tbody></table><br>`,
    )

    expect(wiktionary_km__get_short_info__only_en_or_ru_text_without_html(html1)).toBe('family; group')

    const html2 = mkHTML(
      `<table><tbody><tr><td> &nbsp; </td><td class="khbat12"> &nbsp; ឧសភា</td><td> &nbsp; &nbsp; </td><td class="text2">May (fifth month of the solar calendar associated with the zodiacal sign Taurus, the bull)<br></td></tr></tbody></table>`,
    )

    expect(wiktionary_km__get_short_info__only_en_or_ru_text_without_html(html2)).toBe(
      'May (fifth month of the solar calendar associated with the zodiacal sign Taurus, the bull)',
    )
  })

  it('should extract standard definition (Noun/Verb)', () => {
    const html = mkHTML(`
      <div class="mw-heading mw-heading3"><h3>Verb</h3></div>
      <p><span class="headword-line"><strong class="Khmr headword" lang="km">កក់</strong>...</span></p>
      <ol>
        <li>to <a href="/wiki/wash" title="wash">wash</a>, to <a href="/wiki/clean" title="clean">clean</a></li>
        <li>to <a href="/wiki/pay" title="pay">pay</a> an <a href="/wiki/advance" title="advance">advance</a>, to <a href="/wiki/book" title="book">book</a> <dl><dd>Example...</dd></dl></li>
      </ol>
      <div class="mw-heading mw-heading3"><h3>Noun</h3></div>
      <ol><li>kind of reed...</li></ol>
    `)

    const result = wiktionary_km__get_short_info__only_en_or_ru_text_without_html(html)

    expect(result).toMatchInlineSnapshot(`
      "Verb: 1. to wash, to clean; 2. to pay an advance, to book
      Noun: 1. kind of reed..."
    `)
  })

  it('should handle complex Etymologies and clean Khmer text (Long example)', () => {
    const html = mkHTML(`
      <div class="mw-heading mw-heading3"><h3>Etymology 1</h3></div>
      <div class="mw-heading mw-heading4"><h4>Noun</h4></div>
      <ol><li>accident; chance, coincidence <dl><dd><span lang="km">...</span></dd></dl></li></ol>
      <div class="mw-heading mw-heading4"><h4>Adjective</h4></div>
      <ol><li>to be random, accidental</li></ol>
      <div class="mw-heading mw-heading3"><h3>Etymology 2</h3></div>
      <div class="mw-heading mw-heading4"><h4>Verb</h4></div>
      <ol><li>to suggest, to inspire; to recall, to think</li></ol>
      <div class="mw-heading mw-heading4"><h4>Noun</h4></div>
      <ol><li>suggestion, inspiration</li></ol>
    `)

    const result = wiktionary_km__get_short_info__only_en_or_ru_text_without_html(html)

    expect(result).toMatchInlineSnapshot(`
      "Noun: 1. accident; chance, coincidence
      Adjective: 1. to be random, accidental
      Verb: 1. to suggest, to inspire; to recall, to think
      Noun: 1. suggestion, inspiration"
    `)
  })
})

describe('wiktionary_ru extractor (Russian)', () => {
  it('should extract definitions from Meaning section', () => {
    const html = mkHTML(`
      <div class="mw-heading mw-heading3"><h3>Морфологические и синтаксические свойства</h3></div>
      <p>Существительное.</p>
      <div class="mw-heading mw-heading3"><h3>Семантические свойства</h3></div>
      <div class="mw-heading mw-heading4"><h4>Значение</h4></div>
      <ol>
        <li><a href="...">событие</a> <span class="example-fullblock"><span>◆</span> Отсутствует пример...</span></li>
      </ol>
    `)

    const result = wiktionary_ru__get_short_info__only_ru_text_without_html(html)

    expect(result).toMatchInlineSnapshot(`"Значение: 1. событие"`)
  })
})
