import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

// --- Configuration ---
const ROOT_DIR = path.resolve(__dirname, "../..");
const DICT_PATH = path.join(ROOT_DIR, "khmer-spellchecker/dictionary.txt");

const INPUTS = [
  {
    name: "short-dict",
    title: "Краткий русско-кхмерский словарь",
    path: path.join(ROOT_DIR, "Краткий русско-кхмерский словарь--content.txt"),
  },
  {
    name: "gorgoniev",
    title: "Кхмерско-русский словарь-Горгониев",
    path: path.join(
      ROOT_DIR,
      "Кхмерско-русский словарь-Горгониев--content.txt",
    ),
  },
];

const OUT_DIR = path.join(__dirname, "../dist");

// --- Helpers ---

function generateHtml(
  title: string,
  rawContentId: string,
  scriptFileName: string,
  css: string,
  rawContent: string,
) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${css}</style>
</head>
<body>
    <header>
        <h3>${title}</h3>
        <button id="toggle-mode">Toggle Color Mode</button>
        <span id="status-label">Initializing...</span>
    </header>

    <div id="text-container">Loading content...</div>

    <!-- Raw Data Storage -->
    <div id="${rawContentId}" class="raw-data">${rawContent.replace(/</g, "&lt;")}</div>

    <script src="${scriptFileName}"></script>
</body>
</html>
  `;
}

async function build() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  console.log("Reading dictionary...");
  const dictContent = fs.readFileSync(DICT_PATH, "utf-8");
  // Clean dictionary: split by newline, trim, remove empty
  const dictArray = dictContent
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const dictJson = JSON.stringify(dictArray);

  const cssContent = fs.readFileSync(
    path.join(__dirname, "styles.css"),
    "utf-8",
  );

  for (const input of INPUTS) {
    console.log(`Processing ${input.title}...`);

    // 1. Read Content
    let textContent = "";
    try {
      textContent = fs.readFileSync(input.path, "utf-8");
    } catch (e) {
      console.error(`Could not read ${input.path}`);
      continue;
    }

    const rawContentId = `raw-${input.name}`;
    const jsFileName = `${input.name}.js`;
    const htmlFileName = `${input.name}.html`;

    // 2. Build JS Bundle specific for this file (to inject strict consts if needed,
    // or we can use one shared JS file, but here we bundle dictionary into it).
    // Note: Bundling the 5MB dictionary into JS might be heavy, but it ensures zero-latency lookup.

    await esbuild.build({
      entryPoints: [path.join(__dirname, "app.ts")],
      bundle: true,
      outfile: path.join(OUT_DIR, jsFileName),
      define: {
        RAW_DICTIONARY_LIST: dictJson,
        RAW_CONTENT_ID: `"${rawContentId}"`,
      },
      minify: true,
    });

    // 3. Generate HTML
    const html = generateHtml(
      input.title,
      rawContentId,
      jsFileName,
      cssContent,
      textContent,
    );
    fs.writeFileSync(path.join(OUT_DIR, htmlFileName), html);

    console.log(`Created ${htmlFileName}`);
  }

  // Create an index.html linking to both
  const indexHtml = `
  <!DOCTYPE html>
  <html>
  <head><title>Khmer Dictionaries</title><style>body{font-family:sans-serif;padding:50px;background:#1e1e1e;color:#ddd} a{color:#4ec9b0;font-size:1.5rem;display:block;margin:20px;}</style></head>
  <body>
      <h1>Available Dictionaries</h1>
      ${INPUTS.map((i) => `<a href="${i.name}.html">${i.title}</a>`).join("")}
  </body>
  </html>
  `;
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexHtml);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
