/**
 * DOM HELPER: Safely gets the range without throwing errors.
 * Returns undefined if selection is invalid, empty, or collapsed.
 */
export function getSafeRange(selection: Selection): Range | undefined {
  if (selection.rangeCount === 0) return undefined
  if (selection.isCollapsed) return undefined

  try {
    // This is the specific line that can throw IndexSizeError
    return selection.getRangeAt(0)
  } catch (e) {
    // `selection.getRangeAt(0)` **can throw** an `IndexSizeError` if the `rangeCount` drops to 0 (e.g., the user clicks away deselecting text) exactly when your debounce timeout fires.
    //
    // However, wrapping the entire math logic in a `try/catch` block that triggers a user-facing Toast error is bad UX (the user shouldn't see "Calculation error" just because they clicked away fast).
    //
    // Silently fail here, as it usually means selection was cleared mid-operation
    return undefined
  }
}

/**
 * DOM HELPER: Checks if the selection is strictly inside the specific container.
 */
export function isSelectionInsideRef(selection: Selection, container: HTMLElement): boolean {
  let node = selection.anchorNode

  // Traverse up the tree
  while (node) {
    if (node === container) return true
    if (node === document.body) return false
    node = node.parentNode
  }

  return false
}
