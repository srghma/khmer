use crate::app_state::AppState;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{State, command};
use super::common::WordRow;

#[derive(Serialize, sqlx::FromRow)]
pub struct WordDetailEn {
    #[sqlx(rename = "WordDisplay")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub word_display: Option<String>,
    #[sqlx(rename = "Desc")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub desc: Option<String>,
    #[sqlx(rename = "Desc_en_only")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub desc_en_only: Option<String>,
    #[sqlx()]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub en_km_com: Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct WordDetailEnRaw {
    #[sqlx(rename = "Word")]
    pub word: String,
    #[sqlx(rename = "WordDisplay")]
    pub word_display: Option<String>,
    #[sqlx(rename = "Desc")]
    pub desc: Option<String>,
    #[sqlx(rename = "Desc_en_only")]
    pub desc_en_only: Option<String>,
    #[sqlx()]
    pub en_km_com: Option<String>,
}

impl From<WordDetailEnRaw> for WordDetailEn {
    fn from(raw: WordDetailEnRaw) -> Self {
        Self {
            word_display: raw.word_display,
            desc: raw.desc,
            desc_en_only: raw.desc_en_only,
            en_km_com: raw.en_km_com,
        }
    }
}

#[command]
pub async fn get_en_words(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let sql = "SELECT Word FROM en_Dict WHERE Desc IS NOT NULL OR en_km_com IS NOT NULL ORDER BY Word ASC";
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[command]
pub async fn get_word_detail_en(
    state: State<'_, AppState>,
    word: String,
    use_extension_db: bool,
) -> Result<Option<WordDetailEn>, String> {
    let pool = state.get_pool().await?;
    let sql = if use_extension_db {
        "SELECT DISTINCT d.* FROM en_Dict d JOIN en_Extension e ON d.Word = e.Extension WHERE e.Word = ?"
    } else {
        "SELECT * FROM en_Dict WHERE Word = ?"
    };
    let row = sqlx::query_as::<_, WordDetailEn>(&sql)
        .bind(word)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row)
}

#[command]
pub async fn search_en_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let pattern = format!("%{}%", query);
    let sql = "SELECT Word FROM en_Dict WHERE Desc LIKE ? ORDER BY LENGTH(Word) ASC LIMIT 50";
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .bind(pattern)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[derive(Serialize, sqlx::FromRow)]
pub struct EnKmComOcrRow {
    pub id: i64,
    pub text: String,
}

#[command]
pub async fn get_en_km_com_images_ocr(
    state: State<'_, AppState>,
    ids: Vec<i64>,
) -> Result<HashMap<i64, String>, String> {
    if ids.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;

    let placeholders: Vec<String> = ids.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "SELECT id, text FROM en_km_com_ocr WHERE id IN ({})",
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, EnKmComOcrRow>(&sql);

    for id in ids {
        query = query.bind(id);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let result: HashMap<i64, String> = rows.into_iter().map(|r| (r.id, r.text)).collect();

    Ok(result)
}

#[derive(Serialize, sqlx::FromRow)]
pub struct EnWordDetailShortRow {
    #[sqlx(rename = "Word")]
    pub word: String,
    pub definition: Option<String>,
}

#[command]
pub async fn en_for_many__short_description(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<String>>, String> {
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;

    let placeholders: Vec<String> = words.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "SELECT Word, COALESCE(Desc, en_km_com) as definition
         FROM en_Dict
         WHERE Word IN ({})",
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, EnWordDetailShortRow>(&sql);

    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut result: HashMap<String, Option<String>> = HashMap::with_capacity(words.len());

    for row in rows {
        result.insert(row.word, row.definition);
    }

    for word in words {
        result.entry(word).or_insert(None);
    }

    Ok(result)
}

#[command]
pub async fn en_for_many__short_description__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, String>, String> { // yes, not Option bc 100% definition will be returned, bc at least one is not NULL
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;

    let placeholders: Vec<String> = words.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "SELECT Word, COALESCE(Desc, en_km_com, Desc_en_only) as definition
         FROM en_Dict
         WHERE Word IN ({})",
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, EnWordDetailShortRow>(&sql);

    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut result: HashMap<String, String> = HashMap::with_capacity(words.len());

    for row in rows {
        if let Some(definition) = row.definition {
            result.insert(row.word, definition);
        }
    }

    for word in words {
        if !result.contains_key(&word) {
            return Err(format!("Word not found: {}", word));
        }
    }

    Ok(result)
}

#[command]
pub async fn en_for_many__full_details__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailEn>, String> {
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;
    let placeholders: Vec<String> = words.iter().map(|_| "?".to_string()).collect();

    let sql = format!(
        "SELECT * FROM en_Dict WHERE Word IN ({})",
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, WordDetailEnRaw>(&sql);
    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    // Check if all words are found
    if rows.len() != words.len() {
         // This simple check implies no duplicates in 'words'.
         // If 'words' has duplicates, distinct DB rows might be fewer.
         // But let's assume unique input or handle strict mapping.
         // A safer check is to verify each requested word exists.
    }

    let mut result = HashMap::new();
    for row in rows {
        result.insert(row.word.clone(), WordDetailEn::from(row));
    }

    for word in words {
        if !result.contains_key(&word) {
            return Err(format!("Word not found: {}", word));
        }
    }

    Ok(result)
}


#[command]
pub async fn en_for_many__full_details__none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailEn>>, String> {
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }

    let pool = state.get_pool().await?;

    let placeholders: Vec<String> = words.iter().map(|_| "?".to_string()).collect();

    let sql = format!(
        "SELECT * FROM en_Dict WHERE Word IN ({})",
        placeholders.join(",")
    );

    let mut query = sqlx::query_as::<_, WordDetailEnRaw>(&sql);
    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;
    let mut result = HashMap::new();

    for row in rows {
        result.insert(row.word.clone(), Some(WordDetailEn::from(row)));
    }

    for word in words {
        result.entry(word).or_insert(None);
    }

    Ok(result)
}
