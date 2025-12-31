import fs from 'fs/promises'
import { build } from 'esbuild'

// 1. Ensure tmp/ and dist/ exist
await fs.mkdir('tmp', { recursive: true })
await fs.mkdir('dist', { recursive: true })

// 2. Bundle JS → tmp/anki.js
await build({
  entryPoints: ['src/anki.ts'],
  bundle: true,
  minify: false,
  format: 'iife',
  target: 'es2022',
  outfile: 'tmp/anki.js',
})

console.log('✓ esbuild finished bundling src/anki.ts → tmp/anki.js')

// 3. Read templates
const frontHtml = await fs.readFile('src/front.html', 'utf8')
const backHtml = await fs.readFile('src/back.html', 'utf8')

// 4. Read bundled JS from tmp/anki.js
const js = await fs.readFile('tmp/anki.js', 'utf8')

// 6. Write final templates
await fs.writeFile('dist/front.html', frontHtml.replace('// INSERT JS HERE', js), 'utf8')
await fs.writeFile('dist/back.html', backHtml.replace('// INSERT JS HERE', js), 'utf8')

console.log('✓ dist/front.html and dist/back.html built successfully')
