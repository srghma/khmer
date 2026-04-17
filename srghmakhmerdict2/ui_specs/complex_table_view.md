# Khmer Complex Table View Spec

An educational matrix showing all possible consonant-vowel combinations and their word counts in the dictionary.

## ASCII Layout

```text
+---------------------------------------------------------------------------------+
| [X]  KHMER CONSONANT-VOWEL MATRIX                                               |  <-- Header
| Series A [Red]  Series O [Blue]  (12,345 verified words)                        |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  +--------------+  +--------------+  +--------------+                           |
|  |      ក       |  |      ខ       |  |      គ       |  <-- Consonant Header (Click to Hear)
|  +--------------+  +--------------+  +--------------+                           |
|  | កា [5] | កិ [2] |  | ខា [3] | ខិ [1] |  | គា [8] | គិ [0] |  <-- Matrix Grid
|  | កី [1] | កឹ [4] |  | ខី [0] | ខឹ [2] |  | គី [3] | គឹ [1] |
|  +--------------+  +--------------+  +--------------+                           |
|                                                                                 |
|  [ SUPPLEMENTARY CONSONANTS ]                                                   |
|  +--------------+                                                               |
|  |      ហ្គ      |                                                               |
|  +--------------+                                                               |
|                                                                                 |
|  [ INDEPENDENT CHARACTERS ]                                                     |
|  [ ឥ (12) ]  [ ឦ (5) ]  [ ឧ (20) ]                                               |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

## UI Element Descriptions

### Header
- **Exit Button**: Large [X] to close the view.
- **Legend**: Explains the color coding (Series A vs Series O) and shows total word coverage.

### Consonant Blocks
- **Header**: Large bold Khmer consonant. Clicking it triggers TTS for the consonant itself.
- **Matrix Grid**:
  - Each cell is a button containing the consonant + vowel combination (e.g., ក + ា = កា).
  - Displays a count of dictionary words starting with that combination.
  - Disabled (faded) if the count is zero.
  - Clicking a cell opens a "Word Deck" modal listing those words.

### Independent Characters
- Individual large cards for characters that aren't combinations.
- Shows total word count in parentheses.

### Word Deck Modal (Implicit)
- When a cell is clicked, a modal slides in showing a list of words.
- Each word in the list is clickable to navigate to its dictionary definition.
