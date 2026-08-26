# Anki Game View Spec

The flashcard review interface for "starred" dictionary items.

## ASCII Layout (Active Session)

```text
+---------------------------------------------------------------------------------+
| [X] [ SETTINGS ] [ GB 1/10 ] [ KH 0/0 ] [ RU 5/10 ]   [ GUESSING KHMER ]       |  <-- AnkiHeader
+---------------------------------------------------------------------------------+
| SIDEBAR (Cards Due)            | PLAY AREA (Right)                              |
|                                |                                                |
| * ផ្លែប៉ោម                      |   [ Card Front ]                               |
|   Due: Today                   |                                                |
|                                |   (Hidden Content or Text Area for input)      |  <-- DetailFetcher
| * ភាសា                          |                                                |
|   Due: 2 days                  |   ------------------------------------------   |
|                                |                                                |
| * រៀន                          |   [ SHOW ANSWER ]                              |  <-- AnkiRevealButton
|   Due: Today                   |                                                |
|                                |   (OR Rating Buttons if Revealed):             |
|                                |   [ AGAIN ] [ HARD ] [ GOOD ] [ EASY ]         |  <-- AnkiRatingButtons
|                                |                                                |
+---------------------------------------------------------------------------------+
```

## UI Element Descriptions

### AnkiHeader
- **Exit Button**: Large [X] button to leave the Anki game.
- **Tabs**:
  - Cog icon for Settings.
  - Language flags with "Today/Total" badge (e.g., 1/10 means 1 due now, 10 total in deck).
  - Disabled (grayscale) if no cards are due in that language.
- **Mode Toggle**: A persistent button on the right that switches the guessing direction (e.g., "Guess Khmer" vs "Guess Non-Khmer").

### Sidebar (Cards Due)
- **List Item**:
  - Displays the "Front" of the card (word or description snippet).
  - Shows "Due" status (Today, or interval).
  - Highlighted if currently selected.

### Play Area (Main Content)
- **DetailFetcher**:
  - Fetches the dictionary entry for the card.
  - Applies "Hiding" logic: If guessing Khmer, the Khmer words in the description are obscured until revealed.
- **Action Bar (Sticky Bottom)**:
  - **Before Reveal**: A single wide "SHOW ANSWER" button.
  - **After Reveal**: Four rating buttons (Again, Hard, Good, Easy) with their next review interval shown above (e.g., "1m", "2d").
