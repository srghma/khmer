use super::common;
use crate::app_state::AppState;

#[derive(serde::Serialize)]
pub struct InAndNotInDb {
    pub in_db: Vec<String>,
    pub not_in_db: Vec<String>,
}

#[derive(serde::Serialize)]
pub struct AreWordsInDictResponse {
    pub en: InAndNotInDb,
    pub ru: InAndNotInDb,
    pub km: InAndNotInDb,
}

pub async fn are_words_in_dict_impl(
    state: &AppState,
    en: Vec<String>,
    ru: Vec<String>,
    km: Vec<String>,
) -> Result<AreWordsInDictResponse, String> {
    let pool = state.get_pool().await?;

    let en_result = check_words(&pool, "en_Dict", en).await?;
    let ru_result = check_words(&pool, "ru_Dict", ru).await?;
    let km_result = check_words(&pool, "km_Dict", km).await?;

    Ok(AreWordsInDictResponse {
        en: en_result,
        ru: ru_result,
        km: km_result,
    })
}

async fn check_words(
    pool: &sqlx::SqlitePool,
    table: &str,
    words: Vec<String>,
) -> Result<InAndNotInDb, String> {
    if words.is_empty() {
        return Ok(InAndNotInDb {
            in_db: vec![],
            not_in_db: vec![],
        });
    }

    let placeholders = common::get_placeholders(words.len());
    let sql = format!(
        "SELECT Word FROM {} WHERE Word IN ({})",
        table, placeholders
    );

    let mut query = sqlx::query_as::<sqlx::Sqlite, common::WordRow>(&sql);
    for word in &words {
        query = query.bind(word);
    }

    let rows = query.fetch_all(pool).await.map_err(|e| e.to_string())?;
    let in_db_set: std::collections::HashSet<String> = rows.into_iter().map(|r| r.word).collect();

    let mut in_db = vec![];
    let mut not_in_db = vec![];

    for word in words {
        if in_db_set.contains(&word) {
            in_db.push(word);
        } else {
            not_in_db.push(word);
        }
    }

    Ok(InAndNotInDb { in_db, not_in_db })
}
