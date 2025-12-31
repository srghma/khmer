#!/usr/bin/env node

import { readFile } from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as os from "os";
import * as Diff from "diff";
import chalk from "chalk";
import { reorderText } from "khmer-normalize";
import { split } from "split-khmer";

import {
  Page,
  const_EMPTY,
  extractPageData,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/page";
import { assertIsDefinedAndReturn } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts";
import { strToNonNegativeIntOrThrow_strict } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber";
import { Set_mkOrThrowIfArrayIsNotUnique } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/sets";
import {
  ascNumber,
  sortBy_mutating,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/sort";
import { nonEmptyString_afterTrim } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed";

// --- CONFIGURATION ---
const ENABLE_KHMER_NORMALIZE = true;
const ENABLE_KHMER_SPLIT = false;
// ---------------------

// Types
type PageGroup = number[];
type DuplicateInfo = [number, number];

// Function to print character-level colorized diff
const printCharDiff = (a: string, b: string): void => {
  const diff = Diff.diffChars(a, b);
  diff.forEach((part) => {
    if (part.added) {
      process.stdout.write(chalk.green(part.value));
    } else if (part.removed) {
      process.stdout.write(chalk.red(part.value));
    } else {
      process.stdout.write(chalk.gray(part.value));
    }
  });
  console.log("\n" + "-".repeat(50) + "\n");
};

// Utility to find pages with no content
const findPagesWithoutContent = (pages: Page[]): Page[] =>
  pages.filter((page) => page[1].length === 0);

// Utility to find pages with content but no '**' and no EMPTY
const findPagesWithContentHasNoTwoStars = (pages: Page[]): Page[] =>
  pages.filter(
    (page) => page[1] !== const_EMPTY && page[1].indexOf("**") === -1,
  );

// Utility to find missing pages within an inclusive range
const findMissingPages = (
  pageNumbers: number[],
  shouldBePresentStartingPage: number,
  shouldBePresentEndPage: number,
): number[] => {
  const allPages = new Set<number>();

  for (let p = shouldBePresentStartingPage; p <= shouldBePresentEndPage; p++) {
    allPages.add(p);
  }

  pageNumbers.forEach((page) => allPages.delete(page));
  return Array.from(allPages).sort((a, b) => a - b);
};

// Utility to group consecutive pages
const groupConsecutivePages = (missingPages: number[]): PageGroup[] => {
  const groups: PageGroup[] = [];
  let group: PageGroup = [];

  missingPages.forEach((page) => {
    if (group.length === 0) {
      group.push(page);
    } else {
      if (page === assertIsDefinedAndReturn(group[group.length - 1]) + 1) {
        group.push(page);
      } else {
        groups.push(group);
        group = [page];
      }
    }
  });

  if (group.length > 0) groups.push(group);
  return groups;
};

// Utility to format the groups into human-readable ranges
const formatMissingPages = (groups: PageGroup[]): string =>
  groups
    .map((group) =>
      group.length === 1
        ? assertIsDefinedAndReturn(group[0]).toString()
        : `${group[0]}-${group[group.length - 1]}`,
    )
    .join(", ");

// Utility to sort pages by page number
const sortPagesByNumber = (pages: Page[]): Page[] =>
  sortBy_mutating(pages, ([numb]) => numb, ascNumber);

// Utility to reformat the sorted pages into the original format
const formatSortedPages = (sortedPages: Page[]): string =>
  sortedPages
    .map((page) => `### Страница ${page[0]}\n\n${page[1]}`)
    .join("\n\n");

// Utility to deduplicate pages with same page number AND content
const deduplicatePages = (pages: Page[]): Page[] => {
  const seen = new Set<string>();
  return pages.filter(([num, content]) => {
    const key = `${num}|${content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Utility to find duplicate page numbers
const findDuplicatePages = (pages: Page[]): DuplicateInfo[] => {
  const pageMap: Record<number, number[]> = {};
  pages.forEach((page, index) => {
    const pageNum = page[0];
    if (!pageMap[pageNum]) {
      pageMap[pageNum] = [];
    }
    pageMap[pageNum].push(index);
  });
  return Object.keys(pageMap)
    .filter(
      (pageNum) =>
        assertIsDefinedAndReturn(
          pageMap[strToNonNegativeIntOrThrow_strict(pageNum)],
        ).length > 1,
    )
    .map((pageNum) => [
      parseInt(pageNum, 10),
      assertIsDefinedAndReturn(
        pageMap[strToNonNegativeIntOrThrow_strict(pageNum)],
      ).length,
    ]);
};

// Utility to find pages with same content but different page numbers
const findSameContentDifferentPages = (pages: Page[]): number[][] => {
  const map = new Map<string, number[]>();

  for (const [num, content] of pages) {
    if (!content) throw new Error("impossible");
    if (content === const_EMPTY) continue;
    const list = map.get(content) ?? [];
    list.push(num);
    map.set(content, list);
  }

  return [...map.values()]
    .filter((nums) => nums.length > 1)
    .map((nums) => nums.sort((a, b) => a - b));
};

// Write temporary file for diff comparison
const writeTempFile = (n: string | number, content: string): string => {
  const tmpFile = path.join(os.tmpdir(), `tmp_page_${n}.txt`);
  fs.writeFileSync(tmpFile, content, "utf8");
  return tmpFile;
};

// Function to copy missing page images to a temp folder
const copyMissingPagesToTemp = (
  missingPages: number[],
  srcDir: string,
): string => {
  const tmpDir = path.join(os.tmpdir(), "missing_pages");

  // Clean temp directory first
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log("Copying missing pages to temp dir:", tmpDir);

  missingPages.forEach((pageNum) => {
    const pageStr = pageNum.toString().padStart(3, "0");
    const srcFile = path.join(srcDir, `page-${pageStr}.png`);
    const destFile = path.join(tmpDir, `page-${pageStr}.png`);

    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied page-${pageStr}.png`);
    } else {
      console.log(`Missing file not found: page-${pageStr}.png`);
    }
  });

  return tmpDir;
};

// Main logic to process the file
(async (): Promise<void> => {
  const filePath =
    "/home/srghma/projects/khmer/Кхмерско-русский словарь-Горгониев--content.txt";
  const shortPageButCorrect: Set<number> = Set_mkOrThrowIfArrayIsNotUnique([
    26, 38, 240, 230, 275, 539, 622, 792, 434,
  ]);
  const startPage = 23;
  const endPage = 836;

  // const filePath =
  //   "/home/srghma/projects/khmer/Краткий русско-кхмерский словарь--content.txt";
  // const shortPageButCorrect: Set<number> = Set_mkOrThrowIfArrayIsNotUnique([
  //   592, 121, 494, 258, 647, 255, 147, 205, 285, 548, 583,
  // ]);
  // const startPage = 35;
  // const endPage = 709;

  // DERIVE srcDir
  const srcDir = filePath.replace("--content.txt", "");

  // THROW IF DOESN'T EXIST
  if (!fs.existsSync(srcDir)) {
    console.error(
      chalk.red(`Error: Source directory does not exist: ${srcDir}`),
    );
    process.exit(1);
  }

  try {
    // Step 1: Read the content of the file
    const content = (await readFile(filePath, "utf8")).replace(/---\n/g, "\n");

    // Step 2: Extract the page numbers and their corresponding content
    let pages = sortPagesByNumber(deduplicatePages(extractPageData(content)));

    // =========================================================================
    // OPTIONAL: KHMER TEXT PROCESSING
    // =========================================================================
    if (ENABLE_KHMER_NORMALIZE) {
      console.log(chalk.yellow("Applying Khmer Normalization..."));
      pages = pages.map(([num, text]) => {
        try {
          return [num, nonEmptyString_afterTrim(reorderText(text))];
        } catch (e) {
          console.error(chalk.red(`Error normalizing page ${num}:`), e);
          return [num, text];
        }
      });
    }

    if (ENABLE_KHMER_SPLIT) {
      console.log(
        chalk.yellow(
          "Applying Khmer Word Splitting (Inserting Zero-Width Spaces)...",
        ),
      );
      pages = pages.map(([num, text]) => {
        try {
          const words = split(text);
          // Joining with Zero Width Space (\u200b) to allow word breaking without visual gaps.
          // Change to " " if you want visible spaces.
          return [num, nonEmptyString_afterTrim(words.join("\u200b"))];
        } catch (e) {
          console.error(chalk.red(`Error splitting page ${num}:`), e);
          return [num, text];
        }
      });
    }
    // =========================================================================

    // Step 3: Write the formatted content back to the file
    fs.writeFileSync(filePath, formatSortedPages(pages), "utf8");

    // Step 4: Find pages that have no content
    const pagesWithoutContent = findPagesWithoutContent(pages);
    if (pagesWithoutContent.length > 0) {
      console.log("Pages without content:");
      pagesWithoutContent.forEach((page) => {
        console.log(`Page ${page[0]}`);
      });
    } else {
      console.log("All pages have content.");
    }

    // Step 5: Find pages with content but no '**'
    const pagesWithContentHasNoTwoStars =
      findPagesWithContentHasNoTwoStars(pages);
    if (pagesWithContentHasNoTwoStars.length > 0) {
      console.log("\nPages with content but no '**' and no 'EMPTY':");
      pagesWithContentHasNoTwoStars.forEach((page) => {
        console.log(`Page ${page[0]}`);
      });
    } else {
      console.log("\nAll pages have '**' or 'EMPTY' in their content.");
    }

    // Step 6: Find the 10 shortest pages by content length
    const tenShortestPages = (() => {
      let p = pages.filter(
        ([number, _content]) => !shortPageButCorrect.has(number),
      );
      p = p.filter(([_number, content]) => content !== const_EMPTY);
      p = sortBy_mutating(p, ([_number, content]) => content.length, ascNumber);
      p = p.slice(0, 10);
      // p = sortBy_mutating(p, ([number, _content]) => number, ascNumber);
      return p;
    })();
    if (tenShortestPages.length > 0) {
      console.log(
        `\nTen shortest contents ${tenShortestPages.map((x) => x[0])}, minimum length=${Math.min(...tenShortestPages.map((x) => x[1].length))}, max length=${Math.max(...tenShortestPages.map((x) => x[1].length))}:`,
      );
      tenShortestPages.forEach((page) => {
        console.log(
          chalk.green(`Page ${page[0]}:`) + "\n" + chalk.blue(page[1]) + "\n",
        );
      });
    } else {
      console.log("\nNo pages found.");
    }

    // Step 7: Find missing pages
    const missingPages = findMissingPages(
      pages.map((x) => x[0]),
      startPage,
      endPage,
    );
    if (missingPages.length > 0) {
      const groupedMissingPages = groupConsecutivePages(missingPages);
      console.log("Missing pages", missingPages.length, ":");
      console.log(formatMissingPages(groupedMissingPages));

      // Use the derived srcDir
      const tempDir = copyMissingPagesToTemp(missingPages, srcDir);
      console.log("All available missing pages copied to:", tempDir);
    } else {
      console.log("No missing pages.");
    }

    // Step 8: Find same content but different page numbers
    const sameContentDifferentPages = findSameContentDifferentPages(pages);
    if (sameContentDifferentPages.length > 0) {
      console.log("\nSame content but different page numbers:");
      sameContentDifferentPages.forEach((pageNumbers) => {
        console.log(`Pages ${pageNumbers.join(", ")} have identical content`);
      });
    } else {
      console.log("\nNo pages with same content but different page numbers.");
    }

    // Step 9: Find duplicate page numbers
    const duplicatePages = findDuplicatePages(pages);
    if (duplicatePages.length > 0) {
      console.log("\nPages with duplicate page numbers:");
      sortBy_mutating(duplicatePages, (x) => x[0], ascNumber).forEach((dup) => {
        console.log(`Page ${dup[0]} appears ${dup[1]} times`);

        const duplicates = pages.filter((p) => p[0] === dup[0]);

        for (let i = 0; i < duplicates.length; i++) {
          for (let j = i + 1; j < duplicates.length; j++) {
            const fileA = writeTempFile(
              `${assertIsDefinedAndReturn(duplicates[i])[0]}_1`,
              assertIsDefinedAndReturn(duplicates[i])[1],
            );
            const fileB = writeTempFile(
              `${assertIsDefinedAndReturn(duplicates[j])[0]}_2`,
              assertIsDefinedAndReturn(duplicates[j])[1],
            );

            console.log(`Diff between duplicate contents of Page ${dup[0]}:`);
            try {
              execSync(`delta "${fileA}" "${fileB}"`, { stdio: "inherit" });
            } catch (err) {
              // diff returns non-zero when differences exist
            }

            fs.unlinkSync(fileA);
            fs.unlinkSync(fileB);
            console.log("-".repeat(50) + "\n");
          }
        }
      });
    } else {
      console.log("\nNo duplicate page numbers found.");
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();
