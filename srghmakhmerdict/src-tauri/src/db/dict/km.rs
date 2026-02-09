use crate::app_state::AppState;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{State, command};
use super::common::{WordRow, parse_json_opt, validate_words_not_empty, get_placeholders, to_strict_map, to_optional_map, to_optional_map_wrap, fetch_many};

#[derive(Serialize, sqlx::FromRow)]
pub struct KmWord {
    #[sqlx(rename = "Word")]
    pub word: String,
    pub is_verified: bool,
}

#[derive(Serialize, sqlx::FromRow, Debug)]
pub struct WordDetailKmRaw {
    #[sqlx(rename = "Word")]
    pub word: String,
    #[sqlx(rename = "Desc")]
    pub desc: Option<String>,
    #[sqlx(rename = "Phonetic")]
    pub phonetic: Option<String>,
    #[sqlx(rename = "Wiktionary")]
    pub wiktionary: Option<String>,
    #[sqlx(rename = "from_csv_variants")]
    pub from_csv_variants_raw: Option<String>,
    #[sqlx(rename = "from_csv_nounForms")]
    pub from_csv_noun_forms_raw: Option<String>,
    #[sqlx(rename = "from_csv_pronunciations")]
    pub from_csv_pronunciations_raw: Option<String>,
    #[sqlx(rename = "from_csv_rawHtml")]
    pub from_csv_raw_html: Option<String>,
    #[sqlx()]
    pub from_chuon_nath: Option<String>,
    #[sqlx()]
    pub from_chuon_nath_translated: Option<String>,
    #[sqlx()]
    pub from_russian_wiki: Option<String>,
    #[sqlx()]
    pub en_km_com: Option<String>,
}

#[derive(Serialize, Debug)]
pub struct WordDetailKm {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub desc: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phonetic: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wiktionary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_csv_variants: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_csv_noun_forms: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_csv_pronunciations: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_csv_raw_html: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_chuon_nath: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_chuon_nath_translated: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_russian_wiki: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub en_km_com: Option<String>,
}

impl From<WordDetailKmRaw> for WordDetailKm {
    fn from(raw: WordDetailKmRaw) -> Self {
        Self {
            desc: raw.desc,
            phonetic: raw.phonetic,
            wiktionary: raw.wiktionary,
            from_csv_variants: parse_json_opt(raw.from_csv_variants_raw),
            from_csv_noun_forms: parse_json_opt(raw.from_csv_noun_forms_raw),
            from_csv_pronunciations: parse_json_opt(raw.from_csv_pronunciations_raw),
            from_csv_raw_html: raw.from_csv_raw_html,
            from_chuon_nath: raw.from_chuon_nath,
            from_chuon_nath_translated: raw.from_chuon_nath_translated,
            from_russian_wiki: raw.from_russian_wiki,
            en_km_com: raw.en_km_com,
        }
    }
}

#[command]
pub async fn get_km_words(state: State<'_, AppState>) -> Result<Vec<KmWord>, String> {
    let pool = state.get_pool().await?;

    let sql = "SELECT
            Word,
            (
                Wiktionary IS NOT NULL
                OR from_csv_variants IS NOT NULL
                OR from_csv_nounForms IS NOT NULL
                OR from_csv_pronunciations IS NOT NULL
                OR from_csv_rawHtml IS NOT NULL
                OR from_chuon_nath IS NOT NULL
                OR from_chuon_nath_translated IS NOT NULL
                OR from_russian_wiki IS NOT NULL
                OR en_km_com IS NOT NULL
            ) AS is_verified
         FROM km_Dict
         ORDER BY Word ASC";

    let rows = sqlx::query_as::<_, KmWord>(&sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[command]
pub async fn get_word_detail_km(
    state: State<'_, AppState>,
    word: String,
) -> Result<Option<WordDetailKm>, String> {
    let pool = state.get_pool().await?;
    let sql = "SELECT * FROM km_Dict WHERE Word = ?";
    let row = sqlx::query_as::<_, WordDetailKmRaw>(&sql)
        .bind(word)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row.map(WordDetailKm::from))
}

#[command]
pub async fn search_km_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let pattern = format!("%{}%", query);
    let sql = "SELECT Word FROM km_Dict
         WHERE Desc LIKE ?
            OR Wiktionary LIKE ?
            OR from_chuon_nath LIKE ?
            OR from_russian_wiki LIKE ?
            OR from_csv_rawHtml LIKE ?
            OR en_km_com LIKE ?
         ORDER BY LENGTH(Word) ASC LIMIT 50";
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .bind(&pattern)
        .bind(&pattern)
        .bind(&pattern)
        .bind(&pattern)
        .bind(&pattern)
        .bind(&pattern)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[derive(Serialize, sqlx::FromRow)]
pub struct WordKmWordsDetailShortRow {
    #[sqlx(rename = "Word")]
    pub word: String,
    pub definition: Option<String>,
}

#[command]
pub async fn km_for_many__short_description__none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<String>>, String> { // for analyzer page
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT Word, COALESCE(from_csv_rawHtml, en_km_com, Desc, from_chuon_nath_translated, wiktionary, from_russian_wiki) as definition FROM km_Dict WHERE Word IN ({})",
        get_placeholders(words.len())
    );

    let rows: Vec<WordKmWordsDetailShortRow> = fetch_many(&pool, &words, sql).await?;

    Ok(to_optional_map(words, rows, |r| r.word.clone(), |r| r.definition))
}

#[command]
pub async fn km_for_many__short_description__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, String>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!(
        "SELECT Word, COALESCE(from_csv_rawHtml, en_km_com, Desc, from_chuon_nath_translated, wiktionary, from_russian_wiki) as definition FROM km_Dict WHERE Word IN ({})",
        get_placeholders(words.len())
    );

    let rows: Vec<WordKmWordsDetailShortRow> = fetch_many(&pool, &words, sql).await?;

    to_strict_map(
        words,
        rows,
        |r| r.word.clone(),
        |r| r.definition.expect("Definition must be present"),
    )
}

#[command]
pub async fn km_for_many__full_details__none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailKm>>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!("SELECT * FROM km_Dict WHERE Word IN ({})", get_placeholders(words.len()));

    let rows: Vec<WordDetailKmRaw> = fetch_many(&pool, &words, sql).await?;

    Ok(to_optional_map_wrap(words, rows, |r| r.word.clone(), WordDetailKm::from))
}

#[command]
pub async fn km_for_many__full_details__throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailKm>, String> {
    validate_words_not_empty(&words)?;

    let pool = state.get_pool().await?;
    let sql = format!("SELECT * FROM km_Dict WHERE Word IN ({})", get_placeholders(words.len()));

    let rows: Vec<WordDetailKmRaw> = fetch_many(&pool, &words, sql).await?;

    to_strict_map(words, rows, |r| r.word.clone(), WordDetailKm::from)
}