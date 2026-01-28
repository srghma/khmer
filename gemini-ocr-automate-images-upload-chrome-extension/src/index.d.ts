declare module 'inline:*' {
  // Use a unique name here to avoid clashing with 'content'
  const __inline_string: string
  export default __inline_string
}

declare module 'khmer-normalize' {
  function reorderText(s: string): string
}
