import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { assertIsDefinedAndReturn } from './utils/asserts'

const execPromise = promisify(exec)

// --- CONFIGURATION ---
const CONFIG = {
  imagesDir: '/home/srghma/projects/en_Dict_en_km_com_assets_images_png',
  outputJsonPath: '/home/srghma/projects/en_Dict_en_km_com_assets_images_png/ocr_results.json',
  remoteBaseUrl: 'https://www.english-khmer.com/imgukh',

  // OCR Settings
  tesseractCmd: 'tesseract',
  magickCmd: 'magick', // Ensure ImageMagick is installed
  lang: 'khm',
  psm: '7',
  oem: '1',
  dpi: '80',

  // System Settings
  concurrency: Math.max(1, os.cpus().length - 1),
  saveInterval: 50,

  // Strategy for empty results:
  // 'request_again_and_try_again' OR 'upscale_and_try_again'
  on_empty_text_in_image: 'upscale_and_try_again' as 'request_again_and_try_again' | 'upscale_and_try_again',
}

// In-memory DB
let db: Record<string, string> = {}
let filesProcessedCount = 0

async function saveDb() {
  try {
    const jsonContent = JSON.stringify(db, null, 2)
    fs.writeFileSync(CONFIG.outputJsonPath, jsonContent)
  } catch (err) {
    console.error(`❌ Failed to write JSON file:`, err)
  }
}

// Helper: Check if image is effectively blank (solid white/color)
async function isImageBlank(imagePath: string): Promise<boolean> {
  // We check the Standard Deviation of pixel colors.
  // 0 = Solid color (Pure White or Pure Black)
  // We allow a tiny threshold (0.001) for compression artifacts.
  const command = `${CONFIG.magickCmd} "${imagePath}" -format "%[fx:standard_deviation]" info:`
  try {
    const { stdout } = await execPromise(command)
    const stdDev = parseFloat(stdout.trim())
    return stdDev < 0.001
  } catch (e) {
    // If magick check fails, assume it's NOT blank and let OCR try
    return false
  }
}

// Helper: Run OCR
// Added useFixedDpi param: We usually want DPI 80 for raw images,
// but want auto-detection for upscaled images.
async function runOcr(imagePath: string, useFixedDpi: boolean = true): Promise<string> {
  const dpiFlag = useFixedDpi ? `--dpi ${CONFIG.dpi}` : ''
  const command = `${CONFIG.tesseractCmd} "${imagePath}" stdout -l ${CONFIG.lang} --psm ${CONFIG.psm} --oem ${CONFIG.oem} ${dpiFlag}`

  try {
    const { stdout } = await execPromise(command)
    return stdout.toString().trim()
  } catch (e: any) {
    // console.log('Tesseract error/warning (ignoring):', e.message)
    return ''
  }
}

// Helper: Download Image (Overwrites local file)
async function downloadImage(id: string, destPath: string) {
  const url = `${CONFIG.remoteBaseUrl}/${id}.png`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer))
}

// Helper: Upscale Image using ImageMagick
async function upscaleImage(inputPath: string, outputPath: string) {
  // magick input.png -resize 300% output.png
  // Added -units/density to help Tesseract understand it's a "clean" high res image now
  const command = `${CONFIG.magickCmd} "${inputPath}" -resize 500% -units PixelsPerInch -density 300 -depth 8 "${outputPath}"`
  await execPromise(command)
}

async function processImage(file: string, total: number) {
  const id = assertIsDefinedAndReturn(file.split('.')[0])
  const inputPath = path.join(CONFIG.imagesDir, file)
  let text = ''

  try {
    // 1. Check if image is visually blank (Solid White)
    const isBlank = await isImageBlank(inputPath)

    if (isBlank) {
      // console.log(`   ⚪ [${id}] Image is blank/white. Skipping OCR.`)
      text = '' // Will trigger fallbacks or final EMPTY_IMAGE
    } else {
      // 2. First Attempt (Standard OCR)
      text = await runOcr(inputPath, true)
    }

    // 3. Handle Empty Result (Or Blank Image) based on Config
    if (!text) {
      if (CONFIG.on_empty_text_in_image === 'request_again_and_try_again') {
        // STRATEGY: DOWNLOAD AGAIN
        console.log(`⚠️ [${id}] Text empty/blank. Strategy: Re-download...`)
        try {
          await downloadImage(id, inputPath)

          // Check if the NEW image is blank
          if (await isImageBlank(inputPath)) {
            console.log(`   ⚪ [${id}] Downloaded image is also blank.`)
            // text remains empty
          } else {
            text = await runOcr(inputPath, true)
          }
        } catch (downloadErr: any) {
          console.error(`   ❌ [${id}] Download failed: ${downloadErr.message}`)
          throw downloadErr
        }
      } else if (CONFIG.on_empty_text_in_image === 'upscale_and_try_again') {
        // STRATEGY: UPSCALE (ImageMagick)
        // If it was detected as blank, upscaling won't help, but we try anyway
        // in case the "blank" check was a false positive due to faint text.

        const tempPath = path.join(os.tmpdir(), `${id}_upscaled.png`)

        try {
          await upscaleImage(inputPath, tempPath)

          // Run OCR on upscaled image without forcing DPI 80
          text = await runOcr(tempPath, false)

          if (text) console.log(`   ✨ [${id}] Recovered via upscale!`)
        } catch (magickErr: any) {
          console.error(`   ❌ [${id}] Upscale failed: ${magickErr.message}`)
        } finally {
          // Debugging: View the upscaled image if needed
          console.log('xdg-open', tempPath)
          // if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
        }
      }
    }

    // 4. Final Fallback
    if (!text) {
      console.log(`   💀 [${id}] Still empty. Marking EMPTY_IMAGE.`)
      text = 'EMPTY_IMAGE'
    } else if (text !== 'EMPTY_IMAGE') {
      console.log(`✅ [${filesProcessedCount}/${total}] ID: ${id} -> "${text}"`)
    }

    // 5. Save Result
    db[id] = text
    filesProcessedCount++

    if (filesProcessedCount % CONFIG.saveInterval === 0) {
      await saveDb()
    }
  } catch (err: any) {
    console.error(`❌ ERROR on ${file}:`, err.message)
    // We do NOT add to DB on fatal error, so it can be retried next time
  }
}

async function main() {
  console.log(`🚀 Starting Parallel Tesseract OCR Scan...`)
  console.log(`📂 Source Dir:   ${CONFIG.imagesDir}`)
  console.log(`⚡ Concurrency:  ${CONFIG.concurrency} threads`)
  console.log(`🛠️ Strategy:     ${CONFIG.on_empty_text_in_image}`)

  if (!fs.existsSync(CONFIG.imagesDir)) {
    console.error(`❌ Directory not found: ${CONFIG.imagesDir}`)
    process.exit(1)
  }

  // 1. Load Existing DB
  if (fs.existsSync(CONFIG.outputJsonPath)) {
    try {
      console.log(`📂 Loading existing results from ${CONFIG.outputJsonPath}...`)
      const existingData = fs.readFileSync(CONFIG.outputJsonPath, 'utf8')
      db = JSON.parse(existingData)

      // Remove 'EMPTY_IMAGE' entries so they are retried every time script runs
      let removedCount = 0
      Object.keys(db).forEach(key => {
        if (db[key] === 'EMPTY_IMAGE') {
          delete db[key]
          removedCount++
        }
      })

      console.log(`   Loaded ${Object.keys(db).length} valid entries (Removed ${removedCount} previous failures).`)
    } catch (e) {
      console.error('   ⚠️ Could not parse existing JSON, starting fresh.')
    }
  }

  // 2. Filter Files
  const allFiles = fs.readdirSync(CONFIG.imagesDir).filter(file => /^\d+\.png$/.test(file))

  const todoFiles = allFiles
    .filter(file => {
      const id = assertIsDefinedAndReturn(file.split('.')[0])
      // Skip if id exists in DB
      return !db[id]
    })
    .sort((a, b) => parseInt(a) - parseInt(b))

  console.log(`📊 Total Images: ${allFiles.length}`)
  console.log(`⏭️  Skipped:      ${allFiles.length - todoFiles.length}`)
  console.log(`🎯 Remaining:    ${todoFiles.length}`)

  if (todoFiles.length === 0) {
    console.log('🎉 Nothing to do!')
    return
  }

  // 3. Process Queue
  const queue = [...todoFiles]
  const totalToProcess = todoFiles.length

  const worker = async () => {
    while (queue.length > 0) {
      const file = queue.shift()
      if (file) {
        await processImage(file, totalToProcess)
      }
    }
  }

  const workers = Array(CONFIG.concurrency)
    .fill(null)
    .map(() => worker())

  await Promise.all(workers)

  // 4. Final Save
  console.log(`\n📝 Saving final output...`)
  await saveDb()
  console.log(`👋 Done.`)
}

process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted! Saving progress...')
  saveDb().then(() => process.exit())
})

main()
