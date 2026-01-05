import * as vscode from "vscode"
import * as path from "path"
import {
  khmerSentenceToWords_usingDictionary,
  khmerSentenceToWords_usingSegmenter,
} from "./utils/segmentation"
import { strToKhmerWordOrUndefined, TypedKhmerWord } from "./utils/khmer-word"
import { reorderText } from "khmer-normalize"
import { assertIsDefined, assertIsDefinedAndReturn } from "./utils/asserts"
import { DictionaryManager } from "./dictionary"

// --- Constants ---

const KHMER_BLOCK_REGEX = /[\p{Script=Khmer}]+/gu
const KHMER_BLOCK_REGEX_SINGLE = /[\p{Script=Khmer}]+/u
const DICTIONARY_FILE_NAME = "dictionary.txt"
const CONFIG_SECTION = "khmer-spellchecker"

const COLOR_PALETTE = [
  "#569cd6", // Blue
  "#4ec9b0", // Soft Green
  "#c586c0", // Pink/Purple
  "#dcdcaa", // Soft Yellow
  "#ce9178", // Orange
]

// --- State Management ---

type ColorizingMode = "Dictionary" | "Segmenter"

type ExtensionState = {
  isEnabled: boolean
  colorizingMode: ColorizingMode // Local copy of the setting
  decorations: {
    known: vscode.TextEditorDecorationType[]
    unknown: vscode.TextEditorDecorationType
  }
  timeout: NodeJS.Timeout | undefined
  currentUnknownRanges: vscode.Range[]
}

// --- Main Activation ---

export function activate(context: vscode.ExtensionContext) {
  console.log("Khmer Spellchecker Active")

  const dictPath = path.join(context.extensionPath, DICTIONARY_FILE_NAME)
  const dictManager = new DictionaryManager(dictPath)

  const state: ExtensionState = {
    isEnabled: true,
    colorizingMode: "Dictionary", // Default, will be overwritten by setting
    decorations: {
      known: COLOR_PALETTE.map((color) =>
        vscode.window.createTextEditorDecorationType({
          color,
          fontWeight: "bold",
        }),
      ),
      unknown: vscode.window.createTextEditorDecorationType({
        color: "#ff5555",
        overviewRulerColor: "#ff5555",
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }),
    },
    timeout: undefined,
    currentUnknownRanges: [],
  }

  // --- UI & State Sync ---

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  )
  statusBarItem.command = "khmer-spellchecker.toggle"
  context.subscriptions.push(statusBarItem)

  const updateUI = () => {
    if (state.isEnabled) {
      statusBarItem.text = `$(paintcan) Khmer: On (${state.colorizingMode})`
      statusBarItem.tooltip =
        "Click to disable. Use command 'Next Colorizing Mode' to swap strategy."
    } else {
      statusBarItem.text = "$(circle-slash) Khmer: Off"
      statusBarItem.tooltip = "Click to enable Khmer highlighting"
    }
    statusBarItem.show()
  }

  const triggerUpdate = () => {
    if (state.timeout) clearTimeout(state.timeout)
    state.timeout = setTimeout(() => {
      const editor = vscode.window.activeTextEditor
      if (editor) performDecorations(editor)
    }, 500)
  }

  // --- Core Logic ---

  const clearDecorations = (editor: vscode.TextEditor) => {
    state.currentUnknownRanges = []
    editor.setDecorations(state.decorations.unknown, [])
    state.decorations.known.forEach((d) => editor.setDecorations(d, []))
  }

  const performDecorations = (editor: vscode.TextEditor) => {
    if (!state.isEnabled) return

    const text = editor.document.getText()
    const knownWords = dictManager.getWords()
    const knownRanges: vscode.Range[][] = COLOR_PALETTE.map(() => [])
    const unknownRanges: vscode.Range[] = []
    let wordCounter = 0
    let match: RegExpExecArray | null

    while ((match = KHMER_BLOCK_REGEX.exec(text)) !== null) {
      const blockText = match[0] as TypedKhmerWord
      const blockStart = match.index

      const words =
        state.colorizingMode === "Segmenter"
          ? khmerSentenceToWords_usingSegmenter(blockText)
          : khmerSentenceToWords_usingDictionary(blockText, knownWords)

      let currentOffset = 0
      words.forEach((word) => {
        const startPos = editor.document.positionAt(blockStart + currentOffset)
        const endPos = editor.document.positionAt(
          blockStart + currentOffset + word.length,
        )
        const range = new vscode.Range(startPos, endPos)

        if (knownWords.has(word)) {
          const r = knownRanges[wordCounter % COLOR_PALETTE.length]
          assertIsDefined(r)
          r.push(range)
          wordCounter++
        } else {
          unknownRanges.push(range)
        }
        currentOffset += word.length
      })
    }

    state.currentUnknownRanges = unknownRanges
    editor.setDecorations(state.decorations.unknown, unknownRanges)
    state.decorations.known.forEach((d, i) =>
      editor.setDecorations(d, assertIsDefinedAndReturn(knownRanges[i])),
    )
  }

  const refreshAndNotify = () => {
    const count = dictManager.load()
    triggerUpdate()
    vscode.window.showInformationMessage(
      `Dictionary refreshed: ${count} words loaded.`,
    )
  }

  const applySegmentation = (
    strategy: (text: TypedKhmerWord) => TypedKhmerWord[],
  ) => {
    // ... (This function remains unchanged)
    const editor = vscode.window.activeTextEditor
    if (!editor) return

    let targetRanges: vscode.Range[] = editor.selections.filter(
      (s) => !s.isEmpty,
    )

    if (targetRanges.length === 0) {
      const cursorRange = editor.document.getWordRangeAtPosition(
        editor.selection.active,
        KHMER_BLOCK_REGEX_SINGLE,
      )
      if (cursorRange) targetRanges = [cursorRange]
    }

    if (targetRanges.length === 0) return

    editor.edit((editBuilder) => {
      targetRanges.forEach((range) => {
        const text = editor.document.getText(range) as TypedKhmerWord
        if (!text) return

        const segmented = strategy(text)
        editBuilder.replace(range, segmented.join(" "))
      })
    })
  }

  // --- Initialization & Event Listeners ---

  // Function to sync state from VS Code settings
  const syncColorizingMode = () => {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION)
    state.colorizingMode =
      config.get<ColorizingMode>("colorizingMode") ?? "Dictionary"
    updateUI()
    triggerUpdate()
  }

  // Initial load
  dictManager.load()
  console.log(`Loaded ${dictManager.getWords().size} words`)
  syncColorizingMode() // Sync on activation

  // Listen for changes to the configuration
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${CONFIG_SECTION}.colorizingMode`)) {
        console.log("Colorizing mode changed, updating...")
        syncColorizingMode()
      }
    }),
  )

  // --- Commands ---

  context.subscriptions.push(
    vscode.commands.registerCommand("khmer-spellchecker.toggle", () => {
      state.isEnabled = !state.isEnabled
      updateUI()
      if (state.isEnabled) {
        triggerUpdate()
        vscode.window.showInformationMessage("Khmer Coloring Enabled")
      } else {
        const editor = vscode.window.activeTextEditor
        if (editor) clearDecorations(editor)
        vscode.window.showInformationMessage("Khmer Coloring Disabled")
      }
    }),

    vscode.commands.registerCommand(
      "khmer-spellchecker.nextColorizingMode",
      () => {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION)
        const currentMode = config.get<ColorizingMode>("colorizingMode")

        // Determine the next mode and update the global setting
        const nextMode =
          currentMode === "Dictionary" ? "Segmenter" : "Dictionary"
        config.update(
          "colorizingMode",
          nextMode,
          vscode.ConfigurationTarget.Global,
        )
        // The onDidChangeConfiguration listener will handle the UI update and re-decoration
        vscode.window.showInformationMessage(
          `Switched to ${nextMode} segmentation`,
        )
      },
    ),

    vscode.commands.registerCommand(
      "khmer-spellchecker.refreshDictionary",
      refreshAndNotify,
    ),

    vscode.commands.registerCommand(
      "khmer-spellchecker.splitSelectionUsingSegmenter",
      () => applySegmentation((t) => khmerSentenceToWords_usingSegmenter(t)),
    ),

    vscode.commands.registerCommand(
      "khmer-spellchecker.splitSelectionUsingDictionary",
      () =>
        applySegmentation((t) =>
          khmerSentenceToWords_usingDictionary(t, dictManager.getWords()),
        ),
    ),

    vscode.commands.registerCommand(
      "khmer-spellchecker.normalizeSelection",
      () => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return

        const ranges =
          editor.selections.length > 0 && !editor.selection.isEmpty
            ? editor.selections
            : [
                editor.document.getWordRangeAtPosition(
                  editor.selection.active,
                  KHMER_BLOCK_REGEX_SINGLE,
                ),
              ].filter((r): r is vscode.Range => !!r)

        if (ranges.length === 0) return

        editor.edit((editBuilder) => {
          ranges.forEach((range) => {
            const text = editor.document.getText(range)
            if (text) editBuilder.replace(range, reorderText(text))
          })
        })
      },
    ),

    vscode.commands.registerCommand(
      "khmer-spellchecker.addToDictionary",
      () => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return

        const rawText = editor.document.getText(editor.selection).trim()
        if (!rawText) {
          vscode.window.showWarningMessage("No text selected.")
          return
        }

        const validWord = strToKhmerWordOrUndefined(rawText)
        if (!validWord) {
          vscode.window.showWarningMessage(
            "Selection is not a valid Khmer word.",
          )
          return
        }

        try {
          const added = dictManager.add(validWord)
          if (added) {
            triggerUpdate()
            vscode.window.showInformationMessage(
              `Added "${validWord}" to dictionary.`,
            )
          } else {
            vscode.window.showInformationMessage(
              `"${validWord}" is already in dictionary.`,
            )
          }
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to write dictionary: ${err}`)
        }
      },
    ),

    vscode.commands.registerCommand(
      "khmer-spellchecker.nextError",
      async () => {
        const editor = vscode.window.activeTextEditor
        if (!editor || state.currentUnknownRanges.length === 0) {
          vscode.window.showInformationMessage("No spelling errors found.")
          return
        }

        const currentPos = editor.selection.active

        // Find the next error range relative to cursor
        const nextRange =
          state.currentUnknownRanges.find((r) => r.start.isAfter(currentPos)) ??
          state.currentUnknownRanges[0]

        if (!nextRange) return

        // 1. Expand range: Select \p{Khmer}+ from left and right of the error
        // We use the existing regex constant to find the whole block boundaries
        const fullBlockRange =
          editor.document.getWordRangeAtPosition(
            nextRange.start,
            KHMER_BLOCK_REGEX_SINGLE,
          ) || nextRange // Fallback to error range if regex fails for some reason

        // 2. Process the text: Segment it
        const originalText = editor.document.getText(
          fullBlockRange,
        ) as TypedKhmerWord
        const segmentedWords = khmerSentenceToWords_usingSegmenter(originalText)
        const newText = segmentedWords.join(" ")

        // 3. Apply the Edit (This is automatically Ctrl+Z undoable as a single action)
        const success = await editor.edit((editBuilder) => {
          editBuilder.replace(fullBlockRange, newText)
        })

        if (success) {
          // 4. Update Selection to cover the new segmented text
          const startOffset = editor.document.offsetAt(fullBlockRange.start)
          const newEndOffset = startOffset + newText.length
          const newEndPos = editor.document.positionAt(newEndOffset)

          const newSelection = new vscode.Selection(
            fullBlockRange.start,
            newEndPos,
          )
          editor.selection = newSelection
          editor.revealRange(newSelection, vscode.TextEditorRevealType.InCenter)
        }

        // 5. Existing Page Number Logic (Looking backwards from the edit line)
        let pageNum: string | undefined
        for (let i = fullBlockRange.start.line; i >= 0; i--) {
          const lineText = editor.document.lineAt(i).text
          const m = lineText.match(/^###\s+Страница\s+(\d+)/i)
          if (m) {
            pageNum = m[1]
            break
          }
        }

        if (pageNum) {
          await vscode.env.clipboard.writeText(pageNum)
          vscode.window.setStatusBarMessage(
            `Jumped & Segmented. Page ${pageNum} copied.`,
            4000,
          )
        } else {
          vscode.window.setStatusBarMessage("Jumped & Segmented.", 4000)
        }
      },
    ),
    // --- Events ---

    vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        if (editor && state.isEnabled) triggerUpdate()
      },
      null,
      context.subscriptions,
    ),

    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (
          state.isEnabled &&
          vscode.window.activeTextEditor?.document === e.document
        ) {
          triggerUpdate()
        }
      },
      null,
      context.subscriptions,
    ),
  )
}

export function deactivate() {}
