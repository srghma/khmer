#!/usr/bin/env node

import * as fs from "fs";

// Types
interface DictionaryEntry {
  khmerWord: string;
  content: string; // All text until next entry
}

interface GroupedEntry {
  khmerWord: string;
  allContent: string[]; // Multiple definitions if word appears multiple times
}

// Khmer Unicode range: U+1780 to U+17FF
const KHMER_PATTERN = /^[\u1780-\u17FF\s]+$/;

// Check if text contains only Khmer characters (and spaces)
const isKhmerText = (text: string): boolean => KHMER_PATTERN.test(text.trim());

// Extract Khmer word from bold markdown
const extractKhmerWord = (line: string): string | null => {
  const match = line.match(/^\*\*([^*]+)\*\*/);
  if (!match) return null;

  const word = match[1].trim();
  return isKhmerText(word) ? word : null;
};

// Remove page markers
const removePageMarkers = (content: string): string =>
  content.replace(/^### Страница \d+\n*/gm, "");

// Split content into entries by Khmer headwords
const splitIntoEntries = (content: string): DictionaryEntry[] => {
  const entries: DictionaryEntry[] = [];
  const lines = content.split("\n");

  let currentWord: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const khmerWord = extractKhmerWord(line);

    if (khmerWord) {
      // Save previous entry
      if (currentWord && currentContent.length > 0) {
        entries.push({
          khmerWord: currentWord,
          content: currentContent.join("\n").trim(),
        });
      }

      // Start new entry
      currentWord = khmerWord;
      currentContent = [line];
    } else if (currentWord) {
      // Continue current entry
      currentContent.push(line);
    }
  }

  // Don't forget last entry
  if (currentWord && currentContent.length > 0) {
    entries.push({
      khmerWord: currentWord,
      content: currentContent.join("\n").trim(),
    });
  }

  return entries;
};

// Group entries by Khmer word
const groupByKhmerWord = (entries: DictionaryEntry[]): GroupedEntry[] => {
  const grouped = new Map<string, string[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.khmerWord) || [];
    existing.push(entry.content);
    grouped.set(entry.khmerWord, existing);
  }

  return Array.from(grouped.entries()).map(([khmerWord, allContent]) => ({
    khmerWord,
    allContent,
  }));
};

// Convert markdown to HTML
const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Bold: **text** -> <b>text</b>
  html = html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

  // Italic: *text* -> <i>text</i>
  html = html.replace(/\*([^*]+)\*/g, "<i>$1</i>");

  // Diamond markers -> ◊
  html = html.replace(/\$\\diamond\$/g, "◊");

  // Newlines -> <br>
  html = html.replace(/\n/g, "<br>");

  // Multiple <br> -> paragraph spacing
  html = html.replace(/(<br>){3,}/g, "<br><br>");

  return html;
};

// Format grouped entry for StarDict
const formatForStarDict = (grouped: GroupedEntry): string => {
  const definitions = grouped.allContent.map((content, index) => {
    const html = markdownToHtml(content);

    if (grouped.allContent.length > 1) {
      // Multiple entries for same word
      return `<div style="margin-bottom: 1em;"><b>[${index + 1}]</b><br>${html}</div>`;
    }
    return html;
  });

  return definitions.join("<hr>");
};

// Main conversion function
const convertToStarDict = (inputFile: string, outputFile: string): void => {
  console.log(`Reading file: ${inputFile}`);

  const content = fs.readFileSync(inputFile, "utf8");
  const cleanedContent = removePageMarkers(content);

  console.log("Extracting entries...");
  const entries = splitIntoEntries(cleanedContent);
  console.log(`Found ${entries.length} entries`);

  console.log("Grouping by Khmer word...");
  const grouped = groupByKhmerWord(entries);
  console.log(`Grouped into ${grouped.length} unique Khmer words`);

  console.log("Converting to StarDict format...");
  const stardictLines = grouped.map((group) => {
    const headword = group.khmerWord;
    const definition = formatForStarDict(group);

    // StarDict tab format: word\tdefinition
    return `${headword}\t${definition}`;
  });

  // Sort by Khmer word for better organization
  stardictLines.sort((a, b) => {
    const wordA = a.split("\t")[0];
    const wordB = b.split("\t")[0];
    return wordA.localeCompare(wordB, "km");
  });

  fs.writeFileSync(outputFile, stardictLines.join("\n"), "utf8");

  console.log(`\n✓ Conversion complete!`);
  console.log(`  Total entries: ${entries.length}`);
  console.log(`  Unique words: ${grouped.length}`);
  console.log(`  Multiple definitions: ${entries.length - grouped.length}`);
  console.log(`  Output: ${outputFile}`);

  console.log(`\nTo convert to StarDict binary format:`);
  console.log(
    `  2. Convert: pyglossary './Краткий русско-кхмерский словарь--content.tab' '/home/srghma/projects/khmer-dicts/Краткий русско-кхмерский словарь--content.slob' --read-format=Tabfile --write-format=Aard2Slob`,
  );
};

// Show sample of what was extracted
const showSamples = (inputFile: string, count: number = 5): void => {
  const content = fs.readFileSync(inputFile, "utf8");
  const cleanedContent = removePageMarkers(content);
  const entries = splitIntoEntries(cleanedContent);
  const grouped = groupByKhmerWord(entries);

  console.log(`\n=== Sample Entries (first ${count}) ===\n`);

  for (let i = 0; i < Math.min(count, grouped.length); i++) {
    const group = grouped[i];
    console.log(`Khmer: ${group.khmerWord}`);
    console.log(`Definitions: ${group.allContent.length}`);
    console.log(`Preview: ${group.allContent[0].substring(0, 100)}...`);
    console.log("---");
  }
};

// CLI interface
const main = (): void => {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node script.js <input-file> [output-file] [--sample]");
    console.log("\nExamples:");
    console.log("  node script.js dictionary.txt");
    console.log("  node script.js dictionary.txt output.tab");
    console.log("  node script.js dictionary.txt --sample");
    process.exit(1);
  }

  const inputFile = args[0];
  const hasSampleFlag = args.includes("--sample");
  const outputFile =
    args[1] && !args[1].startsWith("--")
      ? args[1]
      : inputFile.replace(/\.[^.]+$/, ".tab");

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    if (hasSampleFlag) {
      showSamples(inputFile, 10);
    } else {
      convertToStarDict(inputFile, outputFile);
    }
  } catch (error) {
    console.error("Error during conversion:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}
