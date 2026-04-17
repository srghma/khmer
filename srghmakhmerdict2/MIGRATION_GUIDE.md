# Srghma Khmer Dictionary - Migration Guide (SvelteKit)

This document provides a structural and functional overview of the Srghma Khmer Dictionary app for its migration to SvelteKit.

## 1. URL Structure & Routing

The application uses a nested routing structure where most pages preserve the Master-Detail (Sidebar + Content) view.

| Page | URL Path | Note |
| :--- | :--- | :--- |
| **Home (Default)** | `/` | Redirects to `/en` |
| **Dictionary Home** | `/:lang` | e.g., `/en`, `/km`, `/ru` |
| **Word Detail** | `/:lang/:word` | e.g., `/en/apple` |
| **History Home** | `/history` | Redirects to `/history/en` (last active lang) |
| **History Lang** | `/history/:lang` | e.g., `/history/en` |
| **History Detail** | `/history/:lang/:word` | |
| **Favorites Home** | `/favorites` | Redirects to `/favorites/en` |
| **Favorites Lang** | `/favorites/:lang` | |
| **Favorites Detail** | `/favorites/:lang/:word`| |
| **Anki Home** | `/anki` | Flashcard game root |
| **Anki Session** | `/anki/:lang/:word` | Active flashcard |
| **Anki Settings** | `/anki/settings/:sub` | e.g., `import`, `export` |
| **Analyzer** | `/khmer_analyzer` | |
| **Settings** | `/settings` | Global app settings |

---

## 2. Directory Structure Proposal (SvelteKit)

To maintain a common UI across language routes and handle the "Master-Detail" state, the following structure is recommended:

```text
src/routes/
├── +layout.svelte             // Shared Master-Detail shell & responsive logic
├── +page.ts                   // Redirect / to /en
├── [lang]/
│   ├── +layout.svelte         // Common UI for dictionary tabs
│   ├── +page.svelte           // Sidebar (List) + Welcome (Detail)
│   └── [word]/
│       └── +page.svelte       // Sidebar (List) + Dictionary Entry (Detail)
├── history/
│   ├── [lang]/
│   │   ├── +page.svelte       // History List
│   │   └── [word]/
│   │       └── +page.svelte   // History List + Word Detail
├── favorites/
│   ├── [lang]/
│   │   ├── +page.svelte       // Favorites List
│   │   └── [word]/
│   │       └── +page.svelte   // Favorites List + Word Detail
├── anki/
│   ├── +layout.svelte         // Anki game layout (Master-Detail)
│   ├── [lang]/
│   │   └── [word]/
│   │       └── +page.svelte
│   └── settings/
│       └── [subpage]/
│           └── +page.svelte
├── khmer_analyzer/
│   └── +page.svelte
└── settings/
    └── +page.svelte
```

---

## 3. UI Elements (Atomic Design)

### Atoms
- **Icons**: Language flags (🇬🇧, 🇰🇭, 🇷🇺), `RiStar` (Favorites), `RiHistory` (History), `HiArrowLeft` (Back), `GoogleSpeaker` (TTS).
- **Typography**: `KhmerWordUnit` (Analyzer graphemes), Phonetics.
- **Loaders**: `Spinner`.

### Molecules
- **SearchBar**: Input + result count + prefix/content search toggles.
- **WordListItem**: Sidebar row showing word and preview.
- **ActionGroup**: Detail view buttons (TTS, Share, Anki).
- **SelectionPopup**: Context menu for highlighting ("Search", "Analyze").

### Organisms
- **SidebarHeader**: Navigation tabs + SearchBar. Shared across all dict/history/fav routes.
- **SidebarContent**: **Virtualized List**. Note: Pagination/Virtualization must be handled client-side (e.g., using `svelte-virtual`).
- **DetailHeader**: Responsive header with word info and actions.
- **DictionaryEntry**: The main data view for word definitions.

---

## 4. Interaction & Responsive Logic

### The "Dictionary Widget"
- On **Desktop**, the right panel (Dictionary Widget) is persistent. Switching tabs on the left (`en`, `km`, `ru`) updates the sidebar list, but the widget remains visible on the right.
- The widget should be a shared component (e.g., `DetailView.svelte`) used in all `[word]/+page.svelte` routes.

### Device-Specific Buttons
- **Mobile Only**:
    - **Back Button**: `HiArrowLeft` in the detail header. It triggers `goto('/en')` or equivalent to hide the detail pane and show the list.
- **Desktop Only**:
    - **Persistent Sidebar**: Sidebar is never hidden.
- **Both**:
    - **TTS Speaker Icons**: Work via Google Translate or Native APIs.
    - **Anki Game Buttons**: Review buttons (Again, Hard, Good, Easy).

### Technical Note: Virtualization
Since the dictionary contains thousands of words, pagination via URL is not practical. The sidebar uses **client-side virtualization**. The URL only tracks the *selected* word, not the scroll position of the list (though scroll position is preserved in session state).
