import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"

export function activate(context: vscode.ExtensionContext) {
  console.log("Khmer Spellchecker (Toggleable) is active")

  // --- State Variables ---
  let timeout: NodeJS.Timeout | undefined = undefined
  let activeEditor = vscode.window.activeTextEditor

  // Default state: Enabled
  let isEnabled = true

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

  // --- 1. Load Dictionary ---
  const dictionaryPath = path.join(context.extensionPath, "dictionary.txt")
  let knownWords = new Set<string>()
  let MAX_CHAR_LENGTH = 0

  try {
    if (fs.existsSync(dictionaryPath)) {
      const content = fs.readFileSync(dictionaryPath, "utf-8")
      const words = content
        .split(/\r?\n/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0)

      words.forEach((word) => {
        knownWords.add(word)
        if (word.length > MAX_CHAR_LENGTH) MAX_CHAR_LENGTH = word.length
      })
      console.log(`Loaded ${knownWords.size} words.`)
    }
  } catch (err) {
    console.error("Error reading dictionary:", err)
  }

  if (MAX_CHAR_LENGTH === 0) MAX_CHAR_LENGTH = 50

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
    textDecoration: "underline wavy #ff5555",
  })

  // --- 4. Logic Functions ---

  const clearDecorations = () => {
    if (!activeEditor) return
    // Set all ranges to empty array to remove colors
    activeEditor.setDecorations(unknownDecoration, [])
    knownDecorations.forEach((deco) => {
      activeEditor!.setDecorations(deco, [])
    })
  }

  const updateDecorations = () => {
    if (!activeEditor) return

    // If disabled, ensure we are clean and exit
    if (!isEnabled) {
      return
    }

    const text = activeEditor.document.getText()

    const knownRanges: vscode.Range[][] = Array.from(
      { length: colorPalette.length },
      () => [],
    )
    const unknownRanges: vscode.Range[] = []

    const khmerBlockRegex = /[\p{Script=Khmer}]+/gu
    let blockMatch
    let wordCounter = 0

    while ((blockMatch = khmerBlockRegex.exec(text))) {
      const blockText = blockMatch[0]
      const blockStartIndex = blockMatch.index

      // Step A: Break the block into Atomic Graphemes
      const graphemes = [...segmenter.segment(blockText)]

      let i = 0

      while (i < graphemes.length) {
        let foundMatch = false
        let currentString = ""
        let matchEndIndex = -1

        // Maximum Matching Loop
        for (let j = i; j < graphemes.length; j++) {
          currentString += graphemes[j]!.segment

          if (currentString.length > MAX_CHAR_LENGTH) break

          if (knownWords.has(currentString)) {
            matchEndIndex = j
          }
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

          unknownRanges.push(new vscode.Range(startPos, endPos))
          i++
        }
      }
    }

    activeEditor.setDecorations(unknownDecoration, unknownRanges)
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

  // --- 5. Register Toggle Command ---
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

  // --- 6. Event Listeners ---
  if (activeEditor) triggerUpdate()

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor
      if (editor) {
        // If we switch tabs, we either highlight or clear based on setting
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

export function deactivate() {}
