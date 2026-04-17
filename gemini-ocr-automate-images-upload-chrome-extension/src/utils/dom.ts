// export const assert_isConstructor_curried = // wont work bc curried, bc needs explicit asserts
//   <T>(constructor: new (...args: unknown[]) => T) =>
//     (element: unknown): asserts element is T => {
//       if (element instanceof constructor) return
//       throw new Error(`Expected an ${constructor.name}, but got something else.`)
//     }
//
// export const isConstructor_curried = // wont work bc curried, bc needs explicit asserts
//   <T>(constructor: new (...args: unknown[]) => T) =>
//     (el: unknown): el is T =>
//       el instanceof constructor

export const toConstructor_orThrow_curried =
  <T>(constructor: new (...args: unknown[]) => T) =>
    (el: unknown): T => {
      if (el instanceof constructor) return el
      throw new Error(`Expected an ${constructor.name}, but got something else.`)
    }

export function assert_isConstructor<T>(
  constructor: new (...args: unknown[]) => T,
  element: unknown,
): asserts element is T {
  if (element instanceof constructor) return
  throw new Error(`Expected an ${constructor.name}, but got something else.`)
}

export function toConstructor_orThrow<T>(
  constructor: new (...args: unknown[]) => T,
  el: unknown,
): T {
  if (el instanceof constructor) return el
  throw new Error(`Expected an ${constructor.name}, but got something else.`)
}

export function elementOrNullabel_is_visible(el: Element | null | undefined): boolean {
  if (!el) return false
  if (!(el instanceof HTMLElement)) return false
  return htmlElement_is_visible(el)
}

export function htmlElement_is_visible(el: HTMLElement): boolean {
  if (el.tagName.toLowerCase() === 'input' && (el as HTMLInputElement).type === 'hidden') return false

  const style = window.getComputedStyle(el)
  if (style.display === 'none') return false
  if (style.visibility === 'hidden') return false
  if (style.opacity === '0') return false

  // If the element takes up no space, it's effectively invisible
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false

  return true
}

export const unlessUndefined_use = <X, Y>(x: X | null | undefined, to: (x: X) => NonNullable<Y>): Y | undefined =>
  x ? to(x) : undefined

export function querySelectorOrThrow<T>(
  selector: string,
  constructor: new (...args: unknown[]) => T,
): T {
  return toConstructor_orThrow(constructor, document.querySelector(selector));
}

export function* querySelectorAllOrThrow<T>(
  selector: string,
  constructor: new (...args: unknown[]) => T,
): IterableIterator<T> {
  const toConstructor_orThrow_curried_ = toConstructor_orThrow_curried(constructor)
  for (const el of document.querySelectorAll(selector)) {
    yield toConstructor_orThrow_curried_(el);
  }
}

export async function waitForElement<T>(
  selector: string,
  constructor: new (...args: unknown[]) => T,
  timeout = 5000,
): Promise<T | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el && htmlElement_is_visible(toConstructor_orThrow(HTMLElement, el))) {
      return toConstructor_orThrow(constructor, el);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
}
