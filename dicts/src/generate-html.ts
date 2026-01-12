import fs from "fs"
import path from "path"

// --- Configuration ---
const DICT_PATH =
  "/home/srghma/projects/khmer/khmer-spellchecker/dictionary.txt"
const OUTPUT_FILE = "khmer_table_tts.html"

// --- Data Definitions ---

const consonantsGrid = [
  ["ក", "ខ", "គ", "ឃ", "ង"],
  ["ច", "ឆ", "ជ", "ឈ", "ញ"],
  ["ដ", "ឋ", "ឌ", "ឍ", "ណ"],
  ["ត", "ថ", "ទ", "ធ", "ន"],
  ["ប", "ផ", "ព", "ភ", "ម"],
  ["យ", "រ", "ល", "វ", ""],
  ["ស", "ហ", "ឡ", "អ", ""],
]

const vowelsGrid = [
  ["ា", "ិ", "ី", "ឹ", "ឺ"],
  ["ុ", "ូ", "ួ", "ើ", "ឿ"],
  ["ៀ", "េ", "ែ", "ៃ", "ោ"],
  ["ៅ", "ុំ", "ំ", "ាំ", "ះ"],
  ["ិះ", "ុះ", "េះ", "ោះ", ""],
]

const cleanVowel = (v) => v.replace(/^អ/, "")

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// --- Logic ---

const strToKhmerWordOrThrow = (str) => str.trim()

const loadSpellcheckerDict = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: Dict not found at ${filePath}. Returning empty set.`)
    return new Set()
  }
  const content = fs.readFileSync(filePath, "utf-8")
  return new Set(
    content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map(strToKhmerWordOrThrow),
  )
}

// --- HTML Generation ---

const generateHTML = () => {
  console.log("Loading dictionary...")
  const wordSet = loadSpellcheckerDict(DICT_PATH)
  const words = Array.from(wordSet)

  console.log(`Loaded ${words.length} words. Generating table with TTS...`)

  let html = `
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <title>Khmer Consonant-Vowel Matrix</title>
    <style>
        body { font-family: "Hanuman", "DaunPenh", sans-serif; padding: 20px; background-color: #f4f4f4; }

        /* Main Grid */
        .main-table { border-collapse: collapse; width: 100%; table-layout: fixed; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .main-table > tbody > tr > td {
            border: 2px solid #333;
            padding: 10px;
            vertical-align: top;
        }
        .consonant-header {
            font-size: 2em;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            color: #d32f2f;
        }

        /* Inner Vowel Grid */
        .vowel-table { width: 100%; border-collapse: collapse; }
        .vowel-table td {
            border: 1px solid #ddd;
            padding: 2px;
            text-align: center;
            height: 40px;
            vertical-align: middle;
            background: #fff;
        }
        .vowel-table td:hover { background-color: #e3f2fd; }

        /* Clickable Cell */
        .cell-btn {
            cursor: pointer;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 1.1em;
            text-decoration: none;
            color: #333;
        }
        .count { font-size: 0.6em; color: #888; margin-top: 2px; }
        .empty-cell { color: #eee; }

        /* Modal Styles */
        .modal-overlay {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0; top: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5);
            backdrop-filter: blur(2px);
        }
        .modal-content {
            background-color: #fefefe;
            margin: 5% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 60%;
            max-width: 800px;
            max-height: 80vh;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }
        .modal-title { font-size: 1.5em; font-weight: bold; color: #0066cc; }
        .close-btn { color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close-btn:hover { color: black; }

        .modal-body { overflow-y: auto; flex-grow: 1; }

        /* Word Grid in Modal */
        .word-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
        }
        .word-item {
            background: #f9f9f9;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #eee;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s;
            position: relative;
        }

        /* Word Item Hover/Active states */
        .word-item:hover {
            background-color: #e3f2fd;
            border-color: #2196f3;
            transform: translateY(-2px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .word-item:active {
            transform: translateY(0);
            background-color: #bbdefb;
        }
        .word-item::after {
            content: "🔊";
            font-size: 0.7em;
            position: absolute;
            top: 2px;
            right: 2px;
            opacity: 0.3;
        }

        /* Highlight Class */
        .hl { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Khmer Spellchecker Matrix</h1>
    <p>Click a combination to view words. <strong>Click a word to hear it.</strong></p>

    <table class="main-table">
`

  for (const row of consonantsGrid) {
    html += `<tr>`
    for (const consonant of row) {
      html += `<td>`
      if (consonant) {
        html += `<div class="consonant-header">${consonant}</div>`
        html += `<table class="vowel-table">`
        for (const vRow of vowelsGrid) {
          html += `<tr>`
          for (const vDisplay of vRow) {
            html += `<td>`
            if (vDisplay) {
              const vowelSuffix = cleanVowel(vDisplay)
              const combo = consonant + vowelSuffix

              const matches = words.filter((w) => w.includes(combo))
              matches.sort((a, b) => [...a].length - [...b].length)

              const matchesJson = escapeHtml(JSON.stringify(matches))

              if (matches.length > 0) {
                html += `
                                    <div class="cell-btn"
                                         onclick="openModal('${combo}', this)"
                                         data-words="${matchesJson}">
                                        <span>${combo}</span>
                                        <span class="count">${matches.length}</span>
                                    </div>
                                `
              } else {
                html += `<div class="cell-btn empty-cell"><span>${combo}</span></div>`
              }
            }
            html += `</td>`
          }
          html += `</tr>`
        }
        html += `</table>`
      }
      html += `</td>`
    }
    html += `</tr>`
  }

  html += `
    </table>

    <!-- Modal Structure -->
    <div id="wordModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <div id="modalTitle" class="modal-title"></div>
                <span class="close-btn" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div id="modalList" class="word-grid"></div>
            </div>
        </div>
    </div>

    <script>
        const modal = document.getElementById('wordModal');
        const titleEl = document.getElementById('modalTitle');
        const listEl = document.getElementById('modalList');

        // --- Text to Speech Function ---
        function speakWord(text) {
            if (!window.speechSynthesis) {
                alert("Your browser does not support Text-to-Speech.");
                return;
            }

            // Cancel any currently playing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Set language to Khmer
            utterance.lang = 'km-KH';

            // Optional: Adjust rate/pitch if needed
            utterance.rate = 0.9;

            window.speechSynthesis.speak(utterance);
        }

        function openModal(pattern, element) {
            const words = JSON.parse(element.getAttribute('data-words'));

            titleEl.textContent = pattern + " (" + words.length + ")";
            listEl.innerHTML = '';

            // Regex for highlighting
            const escapedPattern = pattern.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
            const regex = new RegExp(escapedPattern, 'g');
            const replacement = '<span class="hl">' + pattern + '</span>';

            words.forEach(word => {
                const div = document.createElement('div');
                div.className = 'word-item';
                div.title = "Click to listen";

                // Set the HTML with highlight
                div.innerHTML = word.replace(regex, replacement);

                // Add click listener for TTS
                // We use a closure here to capture the specific 'word'
                div.onclick = function() {
                    speakWord(word);
                };

                listEl.appendChild(div);
            });

            modal.style.display = "block";
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.style.display = "none";
            document.body.style.overflow = 'auto';
            window.speechSynthesis.cancel(); // Stop audio on close
        }

        window.onclick = function(event) {
            if (event.target == modal) closeModal();
        }

        document.onkeydown = function(evt) {
            if (evt.key === "Escape") closeModal();
        };
    </script>
</body>
</html>`

  fs.writeFileSync(OUTPUT_FILE, html)
  console.log(`Done! Open ${OUTPUT_FILE} in your browser.`)
}

// Run it
generateHTML()
