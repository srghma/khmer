const esbuild = require("esbuild")
const inlineImportPlugin = require("esbuild-plugin-inline-import")
const { clean } = require("esbuild-plugin-clean")
const fs = require("fs")

const isWatch = process.argv.includes("--watch")

const contextParams = {
  entryPoints: [
    "src/content/drive-index.ts",
    "src/content/aistudio-index.tsx",
    // "src/background.ts",
    // "src/popup/index.tsx"
  ],
  bundle: true,
  // minify: true,
  sourcemap: true,
  outdir: "dist",
  target: ["chrome100"],
  format: "esm",
  // loader: { ".css": "css" }, // Or 'css' to bundle
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
  plugins: [
    // This removes files matching the patterns before the build starts
    inlineImportPlugin(),
    clean({
      patterns: [
        "dist/**",
        "!dist/manifest.json",
        // "!dist/popup.html"
      ],
    }),
  ],
}

async function build() {
  if (!fs.existsSync("dist")) fs.mkdirSync("dist")

  // Copy static assets
  fs.copyFileSync("src/manifest.json", "dist/manifest.json")

  // // Generate HTML for Popup
  // const popupHtml = `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <title>AI Studio Control</title>
  //       <link rel="stylesheet" href="popup/index.css">
  //       <meta charset="utf-8">
  //     </head>
  //     <body>
  //       <div id="root"></div>
  //       <script src="popup/index.js" type="module"></script>
  //     </body>
  //   </html>
  // `;
  // fs.writeFileSync("dist/popup.html", popupHtml);

  if (isWatch) {
    const ctx = await esbuild.context(contextParams)
    await ctx.watch()
    console.log("👀 Watching...")
  } else {
    await esbuild.build(contextParams)
    console.log("✅ Build complete")
  }
}

build()
