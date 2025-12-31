import pMap from 'p-map'
import { splitOnGroupsOf } from './array'
import { SingleBar, Presets } from 'cli-progress'
import { Option_isSome, type Option } from './types'

export async function chunkedPmap<T, R>(
  iterable: Iterable<T>,
  chunkSize: number,
  mapper: (chunk: T[], chunkIndex: number) => Promise<R[]>,
  concurrency = 4,
): Promise<R[]> {
  if (chunkSize <= 0) throw new Error('chunkSize must be > 0')

  // Convert iterable to array and split into chunks
  const chunks = splitOnGroupsOf(chunkSize, Array.from(iterable))

  // Process chunks with p-map
  const r = await pMap(chunks, mapper, { concurrency })
  return r.flat()
}

export function forEachChunked<T, R>(
  iterable: Iterable<T>,
  chunkSize: number,
  mapper: (chunk: T[], chunkIndex: number) => R[],
): R[] {
  if (chunkSize <= 0) throw new Error('chunkSize must be > 0')
  const chunks = splitOnGroupsOf(chunkSize, Array.from(iterable))
  const r = chunks.map(mapper)
  return r.flat()
}

export type PMapOptions = {
  readonly useProgressBar?: boolean
  /**
   * Behavior when the mapper returns None (Option.none).
   * - "stop": Stop processing immediately and return results accumulated so far.
   * - "skip": Ignore this item and continue to the next one.
   * @default "stop"
   */
  readonly onNone?: 'stop' | 'skip'
  /**
   * Number of times to retry the mapper if it throws an error or times out.
   * @default 0
   */
  readonly retryTimes?: number
  /**
   * Maximum time in milliseconds to wait for the mapper to complete per attempt.
   * If undefined, waits indefinitely.
   */
  readonly timeoutMs?: number
  /**
   * Optional external AbortSignal.
   */
  readonly signal?: AbortSignal
}

// --- Generic Helper ---

const ABORTED = Symbol('ABORTED')

/**
 * Executes a function with retry logic, optional timeout, and AbortSignal support.
 * Returns the result R, or ABORTED symbol if the signal triggered.
 */
async function executeWithRetryAndTimeout<T, R>(
  fn: (arg: T, signal?: AbortSignal) => Promise<R>,
  arg: T,
  opts: { retryTimes: number; timeoutMs?: number; signal?: AbortSignal },
): Promise<R | typeof ABORTED> {
  const { retryTimes, timeoutMs, signal } = opts
  let attempt = 0

  while (true) {
    if (signal?.aborted) return ABORTED

    try {
      // Create a promise that resolves to ABORTED on signal abort (no throw)
      const abortPromise = new Promise<typeof ABORTED>(resolve => {
        if (signal?.aborted) return resolve(ABORTED)
        signal?.addEventListener('abort', () => resolve(ABORTED), {
          once: true,
        })
      })

      // Create a promise that rejects on timeout (Timeouts are still errors/retries)
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      const timeoutPromise = new Promise<never>((_, reject) => {
        if (timeoutMs !== undefined) {
          timeoutId = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        }
      })

      try {
        // Race: Function execution vs Timeout vs Abort
        const result = await Promise.race([
          fn(arg, signal).finally(() => {
            if (timeoutId) clearTimeout(timeoutId)
          }),
          ...(timeoutMs !== undefined ? [timeoutPromise] : []),
          ...(signal ? [abortPromise] : []),
        ])

        return result
      } catch (err) {
        throw err
      }
    } catch (error) {
      // If aborted externally during retry wait
      if (signal?.aborted) return ABORTED

      if (attempt >= retryTimes) {
        throw error
      }
      attempt++
      // Fast backoff
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
}

// --- Main Function ---

export async function pMapWithConcurrency1AndOption<T, R>(
  iterable: T[],
  mapper: (x: T, signal?: AbortSignal) => Promise<Option<R>>,
  options: PMapOptions = {},
): Promise<R[]> {
  const { useProgressBar = false, onNone = 'stop', retryTimes = 0, timeoutMs, signal: externalSignal } = options

  const output: R[] = []
  if (iterable.length === 0) return output

  // 1. Setup AbortController for Ctrl+C
  const controller = new AbortController()

  // Combine external signal (if any) with local controller
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort()
    else externalSignal.addEventListener('abort', () => controller.abort())
  }

  const sigintHandler = () => {
    console.log('\n[pMap] Ctrl+C detected. Stopping gracefully...')
    controller.abort()
  }

  // Register SIGINT listener
  process.on('SIGINT', sigintHandler)

  let progressBar: SingleBar | undefined

  if (useProgressBar) {
    progressBar = new SingleBar(
      {
        format: 'Progress |{bar}| {percentage}% | {value}/{total} Items',
        hideCursor: true,
      },
      Presets.shades_classic,
    )
    progressBar.start(iterable.length, 0)
  }

  try {
    for (const x of iterable) {
      // Check abortion status before processing next item
      if (controller.signal.aborted) {
        break
      }

      try {
        const y = await executeWithRetryAndTimeout(mapper, x, {
          retryTimes,
          timeoutMs,
          signal: controller.signal,
        })

        // Check if the execution returned the specific ABORTED symbol
        if (y === ABORTED) {
          break
        }

        if (Option_isSome(y)) {
          output.push(y.v)
          progressBar?.increment()
        } else {
          if (onNone === 'stop') {
            break
          }
          // If onNone === "skip", we record progress and continue
          progressBar?.increment()
        }
      } catch (e) {
        // Double check abort status in case error was side effect of abort
        if (controller.signal.aborted) {
          break
        }
        // Otherwise, executeWithRetryAndTimeout failed after retries
        console.error(`\nError processing item: ${e}`)
        if (onNone === 'stop') break
        progressBar?.increment()
      }
    }
  } finally {
    progressBar?.stop()
    // Remove SIGINT listener to avoid leaking listeners
    process.off('SIGINT', sigintHandler)
  }

  return output
}
