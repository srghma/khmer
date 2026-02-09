use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize, sqlx::FromRow)]
pub struct WordRow {
    #[sqlx(rename = "Word")]
    pub word: String,
}

pub fn parse_json_opt(raw: Option<String>) -> Option<Vec<String>> {
    raw.and_then(|s| serde_json::from_str(&s).ok())
}

pub fn validate_words_not_empty(words: &[String]) -> Result<(), String> {
    if words.is_empty() {
        return Err("List of words should not be empty".to_string());
    }
    Ok(())
}

pub fn get_placeholders(count: usize) -> String {
    std::iter::repeat("?")
        .take(count)
        .collect::<Vec<_>>()
        .join(",")
}

pub fn to_strict_map<T, O>(
    requested_words: Vec<String>,
    rows: Vec<T>,
    get_word: impl Fn(&T) -> String,
    transform: impl Fn(T) -> O,
) -> Result<HashMap<String, O>, String> {
    let mut result = HashMap::with_capacity(requested_words.len());
    for row in rows {
        result.insert(get_word(&row), transform(row));
    }

    for word in requested_words {
        if !result.contains_key(&word) {
            return Err(format!("Word not found: {}", word));
        }
    }

    Ok(result)
}

pub fn to_optional_map<T, O>(
    requested_words: Vec<String>,
    rows: Vec<T>,
    get_word: impl Fn(&T) -> String,
    transform: impl Fn(T) -> Option<O>,
) -> HashMap<String, Option<O>> {
    let mut result = HashMap::with_capacity(requested_words.len());
    for row in rows {
        result.insert(get_word(&row), transform(row));
    }

    for word in requested_words {
        result.entry(word).or_insert(None);
    }

    result
}

// Helper to wrap non-option transformer for optional map
pub fn to_optional_map_wrap<T, O>(
    requested_words: Vec<String>,
    rows: Vec<T>,
    get_word: impl Fn(&T) -> String,
    transform: impl Fn(T) -> O,
) -> HashMap<String, Option<O>> {
    to_optional_map(requested_words, rows, get_word, |r| Some(transform(r)))
}

pub async fn fetch_many<T>(
    pool: &sqlx::SqlitePool,
    words: &[String],
    sql_template: String,
) -> Result<Vec<T>, String>
where
    for<'r> T: sqlx::FromRow<'r, sqlx::sqlite::SqliteRow> + Send + Unpin,
{
    let mut query = sqlx::query_as::<sqlx::Sqlite, T>(&sql_template);
    for word in words {
        query = query.bind(word);
    }
    query.fetch_all(pool).await.map_err(|e| e.to_string())
}
