# Khmer dictionary

TODO: add to en info about dicts without khmer in their Descinfo about dicts without khmer in their Desc https://www.english-khmer.com/index.php?gcm=1&gword=mephitic

# Anki

there should be 1 button to open anki modal, inside of anki game there should be 2 button groups: 1 group - 3 buttons "en db", "km", "ru", 2 group "description -> word" or "word -> description"

therefore 6 modes of game:

1. "you are shown khmer db - list is a Word (khmer word) - you try to guess translation (en or ru) (in your mind)"
2. "you are shown khmer db - list is a Desc (en or ru) fields where khmer text is removed - you try to guess Word (km) (there is also "fill in blank" that will show diff on reveal, filled optionally)"

3. "you are shown en db - list is a Word (en word) - you try to guess translation (km) (in your mind)"
4. "you are shown en db - list is a Desc (en) fields where non-khmer text is removed - you try to guess Word (there is also "fill in blank" that will show diff on reveal, filled optionally)"

5. "you are shown ru db - list is a Word (ru word) - you try to guess translation (km) (in your mind)"
6. "you are shown ru db - list is a Desc (ru) fields where non-khmer text is removed - you try to guess Word (there is also "fill in blank" that will show diff on reveal, filled optionally)"

the modal should be divided on 2 parts just like the App.tsx:

- on left - list of all favourite items for one of 3 langauges
- on right - the currenly selected item (selected by user or on initialization - first today's due item)

the list of favorite items:

1. in GUESS_KHMER mode (2, 3, 5)

- should show Word or Desc without khmer chars (mimic WordDetailKm_WithoutKhmerAndHtml getBestDefinitionHtml)

2. in GUESS_NON_KHMER (1, 4, 6)

- should show Word or Desc without non khmer chars (mimic WordDetailEn_OnlyKhmerAndWithoutHtml and WordDetailRu_OnlyKhmerAndWithoutHtml getBestDefinitionHtml)

# Anki impl

the useAnkiGameInitialData_GUESSING_NON_KHMER and useAnkiGameInitialData_GUESSING_KHMER are correct, they should not use manager inside

there should at some point a component, it bifurcates in two, one is using useAnkiGameInitialData_GUESSING_NON_KHMER other useAnkiGameInitialData_GUESSING_KHMER

then they pass data to another component + required getCard etc that joins bifurcations and calls manager inside

the joining component should be stupid, it should not know what is stored in the list, all funcs to handle list items are passed into the component
