use crate::app_state::AppState;

pub async fn is_word_in_dict_impl(
    state: &AppState,
    word: String,
    language: String,
) -> Result<bool, String> {
    let pool = state.get_pool().await?;
    let table = match language.as_str() {
        "km" => "km_Dict",
        "en" => "en_Dict",
        "ru" => "ru_Dict",
        _ => return Err(format!("Unknown language: {}", language)),
    };

    let sql = format!("SELECT 1 FROM {} WHERE Word = ? LIMIT 1", table);
    let row = sqlx::query(&sql)
        .bind(word)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row.is_some())
}
