# Khmer Analyzer View Spec

A tool for segmenting and analyzing Khmer sentences.

## ASCII Layout

```text
+---------------------------------------------------------------------------------+
| [BACK]  [ KHMER ANALYZER ]  [ HIST ]  [ SETTINGS TOOLBAR ]                      |  <-- Sticky Header
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [ TEXT INPUT AREA ]                                                            |  <-- GoogleTranslateTextarea
|  "ភាសាខ្មែរគឺជាភាសាផ្លូវការ..."                                                      |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | SEGMENTATION                                                    [DICT] [I] |  <-- HeaderToggler
|  | +-----------------------------------------------------------------------+ |  |
|  | | [ ភាសា ] [ ខ្មែរ ] [ គឺ ] [ ជា ] [ ភាសា ] [ ផ្លូវការ ]                         | |  <-- SegmentationPreview
|  | +-----------------------------------------------------------------------+ |  |
|  +---------------------------------------------------------------------------+  |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | CHARACTER ANALYSIS                                              [D] [INTL] |  |
|  | +-----------------------------------------------------------------------+ |  |
|  | | [ ភ ] [ ា ] [ ស ] [ ា ] | [ ខ ] [ ្ ] [ ម ] [ ែ ] [ រ ]                       | |  <-- KhmerAnalyzer
|  | +-----------------------------------------------------------------------+ |  |
|  +---------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

## UI Element Descriptions

### Sticky Header
- **Back Button**: Standard navigation back arrow.
- **Title**: "Khmer Analyzer".
- **History Button**: Opens a dropdown/modal with previously analyzed texts.
- **Toolbar**: Toggles for "Show Short Details" and "Colorization Mode".

### Input Area
- **Textarea**: Large multi-line input field.
- **Debounce**: Analysis triggers automatically after a 1.5s pause in typing.
- **Google Translate Integration**: Optional bottom area showing machine translation.

### Analysis Results
- **Segmentation Section**:
  - Displays the sentence broken into words.
  - Each word is a button/link that can show a popup definition or navigate to the dictionary.
  - Toggle between "Dictionary" and "International" segmentation algorithms.
- **Character Analysis**:
  - Displays the sentence broken into atomic graphemes/characters.
  - Useful for learners to see consonant clusters and vowel placements.
