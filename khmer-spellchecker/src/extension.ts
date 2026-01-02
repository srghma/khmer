import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"
import { split } from "split-khmer"
import { reorderText } from "khmer-normalize"

export function activate(context: vscode.ExtensionContext) {
  console.log("Khmer Spellchecker is active")

  // --- State Variables ---
  let timeout: NodeJS.Timeout | undefined = undefined
  let activeEditor = vscode.window.activeTextEditor
  let isEnabled = true

  // Store current errors globally
  let currentUnknownRanges: vscode.Range[] = []

  // --- 0. UI Setup (Status Bar) ---
  const myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  )
  myStatusBarItem.command = "khmer-spellchecker.toggle"
  context.subscriptions.push(myStatusBarItem)

  const updateStatusBar = () => {
    if (isEnabled) {
      myStatusBarItem.text = "$(paintcan) Khmer: On"
      myStatusBarItem.tooltip = "Click to disable Khmer highlighting"
      myStatusBarItem.show()
    } else {
      myStatusBarItem.text = "$(circle-slash) Khmer: Off"
      myStatusBarItem.tooltip = "Click to enable Khmer highlighting"
      myStatusBarItem.show()
    }
  }
  updateStatusBar()

  // --- 1. Load Dictionary Logic ---
  const dictionaryPath = path.join(context.extensionPath, "dictionary.txt")
  let knownWords = new Set<string>()
  let MAX_CHAR_LENGTH = 50

  const loadDictionary = () => {
    try {
      if (fs.existsSync(dictionaryPath)) {
        const content = fs.readFileSync(dictionaryPath, "utf-8")
        const words = content
          .split(/\r?\n/)
          .map((w) => w.trim())
          .filter((w) => w.length > 0)

        knownWords.clear()
        let maxLen = 0

        words.forEach((word) => {
          knownWords.add(word)
          if (word.length > maxLen) maxLen = word.length
        })

        if (maxLen > 0) MAX_CHAR_LENGTH = maxLen
        console.log(
          `Loaded ${knownWords.size} words. Max length: ${MAX_CHAR_LENGTH}`,
        )
      } else {
        console.error("dictionary.txt not found, creating empty set.")
        knownWords.clear()
      }
    } catch (err) {
      console.error("Error reading dictionary:", err)
    }
  }

  loadDictionary()

  // --- 2. Initialize Intl.Segmenter ---
  const segmenter = new Intl.Segmenter("km", { granularity: "grapheme" })

  // --- 3. Color Palette ---
  const colorPalette = [
    "#569cd6", // Blue
    "#4ec9b0", // Soft Green
    "#c586c0", // Pink/Purple
    "#dcdcaa", // Soft Yellow
    "#ce9178", // Orange
  ]

  const knownDecorations = colorPalette.map((color) =>
    vscode.window.createTextEditorDecorationType({
      color: color,
      fontWeight: "bold",
    }),
  )

  const unknownDecoration = vscode.window.createTextEditorDecorationType({
    color: "#ff5555",
    overviewRulerColor: "#ff5555",
    overviewRulerLane: vscode.OverviewRulerLane.Left,
  })

  // --- 4. Logic Functions ---

  const clearDecorations = () => {
    if (!activeEditor) return
    currentUnknownRanges = []
    activeEditor.setDecorations(unknownDecoration, [])
    knownDecorations.forEach((deco) => {
      activeEditor!.setDecorations(deco, [])
    })
  }

  const updateDecorations = () => {
    if (!activeEditor) return
    if (!isEnabled) return

    const text = activeEditor.document.getText()

    const knownRanges: vscode.Range[][] = Array.from(
      { length: colorPalette.length },
      () => [],
    )

    currentUnknownRanges = []

    const khmerBlockRegex = /[\p{Script=Khmer}]+/gu
    let blockMatch
    let wordCounter = 0

    while ((blockMatch = khmerBlockRegex.exec(text))) {
      const blockText = blockMatch[0]
      const blockStartIndex = blockMatch.index
      const graphemes = [...segmenter.segment(blockText)]

      let i = 0
      while (i < graphemes.length) {
        let foundMatch = false
        let currentString = ""
        let matchEndIndex = -1

        for (let j = i; j < graphemes.length; j++) {
          currentString += graphemes[j]!.segment
          if (currentString.length > MAX_CHAR_LENGTH) break
          if (knownWords.has(currentString)) matchEndIndex = j
        }

        if (matchEndIndex !== -1) {
          const startCharIndex = blockStartIndex + graphemes[i]!.index
          const lastGrapheme = graphemes[matchEndIndex]!
          const endCharIndex =
            blockStartIndex + lastGrapheme.index + lastGrapheme.segment.length

          const startPos = activeEditor.document.positionAt(startCharIndex)
          const endPos = activeEditor.document.positionAt(endCharIndex)

          knownRanges[wordCounter % colorPalette.length]!.push(
            new vscode.Range(startPos, endPos),
          )

          i = matchEndIndex + 1
          wordCounter++
          foundMatch = true
        }

        if (!foundMatch) {
          const g = graphemes[i]!
          const startPos = activeEditor.document.positionAt(
            blockStartIndex + g.index,
          )
          const endPos = activeEditor.document.positionAt(
            blockStartIndex + g.index + g.segment.length,
          )

          const range = new vscode.Range(startPos, endPos)
          currentUnknownRanges.push(range)
          i++
        }
      }
    }

    activeEditor.setDecorations(unknownDecoration, currentUnknownRanges)
    knownDecorations.forEach((deco, index) => {
      activeEditor!.setDecorations(deco, knownRanges[index]!)
    })
  }

  const triggerUpdate = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
    timeout = setTimeout(updateDecorations, 500)
  }

  // --- 5. Register Commands ---

  context.subscriptions.push(
    vscode.commands.registerCommand("khmer-spellchecker.toggle", () => {
      isEnabled = !isEnabled
      updateStatusBar()
      if (isEnabled) {
        triggerUpdate()
        vscode.window.showInformationMessage("Khmer Coloring Enabled")
      } else {
        clearDecorations()
        vscode.window.showInformationMessage("Khmer Coloring Disabled")
      }
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "khmer-spellchecker.refreshDictionary",
      () => {
        loadDictionary()
        if (isEnabled) triggerUpdate()
        vscode.window.showInformationMessage(
          `Dictionary refreshed: ${knownWords.size} words loaded.`,
        )
      },
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("khmer-spellchecker.splitSelection", () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) return
      const selections = editor.selections
      if (selections.length === 0) return

      editor.edit((editBuilder) => {
        for (const selection of selections) {
          const text = editor.document.getText(selection)
          if (!text) continue
          try {
            const words = split(text)
            editBuilder.replace(selection, words.join(" "))
          } catch (e) {
            console.error(e)
          }
        }
      })
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "khmer-spellchecker.normalizeSelection",
      () => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return
        const selections = editor.selections
        if (selections.length === 0) return

        editor.edit((editBuilder) => {
          for (const selection of selections) {
            const text = editor.document.getText(selection)
            if (!text) continue
            try {
              editBuilder.replace(selection, reorderText(text))
            } catch (e) {
              console.error(e)
            }
          }
        })
      },
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "khmer-spellchecker.addToDictionary",
      () => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return

        const selection = editor.selection
        const text = editor.document.getText(selection).trim()

        if (!text) {
          vscode.window.showWarningMessage(
            "No text selected to add to dictionary.",
          )
          return
        }

        if (knownWords.has(text)) {
          vscode.window.showInformationMessage(
            `"${text}" is already in the dictionary.`,
          )
          return
        }

        try {
          let currentContent = ""
          if (fs.existsSync(dictionaryPath)) {
            currentContent = fs.readFileSync(dictionaryPath, "utf-8")
          }
          const newContent = text + "\n" + currentContent
          fs.writeFileSync(dictionaryPath, newContent, "utf-8")
          loadDictionary()
          triggerUpdate()
          vscode.window.showInformationMessage(`Added "${text}" to dictionary.`)
        } catch (err) {
          vscode.window.showErrorMessage(
            `Failed to write to dictionary: ${err}`,
          )
        }
      },
    ),
  )

  // --- UPDATED: Next Error Command with Page Copy ---
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "khmer-spellchecker.nextError",
      async () => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return

        if (currentUnknownRanges.length === 0) {
          vscode.window.showInformationMessage(
            "No Khmer spelling errors found.",
          )
          return
        }

        const currentPos = editor.selection.active

        // 1. Find Next Error
        let nextRange = currentUnknownRanges.find((range) =>
          range.start.isAfter(currentPos),
        )

        // 2. Wrap around if at end
        if (!nextRange) {
          nextRange = currentUnknownRanges[0]
        }

        if (nextRange) {
          // Select Error
          editor.selection = new vscode.Selection(
            nextRange.start,
            nextRange.end,
          )
          editor.revealRange(nextRange, vscode.TextEditorRevealType.InCenter)

          // 3. Find Page Number (Look backwards/upwards)
          let pageNum = ""
          const doc = editor.document
          const startLine = nextRange.start.line

          // Loop backwards from current line to top of file
          for (let i = startLine; i >= 0; i--) {
            const lineText = doc.lineAt(i).text
            // Regex matches: "### Страница 87"
            const match = lineText.match(/^###\s+Страница\s+(\d+)/i)
            if (match) {
              const m = match[1]
              if (!m) throw new Error('no match')
              pageNum = m // Capture the number
              break
            }
          }

          // 4. Copy to Clipboard
          if (pageNum) {
            await vscode.env.clipboard.writeText(pageNum)
            vscode.window.setStatusBarMessage(
              `Jumped to Error. Copied Page ${pageNum} to clipboard.`,
              4000,
            )
          } else {
            vscode.window.setStatusBarMessage(
              `Jumped to Error. (No Page Number found above)`,
              4000,
            )
          }
        }
      },
    ),
  )

  // --- 6. Event Listeners ---
  if (activeEditor) triggerUpdate()

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor
      if (editor) {
        if (isEnabled) triggerUpdate()
        else clearDecorations()
      }
    },
    null,
    context.subscriptions,
  )

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        if (isEnabled) triggerUpdate()
      }
    },
    null,
    context.subscriptions,
  )
}

export function deactivate() { }
