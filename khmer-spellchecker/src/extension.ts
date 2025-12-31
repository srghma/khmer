import * as vscode from "vscode"
import * as path from "path"
import {
  khmerSentenceToWords_usingDictionary,
  khmerSentenceToWords_usingSegmenter,
} from "./utils/segmentation"
import { strToKhmerWordOrUndefined, TypedKhmerWord } from "./utils/khmer-word"
import { reorderText } from "khmer-normalize"
import { assertIsDefined, assertIsDefinedAndReturn } from "./utils/asserts"
import { DictionaryManager } from "./utils/dictionary"
import {
  strOrNumberToNonNegativeIntOrThrow_strict,
  strToNonNegativeIntOrThrow_strict,
  ValidNonNegativeInt,
} from "./utils/toNumber"

// --- Constants ---

// REMOVED: const CHECK_ONLY_FIRST_KHMER_BLOCK_IN_LINE = true
const KHMER_BLOCK_REGEX = /[\p{Script=Khmer}]+/gu
const KHMER_BLOCK_REGEX_SINGLE = /[\p{Script=Khmer}]+/u
const DICTIONARY_FILE_NAME = "dictionary.txt"
const CONFIG_SECTION = "khmer-spellchecker"

const BASE_IMAGE_PATH = "/home/srghma/projects/khmer/Краткий русско-кхмерский словарь--content.txt"
// "/home/srghma/projects/khmer/Кхмерско-русский словарь-Горгониев"

/**
 * Transforms an integer page number into a file URI.
 */
function getPageImageUri(pageNumber: ValidNonNegativeInt): vscode.Uri {
  const imageIndex = pageNumber - 1
  const paddedIndex = String(imageIndex).padStart(3, "0")
  const fileName = `page-${paddedIndex}.png`
  const fullPath = path.join(BASE_IMAGE_PATH, fileName)
  return vscode.Uri.file(fullPath)
}

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
  colorizingMode: ColorizingMode
  checkOnlyFirstBlock: boolean // <--- NEW STATE PROPERTY
  decorations: {
    known: vscode.TextEditorDecorationType[]
    unknown: vscode.TextEditorDecorationType
  }
  diagnosticCollection: vscode.DiagnosticCollection
  timeout: NodeJS.Timeout | undefined
  currentUnknownRanges: vscode.Range[]
  lastOpenedImageNum: ValidNonNegativeInt | undefined
}

// --- Helper: Find Page Number ---

function findPageNumberPrecedingLine(
  document: vscode.TextDocument,
  lineIndex: number,
): ValidNonNegativeInt | undefined {
  for (let i = lineIndex; i >= 0; i--) {
    const lineText = document.lineAt(i).text
    const match = lineText.match(/^###\s+Страница\s+(\d+)/i)
    if (match && match[1]) {
      return strToNonNegativeIntOrThrow_strict(match[1])
    }
  }
  return undefined
}

// --- Code Action Provider ---

export class KhmerPageImageProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ]

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): vscode.CodeAction[] {
    const khmerDiagnostics = context.diagnostics.filter(
      (d) => d.source === "Khmer Spellchecker",
    )
    if (khmerDiagnostics.length === 0) {
      return []
    }

    const pageNum = findPageNumberPrecedingLine(document, range.start.line)
    if (!pageNum) {
      return []
    }

    const actions: vscode.CodeAction[] = []

    const actionCurrent = new vscode.CodeAction(
      `Open original image (Page ${pageNum})`,
      vscode.CodeActionKind.QuickFix,
    )
    actionCurrent.isPreferred = true
    actionCurrent.diagnostics = khmerDiagnostics
    actionCurrent.command = {
      command: "khmer-spellchecker.openPageImage",
      title: "Open Image",
      arguments: [pageNum],
    }
    actions.push(actionCurrent)

    if (pageNum > 1) {
      const prevPageNum = pageNum - 1
      const actionPrev = new vscode.CodeAction(
        `Open previous image (Page ${prevPageNum})`,
        vscode.CodeActionKind.QuickFix,
      )
      actionPrev.isPreferred = false
      actionPrev.diagnostics = khmerDiagnostics
      actionPrev.command = {
        command: "khmer-spellchecker.openPageImage",
        title: "Open Previous Image",
        arguments: [prevPageNum],
      }
      actions.push(actionPrev)
    }

    return actions
  }
}

// --- Main Activation ---

export function activate(context: vscode.ExtensionContext) {
  console.log("Khmer Spellchecker Active")

  const dictPath = path.join(context.extensionPath, DICTIONARY_FILE_NAME)
  const dictManager = new DictionaryManager(dictPath)

  const state: ExtensionState = {
    isEnabled: true,
    colorizingMode: "Dictionary",
    checkOnlyFirstBlock: true, // Default
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
      }),
    },
    diagnosticCollection:
      vscode.languages.createDiagnosticCollection("khmer-spellchecker"),
    timeout: undefined,
    currentUnknownRanges: [],
    lastOpenedImageNum: undefined,
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
    state.diagnosticCollection.clear()
  }

  const performDecorations = (editor: vscode.TextEditor) => {
    if (!state.isEnabled) {
      state.diagnosticCollection.clear()
      return
    }

    const text = editor.document.getText()
    const knownWords = dictManager.getWords()
    const knownRanges: vscode.Range[][] = COLOR_PALETTE.map(() => [])
    const unknownRanges: vscode.Range[] = []
    const diagnostics: vscode.Diagnostic[] = []

    let wordCounter = 0
    let match: RegExpExecArray | null
    const linesProcessed = new Set<number>()

    while ((match = KHMER_BLOCK_REGEX.exec(text)) !== null) {
      const blockText = match[0] as TypedKhmerWord
      const blockStart = match.index

      // --- CONFIGURABLE LOGIC START ---
      if (state.checkOnlyFirstBlock) {
        const startPos = editor.document.positionAt(blockStart)
        const lineNum = startPos.line

        if (linesProcessed.has(lineNum)) {
          continue // Skip this block as we already found one on this line
        }
        linesProcessed.add(lineNum)
      }
      // --- CONFIGURABLE LOGIC END ---

      const words =
        state.colorizingMode === "Segmenter"
          ? khmerSentenceToWords_usingSegmenter(blockText)
          : khmerSentenceToWords_usingDictionary(blockText, knownWords)

      let currentOffset = 0
      let unknownBufferText = ""
      let unknownStartOffset = -1

      const flushUnknownBuffer = () => {
        if (unknownBufferText.length > 0) {
          const startPos = editor.document.positionAt(
            blockStart + unknownStartOffset,
          )
          const endPos = editor.document.positionAt(
            blockStart + unknownStartOffset + unknownBufferText.length,
          )
          const range = new vscode.Range(startPos, endPos)

          unknownRanges.push(range)

          const diagnostic = new vscode.Diagnostic(
            range,
            `Unknown sequence: "${unknownBufferText}"`,
            vscode.DiagnosticSeverity.Error,
          )
          diagnostic.source = "Khmer Spellchecker"
          diagnostics.push(diagnostic)

          unknownBufferText = ""
          unknownStartOffset = -1
        }
      }

      words.forEach((word) => {
        if (knownWords.has(word)) {
          flushUnknownBuffer()
          const startPos = editor.document.positionAt(
            blockStart + currentOffset,
          )
          const endPos = editor.document.positionAt(
            blockStart + currentOffset + word.length,
          )
          const range = new vscode.Range(startPos, endPos)

          const r = knownRanges[wordCounter % COLOR_PALETTE.length]
          assertIsDefined(r)
          r.push(range)
          wordCounter++
        } else {
          if (unknownBufferText === "") {
            unknownStartOffset = currentOffset
          }
          unknownBufferText += word
        }
        currentOffset += word.length
      })
      flushUnknownBuffer()
    }

    state.currentUnknownRanges = unknownRanges
    editor.setDecorations(state.decorations.unknown, unknownRanges)
    state.decorations.known.forEach((d, i) =>
      editor.setDecorations(d, assertIsDefinedAndReturn(knownRanges[i])),
    )
    state.diagnosticCollection.set(editor.document.uri, diagnostics)
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

  // Renamed from syncColorizingMode to syncConfiguration
  const syncConfiguration = () => {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

    // 1. Colorizing Mode
    state.colorizingMode =
      config.get<ColorizingMode>("colorizingMode") ?? "Dictionary"

    // 2. Check Only First Block
    state.checkOnlyFirstBlock =
      config.get<boolean>("checkOnlyFirstKhmerBlockInLine") ?? true

    updateUI()
    triggerUpdate()
  }

  dictManager.load()
  syncConfiguration()

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      // Check for either config change
      if (e.affectsConfiguration(`${CONFIG_SECTION}.colorizingMode`) ||
        e.affectsConfiguration(`${CONFIG_SECTION}.checkOnlyFirstKhmerBlockInLine`)) {
        syncConfiguration()
      }
    }),
  )

  // --- Register Code Action Provider ---

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: "file" },
      new KhmerPageImageProvider(),
      {
        providedCodeActionKinds: KhmerPageImageProvider.providedCodeActionKinds,
      },
    ),
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
        const nextMode =
          currentMode === "Dictionary" ? "Segmenter" : "Dictionary"
        config.update(
          "colorizingMode",
          nextMode,
          vscode.ConfigurationTarget.Global,
        )
        vscode.window.showInformationMessage(
          `Switched to ${nextMode} segmentation`,
        )
      },
    ),

    vscode.commands.registerCommand(
      "khmer-spellchecker.refreshDictionary",
      refreshAndNotify,
    ),

    // --- Command: Open Page Image ---
    vscode.commands.registerCommand(
      "khmer-spellchecker.openPageImage",
      async (pageNumber: number) => {
        if (pageNumber === undefined) return
        const pn = strOrNumberToNonNegativeIntOrThrow_strict(pageNumber)

        state.lastOpenedImageNum = pn
        const uri = getPageImageUri(pn)

        try {
          await vscode.env.openExternal(uri)
        } catch (e) {
          vscode.window.showErrorMessage(`Could not open image: ${e}`)
        }
      },
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
        const nextRange =
          state.currentUnknownRanges.find((r) => r.start.isAfter(currentPos)) ??
          state.currentUnknownRanges[0]

        if (!nextRange) return

        const fullBlockRange =
          editor.document.getWordRangeAtPosition(
            nextRange.start,
            KHMER_BLOCK_REGEX_SINGLE,
          ) || nextRange

        const originalText = editor.document.getText(
          fullBlockRange,
        ) as TypedKhmerWord
        const segmentedWords = khmerSentenceToWords_usingSegmenter(originalText)
        const newText = segmentedWords.join(" ")

        const success = await editor.edit((editBuilder) => {
          editBuilder.replace(fullBlockRange, newText)
        })

        if (success) {
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

        let pageNum = findPageNumberPrecedingLine(
          editor.document,
          fullBlockRange.start.line,
        )

        if (pageNum) {
          await vscode.env.clipboard.writeText(String(pageNum))
          vscode.window.setStatusBarMessage(
            `Jumped & Segmented. Page ${pageNum} copied.`,
            4000,
          )

          // Only open if different from last opened
          if (state.lastOpenedImageNum !== pageNum) {
            vscode.commands.executeCommand(
              "khmer-spellchecker.openPageImage",
              pageNum,
            )
          }
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

export function deactivate() { }
