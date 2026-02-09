use crate::app_state::AppState;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{State, command};
use super::common::WordRow;

#[derive(Serialize, sqlx::FromRow)]
pub struct WordDetailRu {
    #[sqlx(rename = "WordDisplay")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub word_display: Option<String>,
    #[sqlx(rename = "Desc")]
    pub desc: String,
}

#[command]
pub async fn get_ru_words(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let sql = "SELECT Word FROM ru_Dict ORDER BY Word ASC";
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[command]
pub async fn get_word_detail_ru(
    state: State<'_, AppState>,
    word: String,
) -> Result<Option<WordDetailRu>, String> {
    let pool = state.get_pool().await?;
    let sql = "SELECT * FROM ru_Dict WHERE Word = ?";
    let row = sqlx::query_as::<_, WordDetailRu>(&sql)
        .bind(word)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(row)
}

#[command]
pub async fn search_ru_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let pattern = format!("%{}%", query);
    let sql = "SELECT Word FROM ru_Dict WHERE Desc LIKE ? ORDER BY LENGTH(Word) ASC LIMIT 50";
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .bind(pattern)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[derive(Serialize, sqlx::FromRow)]
pub struct RuWordDetailShortRow {
    #[sqlx(rename = "Word")]
    pub word: String,
    #[sqlx(rename = "Desc")]
    pub definition: String,
}

#[command]
pub async fn ru_for_many__full_details__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailRu>, String> {
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;
    let placeholders: Vec<String> = words.iter().map(|_| "?".to_string()).collect();
    // Use WordDetailRu struct logic (fields: WordDisplay, Desc).
    // Need a Raw struct for RU full details if not already present or if WordDetailRu doesn't include 'Word'.
    // WordDetailRu in ru.rs is:
    // pub struct WordDetailRu { pub word_display: Option<String>, pub desc: String }
    // It does NOT have 'word'. So we need a raw struct.

    let sql = format!(
        "SELECT * FROM ru_Dict WHERE Word IN ({})",
        placeholders.join(",")
    );

    // We need a raw struct to capture 'Word'
    #[derive(sqlx::FromRow)]
    struct RuDetailRaw {
        #[sqlx(rename = "Word")]
        word: String,
        #[sqlx(rename = "WordDisplay")]
        word_display: Option<String>,
        #[sqlx(rename = "Desc")]
        desc: String,
    }

    let mut query = sqlx::query_as::<_, RuDetailRaw>(&sql);
    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut result = HashMap::new();
    for row in rows {
        result.insert(row.word, WordDetailRu {
            word_display: row.word_display,
            desc: row.desc,
        });
    }

    for word in words {
        if !result.contains_key(&word) {
             return Err(format!("Word not found: {}", word));
        }
    }

    Ok(result)
}

#[command]
pub async fn ru_for_many__short_description(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<String>>, String> {
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;

    let placeholders: Vec<String> = words.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "SELECT Word, Desc
         FROM ru_Dict
         WHERE Word IN ({})",
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, RuWordDetailShortRow>(&sql);

    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut result: HashMap<String, Option<String>> = HashMap::with_capacity(words.len());

    for row in rows {
        result.insert(row.word, Some(row.definition));
    }

    for word in words {
        result.entry(word).or_insert(None);
    }

    Ok(result)
}

#[command]
pub async fn ru_for_many__short_description__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, String>, String> {// yes, bc we have such constraint
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;

    let placeholders: Vec<String> = words.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "SELECT Word, Desc
         FROM ru_Dict
         WHERE Word IN ({})",
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, RuWordDetailShortRow>(&sql);

    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut result: HashMap<String, String> = HashMap::with_capacity(words.len());

    for row in rows {
        result.insert(row.word, row.definition);
    }

    for word in words {
        if !result.contains_key(&word) {
             return Err(format!("Word not found: {}", word));
        }
    }

    Ok(result)
}
