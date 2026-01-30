import fs from 'node:fs'

interface ReportItem {
  status: 'SUCCESS' | 'CONFLICT' | 'SKIPPED' | 'COMPLEX'
  fingerprint: string
  error?: string
  // Changed to array to support 2 or 3+ rows
  rows: Record<string, any>[]
  // Analysis is only relevant for pairs, but we keep it optional
  analysis?: {
    WordDisplay: { ok: boolean; msg: string }
    Desc: { ok: boolean; msg: string }
    Desc_en_only: { ok: boolean; msg: string }
  }
}

export class DetailedReportStreamer {
  private stream: fs.WriteStream
  private count = 0
  private chunk: string[] = []
  private readonly CHUNK_SIZE = 100

  constructor(filePath: string) {
    this.stream = fs.createWriteStream(filePath)
    this.stream.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Merge Conflict Report</title>
  <style>
    body { font-family: sans-serif; background: #f3f4f6; padding: 20px; color: #1f2937; }

    details { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; overflow: hidden; }
    summary { padding: 12px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: space-between; }
    summary:hover { background: #f9fafb; }

    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: bold; margin-right: 10px;}
    .st-SUCCESS { background: #d1fae5; color: #065f46; }
    .st-CONFLICT { background: #fee2e2; color: #991b1b; }
    .st-SKIPPED { background: #f3f4f6; color: #6b7280; }
    .st-COMPLEX { background: #e0e7ff; color: #3730a3; } /* For 3+ items */

    table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
    th { text-align: left; background: #f3f4f6; padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; word-wrap: break-word; border-right: 1px solid #f3f4f6; }

    .col-field { width: 120px; font-weight: bold; color: #4b5563; background: #f9fafb; }
    /* Dynamic width based on number of columns */
    .col-val { font-family: monospace; white-space: pre-wrap; }

    .cell-err { background: #fef2f2; color: #b91c1c; }
    .cell-ok { background: #f0fdf4; color: #15803d; }
    .cell-empty { color: #d1d5db; font-style: italic; }

    .global-error { padding: 10px; background: #fee2e2; color: #991b1b; font-weight: bold; font-size: 12px; border-bottom: 1px solid #fca5a5; }
  </style>
  <script>window.ITEMS = [];</script>
</head>
<body>
  <h1>Merge Report <span id="stats" style="font-size:14px; font-weight:normal; color:#666">...</span></h1>
  <div id="container"></div>
`)
  }

  writeItem(item: ReportItem) {
    const json = JSON.stringify(item)
      .replace(/<\/script/g, '<\\/script')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")

    this.chunk.push(`'${json}'`)
    this.count++
    if (this.chunk.length >= this.CHUNK_SIZE) this.flush()
  }

  flush() {
    if (this.chunk.length === 0) return
    this.stream.write(`<script>ITEMS.push(${this.chunk.join(',')});</script>\n`)
    this.chunk = []
  }

  close() {
    this.flush()
    this.stream.write(`
  <script>
    (function() {
      const container = document.getElementById('container');
      document.getElementById('stats').textContent = ITEMS.length + ' entries';

      function esc(s) {
        // User requested NO escaping for values to see raw HTML/content
        if (s === null || s === undefined) return '';
        return s;
      }

      // Helper to render a table row dynamically based on N rows
      function renderRow(label, rows, fieldName, analysis) {
        let isConflict = false;
        let conflictMsg = '';

        if (analysis && analysis[fieldName] && !analysis[fieldName].ok) {
          isConflict = true;
        }

        let html = '<tr>';
        html += \`<td class="col-field">\${label}</td>\`;

        rows.forEach(r => {
           const val = r ? r[fieldName] : null;
           const isEmpty = val === null || val === '';
           // Highlight specific cell if it's the valid row causing conflict?
           // For simplicity, just render raw values.
           html += \`<td class="col-val \${isEmpty ? 'cell-empty' : ''}">\${esc(val || '(null)')}</td>\`;
        });

        html += '</tr>';
        return html;
      }

      const fragment = document.createDocumentFragment();

      ITEMS.forEach(json => {
        let item = {};
        try { item = JSON.parse(json); } catch(e) { return; }

        const details = document.createElement('details');
        const rows = item.rows || [];
        const ana = item.analysis || {};

        // --- SUMMARY ---
        const summary = document.createElement('summary');

        // Generate title from words
        const words = rows.map(r => r.Word).join(' vs ');
        const titleText = words || (item.fingerprint.substring(0,50) + '...');

        summary.innerHTML = \`<div style="display:flex; align-items:center"><span class="status-badge st-\${item.status}">\${item.status}</span> <span>\${titleText}</span></div>\`;

        // --- CONTENT ---
        let content = '';

        if (item.error) {
          content += \`<div class="global-error">INFO/ERROR: \${esc(item.error)}</div>\`;
        }

        // Generate Headers
        let headers = '<th>Field</th>';
        if (item.status === 'SUCCESS' || item.status === 'CONFLICT') {
           // Assume Row 0 is Invalid (Target), Row 1 is Valid (Source)
           headers += '<th>Target (Keep Meta)</th><th>Source (Delete)</th>';
        } else {
           // Complex or Skipped (3+ items)
           rows.forEach((_, i) => { headers += \`<th>Row \${i+1}</th>\`; });
        }

        // Preview HTML (Just take the first one, or map all)
        let htmlPreviews = '<tr><td class="col-field">HTML Preview</td>';
        rows.forEach(r => {
           htmlPreviews += \`<td class="col-val"><div style="max-height:100px;overflow:hidden">\${esc(r.en_km_com || '')}</div></td>\`;
        });
        htmlPreviews += '</tr>';

        content += \`
          <table>
            <thead><tr>\${headers}</tr></thead>
            <tbody>
              \${renderRow('WordDisplay', rows, 'WordDisplay', ana)}
              \${renderRow('Desc', rows, 'Desc', ana)}
              \${renderRow('Desc_en_only', rows, 'Desc_en_only', ana)}
              \${htmlPreviews}
            </tbody>
          </table>
        \`;

        details.innerHTML = summary.outerHTML + content;
        fragment.appendChild(details);
      });

      container.appendChild(fragment);
    })();
  </script>
</body>
</html>`)
    this.stream.end()
  }
}
