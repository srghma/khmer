interface Rect {
  top: number
  bottom: number
  left: number
  width: number
  height: number
}

interface Viewport {
  innerWidth: number
  innerHeight: number
}

export interface Position {
  x: number
  y: number
}

/**
 * PURE FUNCTION: Calculates where the menu should sit based on the rectangle and viewport.
 * Does not touch the DOM.
 */
export function calculateMenuPosition(
  rect: Rect,
  viewport: Viewport,
  menuHeight: number = 160,
  menuWidth: number = 200,
): Position {
  // 1. Calculate Space
  const spaceBelow = viewport.innerHeight - rect.bottom

  // 2. Determine Y (Vertical)
  let y = rect.bottom + 10 // Default: Below

  // Flip to top if not enough space below AND there is space above
  if (spaceBelow < menuHeight && rect.top > menuHeight) {
    y = rect.top - menuHeight - 10
  }

  // 3. Determine X (Horizontal) - Center alignment
  let x = rect.left + rect.width / 2 - menuWidth / 2

  // 4. Boundary Checks (Keep it on screen)
  const padding = 10
  const maxRight = viewport.innerWidth - menuWidth - padding

  if (x < padding) x = padding
  if (x > maxRight) x = maxRight

  return { x, y }
}

/**
 * DOM HELPER: Safely gets the range without throwing errors.
 * Returns null if selection is invalid, empty, or collapsed.
 */
export function getSafeRange(selection: Selection | null): Range | null {
  if (!selection) return null
  if (selection.rangeCount === 0) return null
  if (selection.isCollapsed) return null

  try {
    // This is the specific line that can throw IndexSizeError
    return selection.getRangeAt(0)
  } catch (e) {
    // `selection.getRangeAt(0)` **can throw** an `IndexSizeError` if the `rangeCount` drops to 0 (e.g., the user clicks away deselecting text) exactly when your debounce timeout fires.
    //
    // However, wrapping the entire math logic in a `try/catch` block that triggers a user-facing Toast error is bad UX (the user shouldn't see "Calculation error" just because they clicked away fast).
    //
    // Silently fail here, as it usually means selection was cleared mid-operation
    return null
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
