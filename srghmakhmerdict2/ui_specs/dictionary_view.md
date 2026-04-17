# Dictionary View Spec (Split-Pane)

This is the primary layout for the dictionary (EN, KM, RU), History, and Favorites.

## ASCII Layout (Desktop)

```text
+---------------------------------------------------------------------------------+
| [ GB ] [ KH ] [ RU ] [ HIST ] [ FAV ] [ SETTINGS ]                             |  <-- SidebarHeader Tabs
+---------------------------------------------------------------------------------+
| [ Search dictionary... (1,234) ] [ PREF / CONT ]                               |  <-- SearchBar
+---------------------------------------------------------------------------------+
| SIDEBAR (List)                 | DETAIL PANEL (Right)                           |
|                                |                                                |
| * Apple                        |   [Title: Apple] [Phonetic: /'æpl/]            |  <-- DetailHeader
|   Fruit that grows on trees... |   [TTS] [FAV] [SHARE] [ANKI]                   |  <-- DetailActions
|                                |   ------------------------------------------   |
| * Banana                       |   1. A round fruit with red or green skin.     |  <-- DetailSections
|   Long yellow fruit...         |   2. The tree that bears this fruit.           |
|                                |                                                |
| * Cherry                       |   [ SYNONYMS ]                                 |
|   Small red fruit...           |   - Malus domestica                            |
|                                |                                                |
| * Date                         |   [ KHMER LINKS ]                              |
|   Sweet brown fruit...         |   - ផ្លែប៉ោម                                    |
|                                |                                                |
+---------------------------------------------------------------------------------+
```

## ASCII Layout (Mobile)

**Master View (List)**:
```text
+----------------------------------+
| [ GB ] [ KH ] [ RU ] [ H ] [ F ] |
+----------------------------------+
| [ Search... ]                    |
+----------------------------------+
| * Apple                          |
| * Banana                         |
| * Cherry                         |
+----------------------------------+
```

**Detail View (Hidden Sidebar)**:
```text
+----------------------------------+
| [BACK] [ Apple ] [TTS] [F] [A]   |  <-- Header scrollshadow on mobile
+----------------------------------+
|                                  |
|   Phonetic: /'æpl/               |
|                                  |
|   1. A round fruit...            |
|                                  |
+----------------------------------+
```

## UI Element Descriptions

### Sidebar (Master)
- **Tabs**: 6 tabs at the top. Use flag icons for languages and standard icons for history/favorites/settings.
- **SearchBar**:
  - Input field with floating label.
  - Results count indicator (e.g., "1,234 words found").
  - Mode toggle: Switch between "Prefix" (starts with) and "Content" (anywhere) search.
- **Virtualized List**:
  - Scrollable area containing `WordListItem` components.
  - Each item shows the word in bold and a truncated 1-line definition preview.

### Detail Panel (Right)
- **DetailHeader**:
  - **Title**: Large bold text of the word.
  - **Phonetic**: Chip with mono font containing IPA.
  - **Action Row**: Horizontal row of icon buttons (Speaker for TTS, Star for Favorite, etc.).
- **DetailContent**:
  - Multiple sections depending on data availability (Chuon Nath, Wiktionary, etc.).
  - **Khmer Links**: Interactive text where clicking a Khmer word navigates the app to that word's definition.
