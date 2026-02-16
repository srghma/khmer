export function requestIdleCallbackSafe(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
  if (typeof requestIdleCallback !== 'undefined') {
    return requestIdleCallback(callback, options)
  } else {
    return setTimeout(callback, options?.timeout)
  }
}
