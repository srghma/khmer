# Srghma Khmer Dictionary - Migration Guide (SvelteKit)

This document provides a structural and functional overview of the Srghma Khmer Dictionary app to facilitate its migration from React/Tauri to SvelteKit.

## 1. Application Architecture

The app follows a **Master-Detail** pattern. It consists of a navigation/list sidebar (Master) and a content panel (Detail). The layout is responsive, switching from a split-pane view on desktop to a single-pane view on mobile.

### Core Systems:
- **Dictionary Engines**: EN-KM, RU-KM, and KM-KM (Chuon Nath, etc.).
- **Search System**: Real-time filtering with prefix and content search modes.
- **Khmer Analyzer**: A specialized tool for segmenting Khmer sentences.
- **Anki Flashcards**: A SRS system integrated with favorites.
- **Tauri Integration**: Uses Rust for heavy database operations (SQLite).

---

## 2. UI Elements (Atomic Design)

### Atoms
- **Icons**: Language flags (🇬🇧, 🇰🇭, 🇷🇺), `RiStar` (Favorites), `RiHistory` (History), `RiSettings` (Settings), `HiArrowLeft` (Back), `GoogleSpeaker` (TTS).
- **Chips**: Phonetic displays (e.g., `/pʰiə.saː/`).
- **Text Units**: `KhmerWordUnit` (individual graphemes in the Analyzer).
- **Loaders**: HeroUI `Spinner`.

### Molecules
- **SearchBar**: Input + result count + SearchMode toggles.
- **WordListItem**: Sidebar row with word, preview, and favorite toggle.
- **ActionGroup**: Row of buttons in DetailView for TTS, share, and Anki.
- **SelectionPopup**: Context menu for text selection ("Search", "Analyze").

### Organisms
- **SidebarHeader**: Main navigation tabs + search bar.
- **SidebarContent**: Virtualized list for words, history, or favorites.
- **DetailHeader**: Responsive header with word info and actions.
- **DetailSections**: Content renderer for various dictionary sources.
- **KhmerAnalyzerView**: Interactive sentence segmentation tool.

### Pages / Templates
- **MainLayout (AppMain)**: Root layout managing the responsive split-pane.
- **AnkiGame**: SRS interface using the same Master-Detail pattern.

---

## 3. Pages, Subpages, and URLs

| Page | URL Path | Sidebar (Master) | Right Panel (Detail) |
| :--- | :--- | :--- | :--- |
| **English Home** | `/en` | EN word list | Welcome Screen |
| **Khmer Home** | `/km` | KM word list | Welcome Screen |
| **Russian Home** | `/ru` | RU word list | Welcome Screen |
| **Word Detail** | `/:lang/:word` | Active list (contextual) | **Dictionary Entry** |
| **History** | `/history` | Recent words list | Welcome / Last viewed |
| **Favorites** | `/favorites` | Starred words list | Welcome / Last viewed |
| **Settings** | `/settings` | Settings menu | Welcome / Last viewed |
| **Analyzer** | `/khmer_analyzer` | Tabs only | Analyzer Tool |
| **About** | `/about` | Tabs only | Credits |

**Note**: In SvelteKit, these should map to `src/routes/[lang]/[[word]]/+page.svelte` and specific routes for `/settings`, `/history`, etc.

---

## 4. Device-Specific Behavior

### Desktop (Split-Pane)
- **Persistent Sidebar**: The Master list is always visible.
- **Navigation**: Clicking a list item updates the Right Panel via URL change without resetting sidebar state.
- **Back Button**: **Hidden**. No back button is needed as the "Master" is always present.

### Mobile (Single-Pane)
- **Mutual Exclusion**: Either the Sidebar OR the Detail Panel is visible.
- **Detail View Trigger**: Navigating to a word (e.g., `/en/apple`) hides the sidebar.
- **Back Button**: **Visible**. A back arrow (`HiArrowLeft`) appears in the Detail Header. Clicking it navigates back to the base route (e.g., `/en`), restoring the list view.
- **Action Overflow**: Detail header actions are wrapped in a horizontal scrollable area.

### Universal
- **Dictionary Widget**: When switching language tabs (EN/KM/RU), the Right Panel (the "widget") preserves its state or shows the selected word from that specific language's context.
- **TTS/Selection**: All speech and context-menu buttons work across both screen sizes.
