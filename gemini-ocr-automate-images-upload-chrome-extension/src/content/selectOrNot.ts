// GIVEN
//   starting page to select = 100
//   how much to select = 2
//   drive content: 100 (selected), 101 (not selected), 102 (not selected)
// EXPECTED OUTPUT: {
//   selected_and_should_be_selected: [100],
//   selected_and_should_not_be_selected: [],
//   not_selected_and_should_be_selected: [101],
//   not_selected_and_should_not_be_selected: [102],
// }

import { type ValidNonNegativeInt } from '../utils/toNumber'

// GIVEN
//   starting page to select = 100
//   how much to select = 2
//   drive content: 100 (selected)
// EXPECTED OUTPUT: {
//   selected_and_should_be_selected: [100],
//   selected_and_should_not_be_selected: [],
//   not_selected_and_should_be_selected: [],
//   not_selected_and_should_not_be_selected: [],
// }

type SelectOrNot<X> = {
  selected_and_should_be_selected: X[]
  selected_and_should_not_be_selected: X[]
  not_selected_and_should_be_selected: X[]
  not_selected_and_should_not_be_selected: X[]
}

export const rowsToSelectOrNot = <X extends { isSelected: boolean; pageNumber: ValidNonNegativeInt }>(
  rows: X[], // must be sorted by pageNumber ascending
  startPage: ValidNonNegativeInt,
  count: ValidNonNegativeInt,
): SelectOrNot<X> => {
  // Determine which pageNumbers should be selected
  const targetPages = new Set(
    rows
      .filter(r => r.pageNumber >= startPage)
      .slice(0, count)
      .map(r => r.pageNumber),
  )

  const result: SelectOrNot<X> = {
    selected_and_should_be_selected: [],
    selected_and_should_not_be_selected: [],
    not_selected_and_should_be_selected: [],
    not_selected_and_should_not_be_selected: [],
  }

  for (const row of rows) {
    const shouldBeSelected = targetPages.has(row.pageNumber)
    if (row.isSelected) {
      if (shouldBeSelected) result.selected_and_should_be_selected.push(row)
      else result.selected_and_should_not_be_selected.push(row)
    } else {
      if (shouldBeSelected) result.not_selected_and_should_be_selected.push(row)
      else result.not_selected_and_should_not_be_selected.push(row)
    }
  }

  return result
}
