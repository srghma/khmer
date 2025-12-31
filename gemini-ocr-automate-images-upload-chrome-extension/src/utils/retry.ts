export async function retry<T>(
  fn: () => Promise<T>,
  { retries = 10, delayMs = 1000, backoffFactor = 1.5 } = {},
): Promise<T> {
  let attempt = 0
  let delay = delayMs

  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt > retries) throw err

      console.error(`translateSrt failed (attempt ${attempt}/${retries}), retrying in ${delay}ms`, err)

      await new Promise(r => setTimeout(r, delay))
      delay *= backoffFactor
    }
  }
}

export async function translateWithRetryForever<T>(fn: () => Promise<T>): Promise<T> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (err) {
      console.error('translateSrt failed, retrying...', err)
      await new Promise(r => setTimeout(r, 1000))
    }
  }
}
