export const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

export async function updatePos(word: string, pos: string): Promise<void> {
  const res = await fetch(`http://localhost:3001/update_pos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, pos }),
  })

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }
}

async function webappInvoke<T>(command: string, args: any = {}): Promise<T> {
  const res = await fetch(`http://localhost:3001/api/${command}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  const data = await res.json()

  if (data && typeof data === 'object' && 'Err' in data) {
    throw new Error(data.Err)
  }

  if (data && typeof data === 'object' && 'Ok' in data) {
    return data.Ok as T
  }

  return data as T
}

export const invoke = async <T>(command: string, args: any = {}): Promise<T> => {
  if (isTauri) {
    try {
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')

      return await tauriInvoke<T>(command, args)
    } catch (e) {
      console.error('Tauri invoke failed, falling back to webappInvoke', e)

      return await webappInvoke<T>(command, args)
    }
  }

  return await webappInvoke<T>(command, args)
}
