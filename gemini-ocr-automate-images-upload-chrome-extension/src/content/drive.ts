import { assertIsDefinedAndReturn, assertNever } from '../utils/asserts'
import { delay } from '../utils/delay'
import { assert_element_is_HTMLElement, element_to_HTMLElement_orThrow } from '../utils/dom'
import { mkLogger } from '../utils/log'
import { Array_assertNonEmptyArray } from '../utils/non-empty-array'
import { Set_mkOrThrowIfArrayIsNotUnique } from '../utils/sets'
import { ascNumber, sortBy_mutating } from '../utils/sort'
import {
  number_throwIfNotValidNonNegativeInt,
  strOrNumberToNonNegativeIntOrThrow_strict,
  type ValidNonNegativeInt,
} from '../utils/toNumber'
import { scrollAndProcess, type ScrollAndProcessResponse } from './scroll'
import { rowsToSelectOrNot } from './selectOrNot'

// --- TYPES & CONFIG ---
const CONFIG = {
  selectors: {
    row: 'div[role="option"]',
    dialog: 'div[aria-label="Select or upload a file"]',
    listbox: 'div[role="listbox"]',
    insertBtn: 'div[role="button"][jsname="KbvHGe"], button[jsname="KbvHGe"]',
  },
  maxScrollAttempts: 50,
  scrollStepDelay: 600,
  dialogTimeoutMs: 10000,
} as const

const log = mkLogger('drive' as const)

type SelectionResult = {
  status: 'success' | 'partial_success' | 'no_files_found'
  selectedPages: ValidNonNegativeInt[]
  nextStartPage: ValidNonNegativeInt
}

// --- HELPERS ---

const getRowTextLowercase = (row: HTMLElement): string =>
  assertIsDefinedAndReturn(
    assertIsDefinedAndReturn(row.querySelector('[data-tooltip-delay]'), () => {
      console.error(row)
      return 'No div[data-tooltip-delay]'
    }).textContent,
    () => {
      console.error(row)
      return 'empty textContent'
    },
  )
    .trim()
    .toLowerCase()

const getIsRowSelected = (row: HTMLElement): boolean =>
  row.getAttribute('aria-selected') === 'true' || row.classList.contains('picker-selected')

// Extract page number from filename like "page-123.png"
const extractPageNumber = (filename: string): ValidNonNegativeInt | undefined => {
  const match = filename.match(/page-(\d+)\.png/)
  return match && match[1] ? strOrNumberToNonNegativeIntOrThrow_strict(match[1]) : undefined
}

async function waitUntilDialogIsReady(signal?: AbortSignal) {
  const start = Date.now()
  while (!document.querySelector(CONFIG.selectors.dialog)) {
    if (signal?.aborted) throw new Error('ABORT')
    if (Date.now() - start > CONFIG.dialogTimeoutMs) throw new Error('Timeout')
    await delay(500)
  }
}

async function ensureListView() {
  const listBtn = document.querySelector('button[aria-label="List View"], button[data-id="list"]')
  const isVisible = listBtn && element_to_HTMLElement_orThrow(listBtn).offsetParent !== undefined

  if (isVisible) {
    log('Switching to List View...')
    element_to_HTMLElement_orThrow(listBtn).click()
    await delay(1000)
  }
}

async function clickInsertButton() {
  const insertBtn = findInsertButton()
  if (insertBtn && insertBtn.getAttribute('aria-disabled') !== 'true') {
    log('Clicking Insert...')
    insertBtn.click()
  } else {
    console.error('Insert button not clickable.')
  }
}

function findInsertButton(): HTMLElement | undefined {
  const btn = document.querySelector(CONFIG.selectors.insertBtn)
  if (btn instanceof HTMLElement) return btn

  const el = Array.from(document.querySelectorAll('div[role="button"], button')).find(b =>
    b.textContent?.toUpperCase().includes('INSERT'),
  )
  if (!el) return
  return element_to_HTMLElement_orThrow(el)
}

// --- ROW DATA ---

type RowData = {
  row: HTMLElement
  pageNumber: ValidNonNegativeInt
  isSelected: boolean
}

const getRows = async (container: HTMLElement): Promise<RowData[]> => {
  const rows: RowData[] = Array.from(container.querySelectorAll('div[role="option"]'))
    .map(element_to_HTMLElement_orThrow)
    .map(row => {
      const text = getRowTextLowercase(row)
      const pageNumber = extractPageNumber(text)
      if (pageNumber === undefined) return
      return {
        row,
        pageNumber,
        isSelected: getIsRowSelected(row),
      }
    })
    .filter(x => !!x)

  Set_mkOrThrowIfArrayIsNotUnique(rows.map(x => x.pageNumber)) // just to check that pages are uniq
  return sortBy_mutating(rows, x => x.pageNumber, ascNumber) // just in case
}

const clickRow = async (row: HTMLElement): Promise<void> => {
  const clickTarget = row.querySelector('[tabindex], [data-id], img') ?? row
  assert_element_is_HTMLElement(clickTarget)
  clickTarget.scrollIntoView({ block: 'center', behavior: 'instant' })
  await delay(200)
  clickTarget.focus()
  await delay(200)
  clickTarget.click()
}

// --- MAIN FUNCTION ---

export async function selectManyFiles(
  startPage: ValidNonNegativeInt,
  pageCount: ValidNonNegativeInt,
  signal?: AbortSignal,
): Promise<SelectionResult> {
  const checkAbort = () => {
    if (signal?.aborted) throw new Error('ABORT')
  }

  // 1. Setup
  await waitUntilDialogIsReady(signal)
  await ensureListView()

  const container = element_to_HTMLElement_orThrow(
    assertIsDefinedAndReturn(document.querySelector('.ndfHFb-XuHpsb-haAclf')),
  )

  type R = {
    selected_and_should_be_selected: RowData[]
    not_selected_and_should_be_selected: RowData[]
  }
  // 2. Scroll and collect available pages
  const scrollResult: ScrollAndProcessResponse<R, R> = await scrollAndProcess({
    container,
    maxAttempts: CONFIG.maxScrollAttempts,
    scrollStepDelay: CONFIG.scrollStepDelay,
    tryConsume: async () => {
      checkAbort()

      const {
        selected_and_should_be_selected,
        selected_and_should_not_be_selected,
        not_selected_and_should_be_selected,
        not_selected_and_should_not_be_selected,
      } = rowsToSelectOrNot(await getRows(container), startPage, pageCount)

      if (selected_and_should_not_be_selected.length > 0)
        throw new Error('selected_and_should_not_be_selected: Who the fuck clicked?')

      const already_selected_or_will_be = selected_and_should_be_selected.concat(not_selected_and_should_be_selected)

      const r: R = {
        selected_and_should_be_selected,
        not_selected_and_should_be_selected,
      }
      if (already_selected_or_will_be.length < pageCount)
        return {
          t: 'i_want_more',
          partialResult: r,
        }

      if (already_selected_or_will_be.length === pageCount)
        return {
          t: 'i_consumed_all_im_full',
          result: r,
        }

      console.error({
        selected_and_should_be_selected,
        selected_and_should_not_be_selected,
        not_selected_and_should_be_selected,
        not_selected_and_should_not_be_selected,
        startPage,
        pageCount,
      })
      throw new Error(
        `IMPOSSIBLE: already_selected_or_will_be.length ${already_selected_or_will_be.length} > pageCount ${pageCount}`,
      )
    },
  })

  if (scrollResult.t === 'error_max_attempts_exceeded') throw new Error('error_max_attempts_exceeded')

  const result: R = (() => {
    switch (scrollResult.t) {
      case 'success':
        return scrollResult.result
      case 'we_scrolled_to_buttom_but_still_want_more':
        return scrollResult.partialResult
      default:
        assertNever(scrollResult)
    }
  })()

  for (const { row, pageNumber, isSelected } of result.not_selected_and_should_be_selected) {
    if (isSelected) throw new Error('Impossible: not_selected_and_should_be_selected isSelected')
    log(`Selecting: page-${pageNumber}.png`)
    await clickRow(row)
    await delay(200)
    if (!getIsRowSelected(row))
      throw new Error('Impossible: not_selected_and_should_be_selected -> clicked but didnt select')
  }

  const selected = [...result.not_selected_and_should_be_selected, ...result.selected_and_should_be_selected]
  Array_assertNonEmptyArray(selected)

  const maxPage = Math.max(...selected.map(x => x.pageNumber))
  const nextStartPage = maxPage + 1
  number_throwIfNotValidNonNegativeInt(nextStartPage)

  log(
    `Selection result: ${scrollResult.t}, selected ${selected.length}/${pageCount} pages, next start: ${nextStartPage}`,
  )

  // 5. Click insert button
  await clickInsertButton()

  return {
    status: (() => {
      switch (scrollResult.t) {
        case 'success':
          return 'success'
        case 'we_scrolled_to_buttom_but_still_want_more':
          return 'partial_success'
        default:
          assertNever(scrollResult)
      }
    })(),
    selectedPages: selected.map(x => x.pageNumber),
    nextStartPage,
  }
}
