#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
const { execSync } = require("child_process");
const os = require("os");
const Diff = require("diff");
const chalk = require("chalk");

// const totalPages = 884
const totalPages = 863;

// Function to print character-level colorized diff
function printCharDiff(a, b) {
  const diff = Diff.diffChars(a, b); // character-level diff
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
}

// Utility to read the file content
var readFileContent = function (filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, "utf8", function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
};

/**
 * Extracts page data from content by splitting on page markers and extracting page numbers
 * Handles formats: "### Страница xxx", "### Page xxx", "### **Page 307**"
 * @param {string} content - The file content to parse
 * @returns {Array<[number, string]>} Array of [pageNumber, pageContent] tuples
 */
var extractPageData = function (content) {
  // Split using regex that captures all page formats
  var parts = content
    .split(/(### (?:\*\*)?(?:Страница|Page) \d+(?:\*\*)?)/i)
    .filter(Boolean);

  return (function processPages(parts) {
    var pages = [];

    for (var i = 0; i < parts.length; i++) {
      var marker = parts[i];

      if (/### (?:\*\*)?(?:Страница|Page) \d+(?:\*\*)?/i.test(marker)) {
        // Extract page number from any format
        var match = marker.match(/\d+/);
        var pageNumber = match ? parseInt(match[0]) : null;

        if (pageNumber !== null) {
          // Get content after the page marker
          var pageContent = parts[i + 1] ? parts[i + 1].trim() : "";
          pages.push([pageNumber, pageContent]);
          i++; // Skip the content next to the page marker
        }
      }
    }

    return pages;
  })(parts);
};

// Utility to find pages with no content
var findPagesWithoutContent = function (pages) {
  return pages.filter(function (page) {
    return page[1].length === 0; // Check if content is empty
  });
};

// Utility to find pages with content but no '**' (i.e., `**` doesn't exist in content)
var findPagesWithContentHasNoTwoStars = function (pages) {
  return pages.filter(function (page) {
    return page[1].indexOf("**") === -1; // Check if content does not contain `**`
  });
};

// Utility to find the ten shortest pages by content length
var findTenShortestPages = function (pages) {
  return pages
    .sort(function (a, b) {
      return a[1].length - b[1].length; // Sort by content length (ascending)
    })
    .slice(0, 10); // Take the first 10 shortest pages
};

// ANSI escape codes for color
const GREEN = "\x1b[32m"; // Green for page number
const BLUE = "\x1b[34m"; // Blue for content
const RESET = "\x1b[0m"; // Reset color

// Utility to find missing pages by comparing the pages we have with the full range
var findMissingPages = function (pages) {
  var missingPages = [];

  // Generate a complete set of pages from 1 to `totalPages`
  var allPages = new Set([...Array(totalPages).keys()].map((i) => i + 1));

  // Remove the pages we have from the complete set
  pages.forEach((page) => allPages.delete(page));

  // Convert the remaining pages to an array
  missingPages = Array.from(allPages);

  return missingPages;
};

// Utility to group consecutive pages
var groupConsecutivePages = function (missingPages) {
  var groups = [];
  var group = [];

  missingPages.forEach((page, index) => {
    if (group.length === 0) {
      group.push(page);
    } else {
      // Check if the next page is consecutive
      if (page === group[group.length - 1] + 1) {
        group.push(page);
      } else {
        groups.push(group);
        group = [page];
      }
    }
  });

  // Add the last group
  if (group.length > 0) groups.push(group);

  return groups;
};

// Utility to format the groups into human-readable ranges
var formatMissingPages = function (groups) {
  return groups
    .map((group) => {
      if (group.length === 1) {
        return group[0].toString(); // Single page
      } else {
        return `${group[0]}-${group[group.length - 1]}`; // Page range
      }
    })
    .join(", ");
};

// Utility to sort pages by page number
var sortPagesByNumber = function (pages) {
  return pages.sort(function (a, b) {
    return a[0] - b[0]; // Sort by page number (ascending)
  });
};

// Utility to reformat the sorted pages into the original format
var formatSortedPages = function (sortedPages) {
  return sortedPages
    .map(function (page) {
      return `### Страница ${page[0]}\n\n${page[1]}`;
    })
    .join("\n\n"); // Join pages with two newlines as separator
};

// Utility to deduplicate pages with same page number AND content
var deduplicatePages = function (pages) {
  return (function removeDuplicates(pages) {
    var seen = {};

    return pages.filter(function (page) {
      var key = page[0] + "|" + page[1];
      if (seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    });
  })(pages);
};

// Utility to find duplicate page numbers
var findDuplicatePages = function (pages) {
  return (function groupByPageNumber(pages) {
    var pageMap = {};

    pages.forEach(function (page, index) {
      var pageNum = page[0];
      if (!pageMap[pageNum]) {
        pageMap[pageNum] = [];
      }
      pageMap[pageNum].push(index);
    });

    return Object.keys(pageMap)
      .filter(function (pageNum) {
        return pageMap[pageNum].length > 1;
      })
      .map(function (pageNum) {
        return [parseInt(pageNum), pageMap[pageNum].length];
      });
  })(pages);
};

// Utility to find pages with same content but different page numbers
var findSameContentDifferentPages = function (pages) {
  return (function groupByContent(pages) {
    var contentMap = {};

    pages.forEach(function (page) {
      var content = page[1];
      var pageNum = page[0];

      if (!contentMap[content]) {
        contentMap[content] = [];
      }
      contentMap[content].push(pageNum);
    });

    return Object.keys(contentMap)
      .filter(function (content) {
        return contentMap[content].length > 1 && content.length > 0;
      })
      .map(function (content) {
        return contentMap[content].sort(function (a, b) {
          return a - b;
        });
      });
  })(pages);
};

function writeTempFile(n, content) {
  const tmpFile = path.join(
    os.tmpdir(),
    // `tmp_page_${Date.now()}_${Math.random()}.txt`,
    `tmp_page_${n}.txt`,
  );
  fs.writeFileSync(tmpFile, content, "utf8");
  return tmpFile;
}

// Function to copy missing page images to a temp folder
function copyMissingPagesToTemp(missingPages, srcDir) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "missing_pages_"));
  console.log("Copying missing pages to temp dir:", tmpDir);

  missingPages.forEach((pageNum) => {
    // Format the page number with leading zeros (e.g., 018)
    const pageStr = pageNum.toString().padStart(3, "0");
    const srcFile = path.join(srcDir, `page-${pageStr}.png`);

    if (fs.existsSync(srcFile)) {
      const destFile = path.join(tmpDir, `page-${pageStr}.png`);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied page-${pageStr}.png`);
    } else {
      console.log(`Missing file not found: page-${pageStr}.png`);
    }
  });

  return tmpDir;
}

// Main logic to process the file
(function () {
  var filePath = "/home/srghma/Downloads/js-utils/concatenated_output.txt"; // Path to the input file

  (async function () {
    try {
      // Step 1: Read the content of the file
      var content = (await readFileContent(filePath)).replace(/---\n/g, "\n");

      // Step 2: Extract the page numbers and their corresponding content
      var pages = sortPagesByNumber(deduplicatePages(extractPageData(content)));

      // Step 3: Write the formatted content back to the file (overriding it)
      fs.writeFileSync(filePath, formatSortedPages(pages), "utf8");

      // Step 4: Find pages that have no content
      var pagesWithoutContent = findPagesWithoutContent(pages);
      if (pagesWithoutContent.length > 0) {
        console.log("Pages without content:");
        pagesWithoutContent.forEach(function (page) {
          console.log(`Page ${page[0]}`);
        });
      } else {
        console.log("All pages have content.");
      }

      // Step 5: Find pages with content but no '**'
      var pagesWithContentHasNoTwoStars =
        findPagesWithContentHasNoTwoStars(pages);
      if (pagesWithContentHasNoTwoStars.length > 0) {
        console.log("\nPages with content but no '**':");
        pagesWithContentHasNoTwoStars.forEach(function (page) {
          console.log(`Page ${page[0]}`);
        });
      } else {
        console.log("\nAll pages have '**' in their content.");
      }

      // Step 6: Find the 10 shortest pages by content length
      var tenShortestPages = findTenShortestPages(pages);
      if (tenShortestPages.length > 0) {
        console.log("\nTen shortest contents:");
        tenShortestPages.forEach(function (page) {
          // Print the page number and full content, colorized
          console.log(
            `${GREEN}Page ${page[0]}:${RESET}\n${BLUE}${page[1]}${RESET}\n`,
          );
        });
      } else {
        console.log("\nNo pages found.");
      }

      // Step 7: Find missing pages
      var missingPages = findMissingPages(pages.map((x) => x[0]));

      if (missingPages.length > 0) {
        // Group consecutive missing pages
        var groupedMissingPages = groupConsecutivePages(missingPages);

        // Format and print the missing pages
        console.log("Missing pages", missingPages.length, ":");
        console.log(formatMissingPages(groupedMissingPages));

        const srcDir = "/home/srghma/Downloads/Кхмерско-русский";
        const tempDir = copyMissingPagesToTemp(missingPages, srcDir);
        console.log("All available missing pages copied to:", tempDir);
      } else {
        console.log("No missing pages.");
      }

      // Step 9: Find same content but different page numbers
      var sameContentDifferentPages = findSameContentDifferentPages(pages);
      if (sameContentDifferentPages.length > 0) {
        console.log("\nSame content but different page numbers:");
        sameContentDifferentPages.forEach(function (pageNumbers) {
          console.log(`Pages ${pageNumbers.join(", ")} have identical content`);
        });
      } else {
        console.log("\nNo pages with same content but different page numbers.");
      }

      // Step 8: Find duplicate page numbers
      var duplicatePages = findDuplicatePages(pages);
      if (duplicatePages.length > 0) {
        console.log("\nPages with duplicate page numbers:");
        duplicatePages.forEach(function (dup) {
          console.log(`Page ${dup[0]} appears ${dup[1]} times`);
          // printCharDiff(dup[0], dup[1]);

          // Find all pages with that number
          const duplicates = pages.filter((p) => p[0] === dup[0]);

          // Compare each pair using system diff
          for (let i = 0; i < duplicates.length; i++) {
            for (let j = i + 1; j < duplicates.length; j++) {
              const fileA = writeTempFile(
                duplicates[i][0] + "_1",
                duplicates[i][1],
              );
              const fileB = writeTempFile(
                duplicates[j][0] + "_2",
                duplicates[j][1],
              );

              console.log(`Diff between duplicate contents of Page ${dup[0]}:`);
              try {
                // Use colordiff if installed, fallback to diff
                // execSync(`colordiff -u "${fileA}" "${fileB}"`, {
                execSync(`delta "${fileA}" "${fileB}"`, {
                  stdio: "inherit",
                });
              } catch (err) {
                // diff returns non-zero when differences exist
              }

              // Clean up temp files
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
    }
  })();
})();
