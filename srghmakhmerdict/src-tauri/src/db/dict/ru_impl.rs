pub use super::common::ShortDefinitionRu;
use super::common::{
    RuShortDefinitionSource, WordRow, fetch_many, get_placeholders,
    to_optional_map, to_optional_map_wrap, to_strict_map, validate_words_not_empty,
};
use crate::app_state::AppState;
use serde::Serialize;
use std::collections::HashMap;

pub const RU_SHORT_DESC_SOURCE: &str = "1";

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

pub async fn get_ru_words_impl(state: &AppState) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let sql = "SELECT Word FROM ru_Dict ORDER BY Word ASC";
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

pub async fn get_word_detail_ru_impl(
    state: &AppState,
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

pub async fn search_ru_content_impl(
    state: &AppState,
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

pub async fn ru_for_many_full_details_throws_if_word_not_found_impl(
    state: &AppState,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailRu>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT * FROM ru_Dict WHERE Word IN ({})",
        get_placeholders(words.len())
    );

    let rows: Vec<RuDetailRaw> = fetch_many(&pool, &words, sql).await?;

    to_strict_map(words, rows, |r| r.word.clone(), WordDetailRu::from)
}

pub async fn ru_for_many_full_details_none_if_word_not_found_impl(
    state: &AppState,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailRu>>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT * FROM ru_Dict WHERE Word IN ({})",
        get_placeholders(words.len())
    );

    let rows: Vec<RuDetailRaw> = fetch_many(&pool, &words, sql).await?;

    Ok(to_optional_map_wrap(
        words,
        rows,
        |r| r.word.clone(),
        WordDetailRu::from,
    ))
}

pub async fn ru_for_many_short_description_none_if_word_not_found_impl(
    state: &AppState,
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

    Ok(to_optional_map(
        words,
        rows,
        |r| r.word.clone(),
        |r| {
            Some(ShortDefinitionRu {
                definition: r.definition,
                source: r.source,
            })
        },
    ))
}

pub async fn ru_for_many_short_description_throws_if_word_not_found_impl(
    state: &AppState,
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

    to_strict_map(
        words,
        rows,
        |r| r.word.clone(),
        |r| ShortDefinitionRu {
            definition: r.definition,
            source: r.source,
        },
    )
}
