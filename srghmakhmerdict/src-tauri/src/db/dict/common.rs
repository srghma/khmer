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

pub struct MapPopulation;

impl MapPopulation {
    pub fn to_strict_map<T, F>(
        requested_words: Vec<String>,
        rows: Vec<T>,
        get_word: impl Fn(&T) -> String,
        transform: F,
    ) -> Result<HashMap<String, T::Output>, String>
    where
        F: Fn(T) -> T::Output,
        T: RowWithWord,
    {
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

    pub fn to_optional_map<T, F, O>(
        requested_words: Vec<String>,
        rows: Vec<T>,
        get_word: impl Fn(&T) -> String,
        transform: F,
    ) -> HashMap<String, Option<O>>
    where
        F: Fn(T) -> O,
    {
        let mut result = HashMap::with_capacity(requested_words.len());
        for row in rows {
            result.insert(get_word(&row), Some(transform(row)));
        }

        for word in requested_words {
            result.entry(word).or_insert(None);
        }

        result
    }
}

pub trait RowWithWord {
    type Output;
}
