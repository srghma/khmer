import { renderColoredText } from "./segmentation";

// This will be injected by the build script via esbuild define or window object
declare const RAW_DICTIONARY_LIST: string[];
declare const RAW_CONTENT_ID: string;

const STATE = {
  mode: "Dictionary" as "Dictionary" | "Segmenter",
  dictionary: new Set(RAW_DICTIONARY_LIST),
};

function init() {
  const container = document.getElementById("text-container");
  const rawDataElement = document.getElementById(RAW_CONTENT_ID);
  const toggleBtn = document.getElementById("toggle-mode");
  const statusLabel = document.getElementById("status-label");

  if (!container || !rawDataElement || !toggleBtn || !statusLabel) return;

  const rawText = rawDataElement.textContent || "";

  const render = () => {
    statusLabel.textContent = `Mode: ${STATE.mode} (Rendering...)`;

    // Allow UI to update before heavy lifting
    requestAnimationFrame(() => {
      const html = renderColoredText(rawText, STATE.mode, STATE.dictionary);
      container.innerHTML = html;
      statusLabel.textContent = `Mode: ${STATE.mode}`;
    });
  };

  toggleBtn.addEventListener("click", () => {
    STATE.mode = STATE.mode === "Dictionary" ? "Segmenter" : "Dictionary";
    render();
  });

  // Initial Render
  render();
}

document.addEventListener("DOMContentLoaded", init);
