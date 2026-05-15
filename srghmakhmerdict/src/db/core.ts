import Database from '@tauri-apps/plugin-sql'

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

let userDbPromise: Promise<Database> | undefined = undefined

// Connect to the Read-Write User Data DB
export const getUserDb = (): Promise<Database> => {
  if (!isTauri) {
    // Return a mock database for the webapp
    return Promise.resolve({
      execute: async () => ({ rowsAffected: 0, lastInsertId: 0 }),
      select: async () => [],
      load: async () => ({}) as any,
      close: async () => {},
    } as any)
  }

  if (!userDbPromise) userDbPromise = Database.load('sqlite:user_data.db')

  return userDbPromise
}
