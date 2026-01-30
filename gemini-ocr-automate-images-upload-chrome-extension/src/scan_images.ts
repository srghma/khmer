import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { delay } from './utils/delay'

// --- CONFIGURATION ---
const CONFIG = {
  imagesDir: '/home/srghma/projects/en_Dict_en_km_com_assets_images_png',
  // We create a subfolder for output to avoid cluttering the source
  outputDir: '/home/srghma/projects/en_Dict_en_km_com_assets_images_png/translated',
  googleUrl: 'https://translate.google.com/?sl=km&tl=en&op=images', // Auto to English
  onErrorStop: true,
  headless: false,
}

puppeteer.use(StealthPlugin())

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  console.log(`🚀 Starting Image Translation Scan...`)
  console.log(`📂 Source Dir: ${CONFIG.imagesDir}`)
  console.log(`📂 Output Dir: ${CONFIG.outputDir}`)

  // Ensure directories exist
  if (!fs.existsSync(CONFIG.imagesDir)) {
    console.error(`❌ Directory not found: ${CONFIG.imagesDir}`)
    process.exit(1)
  }
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true })
  }

  // Get File List
  const files = fs
    .readdirSync(CONFIG.imagesDir)
    .filter(file => /^\d+\.png$/.test(file)) // Filter for 1.png, 2.png, etc.
    .sort((a, b) => parseInt(a) - parseInt(b))

  console.log(`found ${files.length} images.`)

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // Set permissions just in case, though mostly needed for clipboard
    const context = browser.defaultBrowserContext()
    await context.overridePermissions('https://translate.google.com', ['clipboard-read', 'clipboard-write'])

    for (const file of files) {
      const id = parseInt(file.split('.')[0], 10)
      const inputPath = path.join(CONFIG.imagesDir, file)
      const outputFilename = `${id}_translated.jpeg`
      const outputPath = path.join(CONFIG.outputDir, outputFilename)

      // --- CACHE CHECK (File System) ---
      if (fs.existsSync(outputPath)) {
        // console.log(`⏭️  [SKIP] ${file} already translated.`)
        continue
      }

      console.log(`🔍 [PROCESSING] ${file}...`)

      try {
        // 1. Navigate to Google Translate Images
        await page.goto(CONFIG.googleUrl, { waitUntil: 'domcontentloaded' })

        console.log('goto')

        await sleep(2 * 1000)

        console.log('uploading', inputPath)

        // 2. Upload File
        // We use the generic input[type="file"] as it is more stable than the dynamic CSS selector in the snippet
        const inputUploadHandle = await page.waitForSelector('input[type="file"].ZdLswd', { timeout: 300000 })
        if (!inputUploadHandle) throw new Error('File input not found')

        console.log('uploading', inputPath)

        await inputUploadHandle.uploadFile(inputPath)

        // 3. Wait for the Translated Image
        // This selector comes from your provided snippet: targets the result image
        const translatedImageSelector = 'div.CMhTbb:nth-child(2) > img:nth-child(1)'
        const errorTextSelector = 'div.uqt39c, div[aria-live="polite"]' // Common error containers

        // Race condition: Wait for Image OR Error
        await page.waitForFunction(
          (imgSel, errSel) => {
            // Check for success image
            if (document.querySelector(imgSel)) return true

            // Check for error text
            const bodyText = document.body.innerText
            if (bodyText.includes("Can't translate this file") || bodyText.includes("Can't scan this file")) {
              throw new Error("GOOGLE_ERROR: Can't translate this file format")
            }
            return false
          },
          { timeout: 450000 },
          translatedImageSelector,
          errorTextSelector,
        )

        // 4. Extract Blob Data (Logic from your snippet)
        const base64Data = await page.evaluate(async selector => {
          const img = document.querySelector(selector) as HTMLImageElement
          if (!img) throw new Error('Image element not found during evaluation')

          const blobUrl = img.src

          // Fetch the blob content from inside the browser context
          const blob = await fetch(blobUrl).then(r => r.blob())

          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          })
        }, translatedImageSelector)

        // 5. Save to Disk
        // Convert Base64 (DataURL) to Buffer
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (!matches || matches.length !== 3) {
          throw new Error('Invalid base64 string returned from Google')
        }

        const imageBuffer = Buffer.from(matches[2], 'base64')

        // Write file (Using native Node/Bun fs instead of sharp for simplicity)
        fs.writeFileSync(outputPath, imageBuffer)

        console.log(`   ✅ Saved to: ${outputFilename}`)

        // Random sleep to be nice to Google
        await sleep(Math.floor(Math.random() * 2000) + 1000)
      } catch (err: any) {
        console.error(`   ❌ ERROR on ${file}: ${err.message}`)

        if (err.message.includes('GOOGLE_ERROR')) {
          console.log('   ⚠️ Skipping file due to Google Error.')
          continue
        }

        if (CONFIG.onErrorStop) {
          console.error('🛑 CONFIG.onErrorStop is TRUE. Exiting...')
          process.exit(1)
        }
      }
    }
  } catch (err) {
    console.error('❌ Fatal Browser Error:', err)
  } finally {
    if (browser) await browser.close()
    console.log('👋 Done.')
  }
}

main()
