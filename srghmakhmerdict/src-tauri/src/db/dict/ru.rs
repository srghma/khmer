use crate::app_state::AppState;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{State, command};
use super::common::{WordRow, ShortDefinitionRu, RuShortDefinitionSource, validate_words_not_empty, get_placeholders, to_strict_map, to_optional_map, to_optional_map_wrap, fetch_many};

const RU_SHORT_DESC_SOURCE: &str = "1";

#[derive(Serialize, sqlx::FromRow)]
pub struct WordDetailRu {
    #[sqlx(rename = "WordDisplay")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub word_display: Option<String>,
    #[sqlx(rename = "Desc")]
    pub desc: String,
}

#[derive(sqlx::FromRow)]
pub struct RuDetailRaw {
    #[sqlx(rename = "Word")]
    pub word: String,
    #[sqlx(rename = "WordDisplay")]
    pub word_display: Option<String>,
    #[sqlx(rename = "Desc")]
    pub desc: String,
}

impl From<RuDetailRaw> for WordDetailRu {
    fn from(raw: RuDetailRaw) -> Self {
        Self {
            word_display: raw.word_display,
            desc: raw.desc,
        }
    }
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
    pub definition: String,
    pub source: RuShortDefinitionSource,
}

#[command]
pub async fn ru_for_many__full_details__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailRu>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!("SELECT * FROM ru_Dict WHERE Word IN ({})", get_placeholders(words.len()));

    let rows: Vec<RuDetailRaw> = fetch_many(&pool, &words, sql).await?;

    to_strict_map(words, rows, |r| r.word.clone(), WordDetailRu::from)
}

#[command]
pub async fn ru_for_many__full_details__none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailRu>>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!("SELECT * FROM ru_Dict WHERE Word IN ({})", get_placeholders(words.len()));

    let rows: Vec<RuDetailRaw> = fetch_many(&pool, &words, sql).await?;

    Ok(to_optional_map_wrap(words, rows, |r| r.word.clone(), WordDetailRu::from))
}

#[command]
pub async fn ru_for_many__short_description__none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<ShortDefinitionRu>>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT Word, Desc as definition, {} as source FROM ru_Dict WHERE Word IN ({})",
        RU_SHORT_DESC_SOURCE,
        get_placeholders(words.len())
    );

    let rows: Vec<RuWordDetailShortRow> = fetch_many(&pool, &words, sql).await?;

    Ok(to_optional_map(words, rows, |r| r.word.clone(), |r| Some(ShortDefinitionRu { definition: r.definition, source: r.source })))
}

#[command]
pub async fn ru_for_many__short_description__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, ShortDefinitionRu>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT Word, Desc as definition, {} as source FROM ru_Dict WHERE Word IN ({})",
        RU_SHORT_DESC_SOURCE,
        get_placeholders(words.len())
    );

    let rows: Vec<RuWordDetailShortRow> = fetch_many(&pool, &words, sql).await?;

    to_strict_map(words, rows, |r| r.word.clone(), |r| ShortDefinitionRu { definition: r.definition, source: r.source })
}
