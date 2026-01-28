import fs from 'node:fs'

export interface ColumnConfig {
  header: string
  accessor: string
  width?: string
  type?: 'text' | 'code' | 'html' | 'status'
}

export interface ReportConfig {
  title: string
  columns: ColumnConfig[]
}

export class ReportStreamer {
  private stream: fs.WriteStream
  private columns: ColumnConfig[]
  private rowCount = 0

  // Batching to prevent huge string allocations
  private currentChunk: string[] = []
  private readonly CHUNK_SIZE = 500

  constructor(filePath: string, config: ReportConfig) {
    this.columns = config.columns
    this.stream = fs.createWriteStream(filePath)

    // Grid CSS generator
    const gridTemplate = config.columns.map(c => c.width || '1fr').join(' ')

    this.stream.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${config.title}</title>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: sans-serif; background: #f3f4f6; }
    #app { display: flex; flex-direction: column; height: 100%; }
    header { background: #1f2937; color: white; padding: 10px; display: flex; justify-content: space-between; }
    #list-container { flex: 1; overflow-y: auto; position: relative; }
    #phantom { position: absolute; top: 0; left: 0; right: 0; z-index: -1; }
    #list-content { position: absolute; top: 0; left: 0; right: 0; }

    .header-row { display: grid; grid-template-columns: ${gridTemplate}; background: #e5e7eb; border-bottom: 2px solid #ccc; font-weight: bold; font-size: 12px; }
    .header-cell { padding: 8px; border-right: 1px solid #ccc; }

    .row { display: grid; grid-template-columns: ${gridTemplate}; height: 220px; border-bottom: 1px solid #eee; background: white; width: 100%; }
    .cell { padding: 5px; border-right: 1px solid #eee; overflow: hidden; font-size: 12px; }

    .box { width: 100%; height: 100%; overflow: auto; border: 1px solid #eee; font-family: monospace; white-space: pre-wrap; font-size: 11px; }
    .badge { padding: 2px 5px; border-radius: 4px; font-weight: bold; font-size: 10px; }
    .st-ok { background: #d1fae5; color: #065f46; }
    .st-err { background: #fee2e2; color: #991b1b; }
  </style>
  <script>
    // Initialize Global Data Store
    window.DB = [];
    // We store data as array of JSON-strings to avoid object overhead during parse
    // DB[0] = '{"w":"...","s":"..."}'
  </script>
</head>
<body>
  <div id="app">
    <header><h1>${config.title}</h1><div id="stats">Loading...</div></header>
    <div class="header-row">${config.columns.map(c => `<div class="header-cell">${c.header}</div>`).join('')}</div>
    <div id="list-container"><div id="phantom"></div><div id="list-content"></div></div>
  </div>
`)
  }

  writeRow(data: Record<string, any>) {
    // if (Math.random() > 0.1) return
    // 1. Convert row to JSON string
    const json = JSON.stringify(data)
      .replace(/<\/script/g, '<\\/script')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
    // if (Math.random() > 0.5 && json.includes('<img')) return
    this.currentChunk.push(`'${json}'`)
    this.rowCount++

    // 2. Flush Chunk to script tag if full
    if (this.currentChunk.length >= this.CHUNK_SIZE) {
      this.flushChunk()
    }
  }

  private flushChunk() {
    if (this.currentChunk.length === 0) return
    // Write a small script block that pushes strings to the global array
    // This allows the browser to GC the script tag content after execution (mostly)
    this.stream.write(`<script>DB.push(${this.currentChunk.join(',')});</script>\n`)
    this.currentChunk = []
  }

  close() {
    this.flushChunk() // Flush remaining

    const columnsJson = JSON.stringify(this.columns)

    this.stream.write(`
  <script>
    (function() {
      const ROW_HEIGHT = 220;
      const BUFFER = 5;
      const COLUMNS = ${columnsJson};
      const TOTAL = DB.length;

      const container = document.getElementById('list-container');
      const phantom = document.getElementById('phantom');
      const content = document.getElementById('list-content');

      document.getElementById('stats').textContent = TOTAL.toLocaleString() + ' entries';
      phantom.style.height = (TOTAL * ROW_HEIGHT) + 'px';

      function esc(s) { return s ? s.replace(/&/g,"&amp;").replace(/</g,"&lt;") : ""; }

      function render() {
        const scrollTop = container.scrollTop;
        const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
        const endIdx = Math.min(TOTAL, Math.ceil((scrollTop + container.clientHeight) / ROW_HEIGHT) + BUFFER);

        content.style.transform = 'translateY(' + (startIdx * ROW_HEIGHT) + 'px)';

        let html = '';
        for (let i = startIdx; i < endIdx; i++) {
          // LAZY PARSE: The string exists in memory, we parse it JIT
          let item = {};
          try { item = JSON.parse(DB[i]); } catch(e){}

          html += '<div class="row">';
          for (const col of COLUMNS) {
             const val = item[col.accessor];
             let inner = '';
             if (col.type==='status') inner='<span class="badge '+(String(val).includes('ERR')?'st-err':'st-ok')+'">'+esc(val)+'</span>';
             else if (col.type==='html') inner='<div class="box">'+(val||'')+'</div>';
             else inner='<div class="box">'+esc(val)+'</div>';
             html += '<div class="cell">'+inner+'</div>';
          }
          html += '</div>';
        }
        content.innerHTML = html;
      }

      container.addEventListener('scroll', () => requestAnimationFrame(render));
      render();
    })();
  </script>
</body>
</html>`)
    this.stream.end()
  }
}
