import fs from "fs"

// --- Configuration ---
const DICT_PATH =
  "/home/srghma/projects/khmer/khmer-spellchecker/dictionary.txt"
const OUTPUT_FILE = "khmer_complex_view.html"

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

const supplementaryConsonants = [
  "ហ្គ",
  "ហ្គ៊",
  "ហ្ន",
  "ប៉",
  "ហ្ម",
  "ហ្ល",
  "ហ្វ",
  "ហ្វ៊",
  "ហ្ស",
  "ហ្ស៊",
]

const independentVowels = [
  "ឥ",
  "ឦ",
  "ឧ",
  "ឨ",
  "ឩ",
  "ឪ",
  "ឫ",
  "ឬ",
  "ឭ",
  "ឮ",
  "ឯ",
  "ឰ",
  "ឱ",
  "ឲ",
  "ឳ",
]

const aSeriesSet = new Set([
  "ក",
  "ខ",
  "ច",
  "ឆ",
  "ដ",
  "ឋ",
  "ណ",
  "ត",
  "ថ",
  "ប",
  "ផ",
  "ស",
  "ហ",
  "ឡ",
  "អ",
  "ហ្ន",
  "ប៉",
  "ហ្ម",
  "ហ្ល",
  "ហ្វ",
  "ហ្ស",
])

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

const segmenter = new Intl.Segmenter("km", { granularity: "grapheme" })

const filterWordsByGrapheme = (allWords, targetGrapheme) => {
  return allWords.filter((word) => {
    const segments = segmenter.segment(word)
    for (const { segment } of segments) {
      if (segment === targetGrapheme) return true
    }
    return false
  })
}

// --- HTML Generation ---

const generateHTML = () => {
  console.log("Loading dictionary...")
  const wordSet = loadSpellcheckerDict(DICT_PATH)
  const words = Array.from(wordSet)

  console.log(`Loaded ${words.length} words. Generating HTML...`)

  const renderVowelTable = (consonant) => {
    let vTable = `<table class="vowel-table">`
    for (const vRow of vowelsGrid) {
      vTable += `<tr>`
      for (const vDisplay of vRow) {
        vTable += `<td>`
        if (vDisplay) {
          const vowelSuffix = cleanVowel(vDisplay)
          const combo = consonant + vowelSuffix

          const matches = filterWordsByGrapheme(words, combo)
          matches.sort((a, b) => [...a].length - [...b].length)

          const matchesJson = escapeHtml(JSON.stringify(matches))
          const cellId = `c-${combo}`
          const btnId = `btn-${cellId}`

          if (matches.length > 0) {
            vTable += `
                <div id="${btnId}" class="cell-btn"
                        onclick="toggleColumn('${cellId}', '${combo}')"
                        data-words="${matchesJson}">
                    <span>${combo}</span>
                    <span class="count">${matches.length}</span>
                </div>
            `
          } else {
            vTable += `<div class="cell-btn empty-cell"><span>${combo}</span></div>`
          }
        }
        vTable += `</td>`
      }
      vTable += `</tr>`
    }
    vTable += `</table>`
    return vTable
  }

  let html = `
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <title>Khmer Consonant-Vowel Complex View</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        body {
            font-family: "Hanuman", "DaunPenh", sans-serif;
            margin: 0; padding: 0;
            background-color: #f4f4f4;
            height: 100vh;
            display: flex;
            overflow: hidden;
        }

        .container { display: flex; width: 100%; height: 100%; }

        .left-panel {
            flex: 1; padding: 20px; overflow-y: auto; background: white;
        }

        /* RIGHT PANEL */
        .right-panel {
            position: fixed;
            right: 0;
            top: 0;
            height: 100vh;
            width: 0; /* Default hidden */
            background: #f8f9fa;
            border-left: 1px solid #ccc;
            box-shadow: -5px 0 15px rgba(0,0,0,0.1);
            z-index: 1000;
            display: flex;
            overflow-x: auto;
            transition: width 0.3s ease;
        }

        .right-panel.active {
            width: 600px; /* Standard Width */
        }

        /* NEW: Expanded State */
        .right-panel.active.expanded {
            width: 100%; /* Full Screen */
            border-left: none;
        }

        /* NEW: Toggle Button */
        .panel-toggle-btn {
            position: sticky;
            left: 0;
            top: 0;
            min-width: 30px;
            width: 30px;
            height: 30px;
            background: #333;
            color: white;
            cursor: pointer;
            z-index: 2000;
            display: none; /* Hidden when panel is closed */
            align-items: center;
            justify-content: center;
            border-bottom-right-radius: 5px;
        }
        .right-panel.active .panel-toggle-btn { display: flex; }
        .panel-toggle-btn:hover { background: #555; }


        h1, h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
        table { border-collapse: collapse; width: 100%; table-layout: fixed; margin-bottom: 30px; }
        .root-cell { border: 2px solid #444; padding: 8px; vertical-align: top; background-color: #fff; }

        .consonant-header { font-size: 2em; font-weight: bold; text-align: center; margin-bottom: 5px; }
        .type-a .consonant-header { color: #d32f2f; }
        .type-o .consonant-header { color: #1976d2; }

        .vowel-table { width: 100%; margin: 0; table-layout: fixed; }
        .vowel-table td { border: 1px solid #ddd; padding: 2px; text-align: center; height: 35px; font-size: 0.9em; }

        .cell-btn {
            cursor: pointer; height: 100%; width: 100%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .cell-btn:hover { background-color: #e3f2fd; }
        .cell-btn.active-state { background-color: #bbdefb; border: 1px solid #1976d2; }
        .count { font-size: 0.6em; color: #888; }
        .empty-cell { color: #eee; cursor: default; }

        .independent-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .ind-item {
            border: 1px solid #999; background: white; padding: 15px;
            font-size: 1.5em; text-align: center; cursor: pointer; border-radius: 4px;
        }
        .ind-item:hover { background-color: #e3f2fd; border-color: #2196f3; }
        .ind-item.active-state { background-color: #bbdefb; border-color: #000; }

        .result-column {
            min-width: 300px; max-width: 300px; background: white;
            border-right: 1px solid #ccc; display: flex; flex-direction: column; height: 100%;
            flex-shrink: 0;
        }
        .col-header {
            padding: 10px; background: #e9ecef; border-bottom: 1px solid #ccc;
            display: flex; justify-content: space-between; align-items: center;
            font-weight: bold; font-size: 1.2em; position: sticky; top: 0;
        }
        .col-close { cursor: pointer; color: #666; font-size: 1.5em; line-height: 0.8; padding: 0 5px; }
        .col-close:hover { color: red; background: #ddd; border-radius: 3px; }

        .col-body { flex: 1; overflow-y: auto; padding: 10px; }

        .word-card {
            background: #fff; border: 1px solid #eee; border-radius: 4px;
            padding: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;
        }
        .word-card:hover { border-color: #2196f3; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .word-text { font-size: 1.1em; cursor: text; margin-right: 5px; }
        .hl { color: red; font-weight: bold; }

        .icon-btn { cursor: pointer; color: #999; padding: 2px; margin-left: 2px; font-size: 18px; }
        .icon-btn:hover { color: #333; }
        .icon-google:hover { color: #4285F4; }
    </style>
</head>
<body>
    <div class="container">
        <!-- LEFT: The Matrix -->
        <div class="left-panel">
            <h1>Khmer Consonant-Vowel Matrix</h1>
            <p>
                <span style="color:#d32f2f">■ A-Series</span> |
                <span style="color:#1976d2">■ O-Series</span>
            </p>

            <h2>Main Consonants</h2>
            <table>
`

  for (const row of consonantsGrid) {
    html += `<tr>`
    for (const consonant of row) {
      html += `<td class="root-cell ${aSeriesSet.has(consonant) ? "type-a" : "type-o"}">`
      if (consonant) {
        html += `<div class="consonant-header">${consonant}</div>`
        html += renderVowelTable(consonant)
      }
      html += `</td>`
    }
    html += `</tr>`
  }
  html += `</table>`

  html += `<h2>Supplementary Consonants</h2><table>`
  let suppRow = []
  for (let i = 0; i < supplementaryConsonants.length; i++) {
    suppRow.push(supplementaryConsonants[i])
    if (suppRow.length === 5 || i === supplementaryConsonants.length - 1) {
      html += `<tr>`
      for (const cons of suppRow) {
        html += `<td class="root-cell ${aSeriesSet.has(cons) ? "type-a" : "type-o"}">`
        html += `<div class="consonant-header">${cons}</div>`
        html += renderVowelTable(cons)
        html += `</td>`
      }
      for (let k = suppRow.length; k < 5; k++)
        html += `<td class="root-cell"></td>`
      html += `</tr>`
      suppRow = []
    }
  }
  html += `</table>`

  html += `<h2>Independent Vowels / Characters</h2><div class="independent-grid">`
  for (const char of independentVowels) {
    const matches = filterWordsByGrapheme(words, char)
    matches.sort((a, b) => [...a].length - [...b].length)
    const matchesJson = escapeHtml(JSON.stringify(matches))
    const cellId = `c-${char}`
    const btnId = `btn-${cellId}`

    html += `
            <div id="${btnId}" class="ind-item"
                 onclick="toggleColumn('${cellId}', '${char}')"
                 data-words="${matchesJson}">
                ${char} <span class="count">(${matches.length})</span>
            </div>
        `
  }
  html += `</div><br><br>`

  html += `
        </div>

        <!-- RIGHT: The Deck -->
        <div class="right-panel" id="rightPanel">
            <!-- NEW: Static Toggle Button inside the panel -->
            <div class="panel-toggle-btn" onclick="togglePanelSize()" title="Toggle Fullscreen">
                <i id="toggleIcon" class="material-icons">fullscreen</i>
            </div>
            <!-- Columns injected here by JS -->
        </div>
    </div>

    <audio id="ttsAudio" style="display:none;"></audio>

    <script>
        const rightPanel = document.getElementById('rightPanel');
        const audioPlayer = document.getElementById('ttsAudio');
        const toggleIcon = document.getElementById('toggleIcon');

        function speakGoogle(text) {
            const url = "https://translate.google.com/translate_tts?ie=UTF-8&q=" + encodeURIComponent(text) + "&tl=km&client=tw-ob";
            audioPlayer.src = url;
            audioPlayer.play().catch(console.error);
        }

        // NEW: Toggle Size Function
        function togglePanelSize() {
            rightPanel.classList.toggle('expanded');
            if(rightPanel.classList.contains('expanded')) {
                toggleIcon.innerText = 'fullscreen_exit';
            } else {
                toggleIcon.innerText = 'fullscreen';
            }
        }

        function toggleColumn(cellId, title) {
            const btnId = 'btn-' + cellId;
            const colId = 'col-' + cellId;
            const btn = document.getElementById(btnId);
            const existingCol = document.getElementById(colId);

            if (existingCol) {
                existingCol.remove();
                if(btn) btn.classList.remove('active-state');
                checkPanelEmpty();
            } else {
                if(btn) {
                    btn.classList.add('active-state');
                    const words = JSON.parse(btn.getAttribute('data-words'));
                    addColumn(cellId, title, words);
                }
            }
        }

        function checkPanelEmpty() {
            // CHANGED: Count only result columns, ignore the toggle button
            const columns = document.querySelectorAll('.result-column');
            if (columns.length === 0) {
                rightPanel.classList.remove('active');
                rightPanel.classList.remove('expanded'); // Reset size on close
                toggleIcon.innerText = 'fullscreen';
            }
        }

        function addColumn(cellId, title, words) {
            rightPanel.classList.add('active');

            const col = document.createElement('div');
            col.className = 'result-column';
            col.id = 'col-' + cellId;

            const escapedPattern = title.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
            const regex = new RegExp(escapedPattern, 'g');
            const replacement = '<span class="hl">' + title + '</span>';

            const header = document.createElement('div');
            header.className = 'col-header';
            header.innerHTML = \`
                <span>\${title} <span style="font-size:0.8em; font-weight:normal;">(\${words.length})</span></span>
                <span class="col-close" onclick="toggleColumn('\${cellId}', '\${title}')">&times;</span>
            \`;

            const body = document.createElement('div');
            body.className = 'col-body';

            words.forEach(word => {
                const card = document.createElement('div');
                card.className = 'word-card';

                const txt = document.createElement('div');
                txt.className = 'word-text';
                txt.innerHTML = word.replace(regex, replacement);

                const actions = document.createElement('div');
                actions.style.display = 'flex';

                const btnVol = document.createElement('i');
                btnVol.className = 'material-icons icon-btn icon-google';
                btnVol.innerText = 'volume_up';
                btnVol.onclick = () => speakGoogle(word);

                const btnLink = document.createElement('a');
                btnLink.className = 'material-icons icon-btn';
                btnLink.innerText = 'launch';
                btnLink.style.textDecoration = 'none';
                btnLink.href = 'https://translate.google.com/?sl=km&text=' + encodeURIComponent(word);
                btnLink.target = '_blank';

                actions.appendChild(btnVol);
                actions.appendChild(btnLink);

                card.appendChild(txt);
                card.appendChild(actions);
                body.appendChild(card);
            });

            col.appendChild(header);
            col.appendChild(body);
            rightPanel.appendChild(col);
            rightPanel.scrollLeft = rightPanel.scrollWidth;
        }
    </script>
</body>
</html>`

  fs.writeFileSync(OUTPUT_FILE, html)
  console.log(`Done! Open ${OUTPUT_FILE} in your browser.`)
}

generateHTML()
