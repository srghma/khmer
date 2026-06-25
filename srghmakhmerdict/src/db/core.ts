import Database from '@tauri-apps/plugin-sql'

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

let userDbPromise: Promise<Database> | undefined = undefined

// Connect to the Read-Write User Data DB
export const getUserDb = (): Promise<Database> => {
  if (!isTauri) {
    return Promise.resolve({
      execute: async (query: string, bindValues?: any[]) => {
        const res = await fetch('http://localhost:3001/sql/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, bindValues }),
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        return await res.json()
      },
      select: async <T>(query: string, bindValues?: any[]): Promise<T> => {
        const res = await fetch('http://localhost:3001/sql/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, bindValues }),
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        return (await res.json()) as T
      },
      load: async () => ({}) as any,
      close: async () => {},
    } as any)
  }

  if (!userDbPromise) userDbPromise = Database.load('sqlite:user_data.db')

  return userDbPromise
}
