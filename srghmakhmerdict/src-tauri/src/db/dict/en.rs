use crate::app_state::AppState;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{State, command};
use super::common::{WordRow, ShortDefinitionEn, EnShortDefinitionSource, validate_words_not_empty, get_placeholders, to_strict_map, to_optional_map, to_optional_map_wrap, fetch_many};

const EN_SHORT_DESC_COALESCE: &str = "COALESCE(Desc, en_km_com, Desc_en_only)";
const EN_SHORT_DESC_SOURCE: &str = "(CASE
    WHEN Desc IS NOT NULL THEN 1
    WHEN en_km_com IS NOT NULL THEN 2
    WHEN Desc_en_only IS NOT NULL THEN 3
    ELSE 0 END)";

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
    pub definition: String,
    pub source: EnShortDefinitionSource,
}

#[command]
pub async fn en_for_many__short_description__none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<ShortDefinitionEn>>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT Word, {} as definition, {} as source FROM en_Dict WHERE Word IN ({})",
        EN_SHORT_DESC_COALESCE,
        EN_SHORT_DESC_SOURCE,
        get_placeholders(words.len())
    );

    let rows: Vec<EnWordDetailShortRow> = fetch_many(&pool, &words, sql).await?;

    Ok(to_optional_map(words, rows, |r| r.word.clone(), |r| Some(ShortDefinitionEn { definition: r.definition, source: r.source })))
}

#[command]
pub async fn en_for_many__short_description__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, ShortDefinitionEn>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT Word, {} as definition, {} as source FROM en_Dict WHERE Word IN ({})",
        EN_SHORT_DESC_COALESCE,
        EN_SHORT_DESC_SOURCE,
        get_placeholders(words.len())
    );

    let rows: Vec<EnWordDetailShortRow> = fetch_many(&pool, &words, sql).await?;

    to_strict_map(
        words,
        rows,
        |r| r.word.clone(),
        |r| ShortDefinitionEn { definition: r.definition, source: r.source }
    )
}

#[command]
pub async fn en_for_many__full_details__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailEn>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!("SELECT * FROM en_Dict WHERE Word IN ({})", get_placeholders(words.len()));

    let rows: Vec<WordDetailEnRaw> = fetch_many(&pool, &words, sql).await?;

    to_strict_map(words, rows, |r| r.word.clone(), WordDetailEn::from)
}


#[command]
pub async fn en_for_many__full_details__none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailEn>>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!("SELECT * FROM en_Dict WHERE Word IN ({})", get_placeholders(words.len()));

    let rows: Vec<WordDetailEnRaw> = fetch_many(&pool, &words, sql).await?;

    Ok(to_optional_map_wrap(words, rows, |r| r.word.clone(), WordDetailEn::from))
}
