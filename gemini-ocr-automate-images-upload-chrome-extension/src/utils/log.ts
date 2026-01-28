export const scopeToColor = {
  aistudio: 'color: #4ade80',
  'aistudio-index': 'color: #f1d2ff',
  drive: 'color: #00d2ff; font-weight: bold;',
  'drive-index': 'color: #993480; font-weight: bold;',
} as const

export type Scope = keyof typeof scopeToColor

export const mkLogger = (scope: Scope) => {
  const color = scopeToColor[scope]

  if (color === undefined) throw new Error(`Unknown logger scope: ${scope}`)

  return (...msg: unknown[]) => console.log(`%c[AI-${scope}]`, color, ...msg)
}

// export const logWithColor = (scope: Scope, ) => {
//   console.log(`%c[AI-${scope}]`, color, ...msg)
// }
