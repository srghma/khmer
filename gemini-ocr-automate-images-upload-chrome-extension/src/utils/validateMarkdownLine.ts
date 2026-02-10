import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import type { ValidNonNegativeInt } from './toNumber'

/**
 * Simple validator to ensure markdown symbols are balanced in a line.
 * Throws error if a line is malformed.
 */
export function validateMarkdownLine(line: string, lineNum: number) {
  const checkBalance = (char: string, name: string) => {
    const count = (line.match(new RegExp(char.replace(/[*`]/g, '\\$&'), 'g')) || []).length
    if (count % 2 !== 0) {
      throw new Error(`[Line ${lineNum}] Unbalanced ${name} (${char}): "${line}"`)
    }
  }

  checkBalance('**', 'Bold markers')
  checkBalance('`', 'Backticks')
}

export interface MarkdownValidationConfig {
  checkBold?: boolean // **
  checkBackticks?: boolean // `
  checkItalics?: boolean // *
  checkParens?: boolean // ()
  checkBrackets?: boolean // []
}

export function getLineErrors(line: string, context: string, config: MarkdownValidationConfig): string[] {
  const errors: string[] = []
  const count = (regex: RegExp) => (line.match(regex) || []).length

  if (config.checkBold && count(/\*\*/g) % 2 !== 0) {
    errors.push(`unbalanced bold (**)`)
  }

  if (config.checkBackticks && count(/`/g) % 2 !== 0) {
    errors.push(`unbalanced backticks (\`)`)
  }

  if (config.checkItalics) {
    const totalAsterisks = count(/\*/g)
    const doubleAsterisks = count(/\*\*/g)
    const singleAsterisks = totalAsterisks - doubleAsterisks * 2
    if (singleAsterisks % 2 !== 0) {
      errors.push(`unbalanced italics (*)`)
    }
  }

  if (config.checkParens && count(/\(/g) !== count(/\)/g)) {
    errors.push(`unbalanced parentheses ()`)
  }

  if (config.checkBrackets && count(/\[/g) !== count(/\]/g)) {
    errors.push(`unbalanced square brackets []`)
  }

  return errors.map(err => `[${context}] ${err}: "${line}"`)
}

/**
 * Validates all lines in the dictionary.
 * Collects all errors, prints them, and throws if any are found.
 */
export function validateMarkdownContent(
  nonEmptyPages: [ValidNonNegativeInt, NonEmptyStringTrimmed][],
  config: MarkdownValidationConfig,
): void {
  const allErrors: string[] = []

  for (const [pageNum, pageContent] of nonEmptyPages) {
    const lines = pageContent
      .split('\n')
      .map(l => l.trim())
      .filter(l => l !== '')

    lines.forEach((line, index) => {
      const lineErrors = getLineErrors(line, `Page ${pageNum}, Line ${index + 1}`, config)
      allErrors.push(...lineErrors)
    })
  }

  if (allErrors.length > 0) {
    console.error(`\n🛑 FOUND ${allErrors.length} FORMATTING ERRORS:`)
    allErrors.forEach(err => console.error(`  ${err}`))
    console.error(`\nTotal errors: ${allErrors.length}. Please fix the source file.`)
    throw new Error('Markdown validation failed.')
  }
}
