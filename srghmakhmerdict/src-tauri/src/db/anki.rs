use crate::AppState;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use sqlx::{FromRow, Type, query_as};
use std::collections::HashMap;
use tauri::{State, Window};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(i64)]
pub enum CardState {
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3,
}

impl Type<sqlx::Sqlite> for CardState {
    fn type_info() -> sqlx::sqlite::SqliteTypeInfo {
        <i64 as Type<sqlx::Sqlite>>::type_info()
    }

    fn compatible(ty: &sqlx::sqlite::SqliteTypeInfo) -> bool {
        <i64 as Type<sqlx::Sqlite>>::compatible(ty)
    }
}

impl<'r> sqlx::Decode<'r, sqlx::Sqlite> for CardState {
    fn decode(value: sqlx::sqlite::SqliteValueRef<'r>) -> Result<Self, sqlx::error::BoxDynError> {
        let value = <i64 as sqlx::Decode<sqlx::Sqlite>>::decode(value)?;
        match value {
            0 => Ok(CardState::New),
            1 => Ok(CardState::Learning),
            2 => Ok(CardState::Review),
            3 => Ok(CardState::Relearning),
            _ => Err(format!("Invalid CardState value: {}", value).into()),
        }
    }
}

impl<'q> sqlx::Encode<'q, sqlx::Sqlite> for CardState {
    fn encode_by_ref(
        &self,
        buf: &mut <sqlx::Sqlite as sqlx::Database>::ArgumentBuffer<'q>,
    ) -> Result<sqlx::encode::IsNull, sqlx::error::BoxDynError> {
        <i64 as sqlx::Encode<sqlx::Sqlite>>::encode_by_ref(&(*self as i64), buf)
    }
}

// 2. Handle Serde Mapping (Rust Enum <-> JSON Number)
impl Serialize for CardState {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i64(*self as i64)
    }
}

impl<'de> Deserialize<'de> for CardState {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = i64::deserialize(deserializer)?;
        match value {
            0 => Ok(CardState::New),
            1 => Ok(CardState::Learning),
            2 => Ok(CardState::Review),
            3 => Ok(CardState::Relearning),
            _ => Err(serde::de::Error::custom(format!(
                "Invalid CardState value: {}",
                value
            ))),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AnkiCardRow {
    word: String,
    due: i64,
    stability: f64,
    difficulty: f64,
    elapsed_days: i64,
    scheduled_days: i64,
    reps: i64,
    lapses: i64,
    state: CardState,
    last_review: Option<i64>,
}

#[tauri::command]
pub async fn get_all_anki_cards(
    state: State<'_, AppState>,
) -> Result<HashMap<String, AnkiCardRow>, String> {
    let pool = state.get_pool().await?;

    let rows = query_as::<_, AnkiCardRow>("SELECT * FROM anki")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut map = HashMap::new();
    for row in rows {
        map.insert(row.word.clone(), row);
    }

    Ok(map)
}

#[tauri::command]
pub async fn save_anki_cards(
    state: State<'_, AppState>,
    cards: HashMap<String, AnkiCardRow>,
) -> Result<(), String> {
    let pool = state.get_pool().await?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // In a real app, you might want to only update changed cards,
    // but for simplicity/robustness matching the 'save file' pattern, we upsert.
    // Note: This can be slow if thousands of cards.
    for (word, card) in cards {
        // Validation check (double safety alongside SQL constraints)
        if card.stability < 0.0 || card.difficulty < 0.0 {
            return Err(format!("Invalid FSRS parameters for word: {}", word));
        }

        sqlx::query(
            r#"
            INSERT INTO anki (
                word, due, stability, difficulty, elapsed_days,
                scheduled_days, reps, lapses, state, last_review
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(word) DO UPDATE SET
                due=excluded.due,
                stability=excluded.stability,
                difficulty=excluded.difficulty,
                elapsed_days=excluded.elapsed_days,
                scheduled_days=excluded.scheduled_days,
                reps=excluded.reps,
                lapses=excluded.lapses,
                state=excluded.state,
                last_review=excluded.last_review
            "#,
        )
        .bind(word)
        .bind(card.due)
        .bind(card.stability)
        .bind(card.difficulty)
        .bind(card.elapsed_days)
        .bind(card.scheduled_days)
        .bind(card.reps)
        .bind(card.lapses)
        .bind(card.state)
        .bind(card.last_review)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
