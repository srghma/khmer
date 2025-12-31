#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

// Types
interface PartOfSpeech {
  type: string; // гл., сущ., прил., нареч., etc.
  definitions: Definition[];
}

interface Definition {
  number: string; // "1)", "2)", "a)", "б)"
  text: string;
  examples: Example[];
  subDefinitions?: Definition[];
}

interface Example {
  khmer: string;
  transcription: string;
  russian: string;
}

interface SetExpression {
  marker: string; // "$\diamond$" or diamond symbol
  content: string;
}

interface DictionaryEntry {
  headword: string;
  romanNumber?: string; // I, II, III for homonyms
  pronunciation: string;
  partsOfSpeech: PartOfSpeech[];
  setExpressions: SetExpression[];
  rawText: string;
}

interface Page {
  number: number;
  content: string;
}

// Constants
const PART_OF_SPEECH_PATTERN = /\*([^*]+)\*/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const DIAMOND_MARKERS = ["$\\diamond$", "◊", "⋄", "♦"];

// Utility: Extract pages from content
const extractPages = (content: string): Page[] => {
  const pagePattern = /### Страница (\d+)\n\n([\s\S]*?)(?=### Страница \d+|$)/g;
  const pages: Page[] = [];
  let match: RegExpExecArray | null;

  while ((match = pagePattern.exec(content)) !== null) {
    pages.push({
      number: parseInt(match[1], 10),
      content: match[2].trim(),
    });
  }

  return pages;
};

// Utility: Join pages to handle entries that span multiple pages
const joinPages = (pages: Page[]): string => {
  return pages
    .sort((a, b) => a.number - b.number)
    .map((page) => page.content)
    .join("\n\n");
};

// Utility: Split content into entries
const splitIntoEntries = (content: string): string[] => {
  // Split on lines that start with ** (bold headword)
  const entries: string[] = [];
  const lines = content.split("\n");
  let currentEntry = "";

  for (const line of lines) {
    if (
      line.startsWith("**") &&
      line.includes("**") &&
      currentEntry.length > 0
    ) {
      // New entry starts, save previous
      if (currentEntry.trim()) {
        entries.push(currentEntry.trim());
      }
      currentEntry = line;
    } else {
      currentEntry += "\n" + line;
    }
  }

  // Don't forget the last entry
  if (currentEntry.trim()) {
    entries.push(currentEntry.trim());
  }

  return entries.filter((e) => e.trim().length > 0);
};

// Utility: Extract headword and pronunciation
const extractHeadword = (
  firstLine: string,
): {
  headword: string;
  romanNumber: string | undefined;
  pronunciation: string;
} | null => {
  // Pattern: **កក** kɑ:k I *гл.*
  const match = firstLine.match(/^\*\*([^*]+)\*\*\s+([^\s]+)(?:\s+([IVX]+))?/);

  if (!match) return null;

  return {
    headword: match[1].trim(),
    pronunciation: match[2].trim(),
    romanNumber: match[3]?.trim(),
  };
};

// Utility: Check if text contains diamond marker
const containsDiamondMarker = (text: string): boolean => {
  return DIAMOND_MARKERS.some((marker) => text.includes(marker));
};

// Utility: Extract parts of speech and definitions
const parseEntry = (entryText: string): DictionaryEntry | null => {
  const lines = entryText.split("\n").filter((line) => line.trim());

  if (lines.length === 0) return null;

  const headwordInfo = extractHeadword(lines[0]);
  if (!headwordInfo) return null;

  const partsOfSpeech: PartOfSpeech[] = [];
  const setExpressions: SetExpression[] = [];
  let currentPos: PartOfSpeech | null = null;
  let fullText = lines.join(" ");

  // Extract parts of speech
  const posMatches = [...fullText.matchAll(/\*([^*]+)\*/g)];

  for (const posMatch of posMatches) {
    const posType = posMatch[1];

    // Common parts of speech
    if (
      /^(гл|сущ|прил|нареч|частица|звукоподр|сч\. слово|см|уст|диал|бот|разг|перен)\.*/.test(
        posType,
      )
    ) {
      currentPos = {
        type: posType,
        definitions: [],
      };
      partsOfSpeech.push(currentPos);
    }
  }

  // Extract set expressions (diamond markers)
  for (const marker of DIAMOND_MARKERS) {
    if (fullText.includes(marker)) {
      const parts = fullText.split(marker);
      for (let i = 1; i < parts.length; i++) {
        // Extract text after diamond until next major punctuation or entry
        const exprMatch = parts[i].match(/^([^;.]+(?:[;.][^;.]+)?)/);
        if (exprMatch) {
          setExpressions.push({
            marker,
            content: exprMatch[1].trim(),
          });
        }
      }
    }
  }

  return {
    headword: headwordInfo.headword,
    romanNumber: headwordInfo.romanNumber,
    pronunciation: headwordInfo.pronunciation,
    partsOfSpeech,
    setExpressions,
    rawText: entryText,
  };
};

// Utility: Format entry for StarDict tab format
const formatForStarDict = (entry: DictionaryEntry): string => {
  let definition = "";

  // Add roman numeral if exists (for homonyms)
  if (entry.romanNumber) {
    definition += `<b>${entry.romanNumber}</b> `;
  }

  // Add pronunciation
  definition += `<i>[${entry.pronunciation}]</i><br><br>`;

  // Add parts of speech
  for (const pos of entry.partsOfSpeech) {
    definition += `<i>${pos.type}</i><br>`;
  }

  // Add set expressions
  if (entry.setExpressions.length > 0) {
    definition += "<br><b>◊ Устойчивые выражения:</b><br>";
    for (const expr of entry.setExpressions) {
      definition += `• ${expr.content}<br>`;
    }
  }

  // Add raw text for full context
  definition += `<br><br><details><summary>Полный текст</summary><pre>${entry.rawText}</pre></details>`;

  return definition;
};

// Utility: Clean and normalize text
const cleanText = (text: string): string => {
  return text
    .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
    .replace(/\s{2,}/g, " ") // Normalize spaces
    .trim();
};

// Enhanced version with better entry joining
const convertToStarDictEnhanced = (
  inputFile: string,
  outputFile: string,
): void => {
  console.log(`Reading file: ${inputFile}`);

  const content = fs.readFileSync(inputFile, "utf8");

  // First, handle page breaks within entries
  const normalized = content.replace(/\n### Страница \d+\n\n/g, "\n");

  const entries = splitIntoEntries(normalized);
  console.log(`Found ${entries.length} entries`);

  const stardictEntries: string[] = [];
  const statistics = {
    total: entries.length,
    withPOS: 0,
    withSetExpr: 0,
    withRomanNum: 0,
    failed: 0,
  };

  for (const entryText of entries) {
    const entry = parseEntry(entryText);

    if (entry) {
      if (entry.partsOfSpeech.length > 0) statistics.withPOS++;
      if (entry.setExpressions.length > 0) statistics.withSetExpr++;
      if (entry.romanNumber) statistics.withRomanNum++;

      const headword = entry.headword;
      const definition = formatForStarDict(entry);
      stardictEntries.push(`${headword}\t${definition}`);
    } else {
      statistics.failed++;
    }
  }

  fs.writeFileSync(outputFile, stardictEntries.join("\n"), "utf8");

  console.log(`\n=== Conversion Statistics ===`);
  console.log(`Total entries: ${statistics.total}`);
  console.log(`With parts of speech: ${statistics.withPOS}`);
  console.log(`With set expressions (◊): ${statistics.withSetExpr}`);
  console.log(`With roman numerals (homonyms): ${statistics.withRomanNum}`);
  console.log(`Failed to parse: ${statistics.failed}`);
  console.log(`\nOutput: ${outputFile}`);
};

// CLI interface
const main = (): void => {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node script.js <input-file> [output-file]");
    console.log("\nExample:");
    console.log("  node script.js dictionary.txt dictionary.tab");
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.[^.]+$/, ".tab");

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    convertToStarDictEnhanced(inputFile, outputFile);
  } catch (error) {
    console.error("Error during conversion:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}
