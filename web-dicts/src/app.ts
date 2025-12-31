const KHMER_BLOCK_REGEX = /[\p{Script=Khmer}]+/gu;

export function isKhmer(text: string): boolean {
  return /[\p{Script=Khmer}]/u.test(text);
}

export function renderColoredText(
  fullText: string,
  mode: "Dictionary" | "Segmenter",
  knownWords: Set<string>,
): string {
  // We process line by line to keep UI responsive if we were doing async,
  // but here we do a bulk replace for the blocks.

  // 1. Identify Khmer blocks
  return fullText.replace(KHMER_BLOCK_REGEX, (match) => {
    const words = khmerSentenceToWords_usingSegmenter(match);

    let html = "";
    let wordCounter = 0;

    words.forEach((w) => {
      // Determine color class
      let cls = "";

      if (mode === "Segmenter") {
        // Just cycle colors for every segment
        cls = `color-${wordCounter % 5}`;
        wordCounter++;
      } else {
        // Dictionary Mode
        if (knownWords.has(w)) {
          cls = `color-${wordCounter % 5} known`;
          wordCounter++;
        } else {
          // Check if it's actually just space/punctuation
          if (!isKhmer(w)) {
            cls = "neutral";
          } else {
            cls = "unknown";
          }
        }
      }

      html += `<span class="${cls}">${w}</span>`;
    });

    return html;
  });
}

// This will be injected by the build script via esbuild define or window object
declare const RAW_DICTIONARY_LIST: string[];
declare const RAW_CONTENT_ID: string;

const STATE = {
  mode: "Dictionary" as "Dictionary" | "Segmenter",
  dictionary: new Set(RAW_DICTIONARY_LIST),
};

function init() {
  const container = document.getElementById("text-container");
  const rawDataElement = document.getElementById(RAW_CONTENT_ID);
  const toggleBtn = document.getElementById("toggle-mode");
  const statusLabel = document.getElementById("status-label");

  if (!container || !rawDataElement || !toggleBtn || !statusLabel) return;

  const rawText = rawDataElement.textContent || "";

  const render = () => {
    statusLabel.textContent = `Mode: ${STATE.mode} (Rendering...)`;

    // Allow UI to update before heavy lifting
    requestAnimationFrame(() => {
      const html = renderColoredText(rawText, STATE.mode, STATE.dictionary);
      container.innerHTML = html;
      statusLabel.textContent = `Mode: ${STATE.mode}`;
    });
  };

  toggleBtn.addEventListener("click", () => {
    STATE.mode = STATE.mode === "Dictionary" ? "Segmenter" : "Dictionary";
    render();
  });

  // Initial Render
  render();
}

document.addEventListener("DOMContentLoaded", init);
