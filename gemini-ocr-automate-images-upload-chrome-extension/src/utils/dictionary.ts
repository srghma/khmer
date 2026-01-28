import * as fs from 'fs'
import { strToKhmerWordOrThrow, type TypedKhmerWord } from './khmer-word'
import { descNumber, sortBy_immutable_cached } from './sort'

export class DictionaryManager {
  private knownWords = new Set<TypedKhmerWord>()

  constructor(private filePath: string) {}

  public load(): number {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8')

        const words = sortBy_immutable_cached(
          content
            .split(/\r?\n/)
            .map(w => w.trim())
            .filter(w => w.length > 0)
            .map(strToKhmerWordOrThrow),
          a => Array.from(a).length,
          descNumber,
        )

        this.knownWords.clear()
        words.forEach(w => this.knownWords.add(w))
      } else {
        this.knownWords.clear()
      }
    } catch (err) {
      console.error('Error loading dictionary', err)
    }
    return this.knownWords.size
  }

  public getWords(): Set<TypedKhmerWord> {
    return this.knownWords
  }

  public add(word: TypedKhmerWord): boolean {
    if (this.knownWords.has(word)) return false
    fs.appendFileSync(this.filePath, word + '\n', 'utf-8')
    this.knownWords.add(word)
    return true
  }
}
