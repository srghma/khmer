import pMap from "p-map"
import { splitOnGroupsOf } from "./array"

export async function chunkedPmap<T, R>(
  iterable: Iterable<T>,
  chunkSize: number,
  mapper: (chunk: T[], chunkIndex: number) => Promise<R[]>,
  concurrency = 4,
): Promise<R[]> {
  if (chunkSize <= 0) throw new Error("chunkSize must be > 0")

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
  if (chunkSize <= 0) throw new Error("chunkSize must be > 0")
  const chunks = splitOnGroupsOf(chunkSize, Array.from(iterable))
  const r = chunks.map(mapper)
  return r.flat()
}
