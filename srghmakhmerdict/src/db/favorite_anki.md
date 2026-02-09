To achieve the **absolute minimal** storage while still being able to use the `femto-fsrs` algorithm and query the database efficiently, here is the breakdown.

### 1. The Verdict: What to Keep vs. Delete

To run `femto-fsrs`, you **only** need the current state of the memory (`S` and `D`) and time info. The rest is metadata for humans/stats.

| Column            | Keep/Delete | Why?                                                                                                                                                                                                                         |
| :---------------- | :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`stability`**   | **KEEP**    | **Required Math Input.** Represents memory strength. Cannot be calculated without replaying a full history log (which you don't have).                                                                                       |
| **`difficulty`**  | **KEEP**    | **Required Math Input.** Represents item complexity. Cannot be calculated without history.                                                                                                                                   |
| **`last_review`** | **KEEP**    | **Required Math Input.** Needed to calculate `days_elapsed` (`now - last_review`). Without this, the algorithm doesn't know how much you've forgotten.                                                                       |
| **`due`**         | **KEEP**    | **Required for Performance.** While you _could_ technically store `interval` and calculate `due` on the fly (`last_review + interval`), you cannot efficiently index or query "Show me cards due today" without this column. |
| `reps`            | **DELETE**  | **Pure Metadata.** `femto-fsrs` does not use the number of repetitions in its formula. You only need this if you want to show "You reviewed this 50 times" in the UI.                                                        |
| `lapses`          | **DELETE**  | **Pure Metadata.** Not used in the formula.                                                                                                                                                                                  |
| `state`           | **DELETE**  | **Inferable.** You can infer the state: <br>1. If `last_review` is NULL $\to$ **New**.<br>2. If `stability` is low (e.g., <1.0) $\to$ **Learning**.<br>3. Otherwise $\to$ **Review**.                                        |

---

### 2. The Absolute Minimal Schema

You only need **4 columns** added to your favorites table.

```sql
stability    REAL     DEFAULT 0  -- (S)
difficulty   REAL     DEFAULT 0  -- (D)
last_review  INTEGER  NULL       -- NULL = New Card
due          INTEGER  NOT NULL   -- Used for sorting/filtering
```

### 3. Problems/Trade-offs of Minimalism

If you delete `reps`, `lapses`, and `state`:

1.  **No "Learning Steps":** Anki typically has a "Learning" phase (1min, 10min) before using the FSRS algorithm. By removing `state`, you are committing to **Pure FSRS**. This means even a new card gets scheduled via the algorithm immediately (e.g., first interval might be 1-4 days depending on `newCard` weights). _This is actually the preferred way to use `femto-fsrs`._
2.  **No Stats:** You cannot show the user "Total reviews: 153" or "Failed attempts: 12".
3.  **Leech Detection:** You cannot automatically suspend "Leeches" (cards you fail 10+ times) because you aren't tracking `lapses`.

If you are okay with these trade-offs, the minimal schema below is perfect.

---

### 4. The Migration (Minimal)

This migration converts your table to the minimal version.

```rust
// In your lib.rs
Migration {
    version: 3,
    description: "migrate_to_minimal_fsrs",
    sql: "
        CREATE TABLE favorites_minimal (
            word TEXT NOT NULL,
            language TEXT NOT NULL,
            timestamp INTEGER NOT NULL, -- Created Date

            -- FSRS Essential Data
            stability REAL NOT NULL DEFAULT 0,
            difficulty REAL NOT NULL DEFAULT 0,
            last_review INTEGER,        -- NULL implies 'New'
            due INTEGER NOT NULL,       -- Sort key for review queue

            PRIMARY KEY (word, language)
        );

        -- Copy existing data, mapping defaults
        INSERT INTO favorites_minimal (
            word, language, timestamp,
            stability, difficulty, last_review, due
        )
        SELECT
            word,
            language,
            timestamp,
            -- If stability/difficulty existed, copy them; otherwise 0
            COALESCE(stability, 0),
            COALESCE(difficulty, 0),
            last_review,
            -- If due existed, copy it; otherwise it is due now (timestamp)
            COALESCE(due, timestamp)
        FROM favorites;

        DROP TABLE favorites;
        ALTER TABLE favorites_minimal RENAME TO favorites;
    ",
    kind: MigrationKind::Up,
}
```

---

### 5. The TypeScript Implementation

Here is how you handle the logic without `state` or `reps`.

```typescript
// ==== FILE: srghmakhmerdict/src/db/favorite.ts ====
import { getUserDb } from './core'
import { createDeck, Grade } from './femto-fsrs'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'

const deck = createDeck()

export interface FavoriteItem {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  timestamp: number
  // Minimal FSRS
  stability: number
  difficulty: number
  last_review: number | null
  due: number
}

// ... removeFavorite, addFavorite, getFavorites ...

export const reviewCard = async (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  grade: Grade, // 1=Again, 2=Hard, 3=Good, 4=Easy
): Promise<void> => {
  const db = await getUserDb()
  const now = Date.now()

  // 1. Get current data
  const rows = await db.select<FavoriteItem[]>(
    'SELECT stability, difficulty, last_review FROM favorites WHERE word = $1 AND language = $2',
    [word, language],
  )
  if (rows.length === 0) return

  const current = rows[0]
  let nextS: number, nextD: number, nextI: number

  // 2. Logic: New vs Review
  if (current.last_review === null) {
    // Is New Card
    const card = deck.newCard(grade)
    nextS = card.S
    nextD = card.D
    nextI = card.I
  } else {
    // Is Existing Card
    const daysSinceReview = (now - current.last_review) / (24 * 60 * 60 * 1000)

    const card = deck.gradeCard({ D: current.difficulty, S: current.stability }, daysSinceReview, grade)
    nextS = card.S
    nextD = card.D
    nextI = card.I
  }

  // 3. Update DB
  const nextDue = now + nextI * 24 * 60 * 60 * 1000

  await db.execute(
    `
    UPDATE favorites SET
      stability = $3,
      difficulty = $4,
      last_review = $5,
      due = $6
    WHERE word = $1 AND language = $2
    `,
    [word, language, nextS, nextD, now, nextDue],
  )
}
```
