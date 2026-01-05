import * as fs from "fs"
import { strToKhmerWordOrThrow, TypedKhmerWord } from "./utils/khmer-word"

export class DictionaryManager {
  private knownWords = new Set<TypedKhmerWord>()

  constructor(private filePath: string) {}

  public load(): number {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, "utf-8")
        const words = content
          .split(/\r?\n/)
          .map((w) => w.trim())
          .filter((w) => w.length > 0)
          .map(strToKhmerWordOrThrow)

        this.knownWords.clear()
        words.forEach((w) => this.knownWords.add(w))
      } else {
        this.knownWords.clear()
      }
    } catch (err) {
      console.error("Error loading dictionary", err)
    }
    return this.knownWords.size
  }

  public getWords(): Set<TypedKhmerWord> {
    return this.knownWords
  }

  public add(word: TypedKhmerWord): boolean {
    if (this.knownWords.has(word)) return false

    try {
      let currentContent = ""
      if (fs.existsSync(this.filePath)) {
        currentContent = fs.readFileSync(this.filePath, "utf-8")
      }
      const newContent = word + "\n" + currentContent
      fs.writeFileSync(this.filePath, newContent, "utf-8")

      this.knownWords.add(word)
      return true
    } catch (e) {
      throw e
    }
  }
}
