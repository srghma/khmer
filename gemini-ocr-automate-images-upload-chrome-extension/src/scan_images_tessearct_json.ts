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

  // Specific list of IDs to retry/upsert (Array of numbers)
  retryJsonPath:
    '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/scan_images_tesseract.json',

  remoteBaseUrl: 'https://www.english-khmer.com/imgukh',

  // OCR Settings
  tesseractCmd: 'tesseract',
  magickCmd: 'magick',
  lang: 'khm+eng',
  psm: '7',
  oem: '1',
  dpi: '80', // Default for raw images

  // System Settings
  concurrency: Math.max(1, os.cpus().length - 1),
  saveInterval: 50,
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

// Helper: Check if image is effectively blank
async function isImageBlank(imagePath: string): Promise<boolean> {
  const command = `${CONFIG.magickCmd} "${imagePath}" -format "%[fx:standard_deviation]" info:`
  try {
    const { stdout } = await execPromise(command)
    return parseFloat(stdout.trim()) < 0.001
  } catch (e) {
    return false
  }
}

// Helper: Run OCR
// dpiValue: pass specific number (e.g. 300) or null to omit flag
async function runOcr(imagePath: string, dpiValue: number | null = 80): Promise<string> {
  const dpiFlag = `--dpi ${dpiValue}`
  const command = `${CONFIG.tesseractCmd} "${imagePath}" stdout -l ${CONFIG.lang} --psm ${CONFIG.psm} --oem ${CONFIG.oem} ${dpiFlag}`

  try {
    const { stdout } = await execPromise(command)
    console.log('stdout', stdout)
    return stdout.toString().trim()
  } catch (e: any) {
    console.log('e', e.message)
    return ''
  }
}

// Helper: Upscale Image using ImageMagick
async function upscaleImage(inputPath: string, outputPath: string) {
  // Increased settings: 500% resize, 300 DPI density
  const command = `${CONFIG.magickCmd} "${inputPath}" -resize 500% -units PixelsPerInch -density 300 -depth 8 "${outputPath}"`
  await execPromise(command)
}

async function processImage(file: string, total: number, forceUpscale: boolean) {
  const id = assertIsDefinedAndReturn(file.split('.')[0])
  const inputPath = path.join(CONFIG.imagesDir, file)
  let text = ''

  try {
    // 1. Check Blank
    if (await isImageBlank(inputPath)) {
      console.log(`   ⚪ [${id}] Image is blank.`)
      text = 'EMPTY_IMAGE'
    }
    // 2. Forced Upscale Mode (Retry List)
    else if (forceUpscale) {
      const tempPath = path.join(os.tmpdir(), `${id}_retry_upscaled.png`)
      try {
        await upscaleImage(inputPath, tempPath)
        // Run OCR with explicit DPI 300 matching the upscale density
        text = await runOcr(tempPath, 300)

        if (text) console.log(`   ✨ [${id}] Upserted via forced upscale!`)
      } catch (err: any) {
        console.error(`   ❌ [${id}] Upscale failed: ${err.message}`)
      } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
      }
    }
    // 3. Standard Mode
    else {
      text = await runOcr(inputPath, 80)

      // Fallback to upscale if empty (Logic from previous script preserved)
      if (!text) {
        const tempPath = path.join(os.tmpdir(), `${id}_fallback_upscaled.png`)
        try {
          await upscaleImage(inputPath, tempPath)
          text = await runOcr(tempPath, 300)
        } catch (e) {
        } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
        }
      }
    }

    // 4. Final Result Handling
    if (!text) {
      console.log(`   💀 [${id}] Result empty.`)
      text = 'EMPTY_IMAGE'
    } else if (text !== 'EMPTY_IMAGE') {
      console.log(`✅ [${filesProcessedCount}/${total}] ID: ${id} -> "${text}"`)
    }

    // 5. Update DB (Upsert)
    db[id] = text
    filesProcessedCount++

    if (filesProcessedCount % CONFIG.saveInterval === 0) {
      await saveDb()
    }
  } catch (err: any) {
    console.error(`❌ ERROR on ${file}:`, err.message)
  }
}

async function main() {
  console.log(`🚀 Starting OCR Scan...`)

  // 1. Load DB
  if (fs.existsSync(CONFIG.outputJsonPath)) {
    try {
      db = JSON.parse(fs.readFileSync(CONFIG.outputJsonPath, 'utf8'))
      console.log(`   Loaded ${Object.keys(db).length} entries from DB.`)
    } catch (e) {}
  }

  let todoFiles: string[] = []
  let isRetryMode = false

  // 2. Determine Mode: Retry List vs Full Scan
  if (fs.existsSync(CONFIG.retryJsonPath)) {
    console.log(`📋 Found Retry List: ${CONFIG.retryJsonPath}`)
    const retryIds = JSON.parse(fs.readFileSync(CONFIG.retryJsonPath, 'utf8')) as number[]

    // Convert numbers to filenames (123 -> "123.png")
    todoFiles = retryIds.map(id => `${id}.png`)
    isRetryMode = true

    console.log(`🔥 RETRY MODE ACTIVE: Processing ${todoFiles.length} specific images with FORCED UPSCALE.`)
  } else {
    // Normal Mode
    console.log(`📂 Scanning directory: ${CONFIG.imagesDir}`)
    const allFiles = fs.readdirSync(CONFIG.imagesDir).filter(file => /^\d+\.png$/.test(file))
    todoFiles = allFiles
      .filter(file => !db[assertIsDefinedAndReturn(file.split('.')[0])]) // Skip if already done
      .sort((a, b) => parseInt(a) - parseInt(b))

    console.log(`   Normal Mode: ${todoFiles.length} new images found.`)
  }

  if (todoFiles.length === 0) {
    console.log('🎉 Nothing to do!')
    return
  }

  // 3. Process Queue
  const queue = [...todoFiles]
  const total = todoFiles.length

  const worker = async () => {
    while (queue.length > 0) {
      const file = queue.shift()
      if (file) {
        await processImage(file, total, isRetryMode)
      }
    }
  }

  const workers = Array(CONFIG.concurrency)
    .fill(null)
    .map(() => worker())
  await Promise.all(workers)

  console.log(`\n📝 Saving final output...`)
  await saveDb()
  console.log(`👋 Done.`)
}

process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted! Saving progress...')
  saveDb().then(() => process.exit())
})

main()
