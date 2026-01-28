use crate::AppState;
use serde::Serialize;
use tauri::{State, command};

const TBL_EN: &str = "en_Dict";
const TBL_KM: &str = "km_Dict";
const TBL_RU: &str = "ru_Dict";
const TBL_EN_EXT: &str = "en_Extension";

// --- Structs ---

#[derive(Serialize, sqlx::FromRow)]
pub struct WordRow {
    #[sqlx(rename = "Word")]
    word: String,
}

#[derive(Serialize, sqlx::FromRow, Debug)]
pub struct WordDetailKmRaw {
    #[sqlx(rename = "Word")]
    word: String,
    #[sqlx(rename = "Desc")]
    desc: Option<String>,
    #[sqlx(rename = "Phonetic")]
    phonetic: Option<String>,
    #[sqlx(rename = "Wiktionary")]
    wiktionary: Option<String>,
    #[sqlx(rename = "from_csv_variants")]
    from_csv_variants_raw: Option<String>,
    #[sqlx(rename = "from_csv_nounForms")]
    from_csv_noun_forms_raw: Option<String>,
    #[sqlx(rename = "from_csv_pronunciations")]
    from_csv_pronunciations_raw: Option<String>,
    #[sqlx(rename = "from_csv_rawHtml")]
    from_csv_raw_html: Option<String>,
    #[sqlx()]
    from_chuon_nath: Option<String>,
    #[sqlx()]
    from_chuon_nath_translated: Option<String>,
    #[sqlx()]
    from_russian_wiki: Option<String>,
    #[sqlx()]
    en_km_com: Option<String>,
}

#[derive(Serialize, Debug)]
pub struct WordDetailKm {
    word: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    desc: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    phonetic: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    wiktionary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    from_csv_variants: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    from_csv_noun_forms: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    from_csv_pronunciations: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    from_csv_raw_html: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    from_chuon_nath: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    from_chuon_nath_translated: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    from_russian_wiki: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    en_km_com: Option<String>,
}

impl From<WordDetailKmRaw> for WordDetailKm {
    fn from(raw: WordDetailKmRaw) -> Self {
        Self {
            word: raw.word,
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

#[derive(Serialize, sqlx::FromRow)]
pub struct WordDetailEn {
    #[sqlx(rename = "Word")]
    word: String,
    #[sqlx(rename = "WordDisplay")]
    #[serde(skip_serializing_if = "Option::is_none")]
    word_display: Option<String>,
    #[sqlx(rename = "Desc")]
    #[serde(skip_serializing_if = "Option::is_none")]
    desc: Option<String>,
    #[sqlx(rename = "Desc_en_only")]
    #[serde(skip_serializing_if = "Option::is_none")]
    desc_en_only: Option<String>,
    #[sqlx()]
    #[serde(skip_serializing_if = "Option::is_none")]
    en_km_com: Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct WordDetailRu {
    #[sqlx(rename = "Word")]
    word: String,
    #[sqlx(rename = "WordDisplay")]
    #[serde(skip_serializing_if = "Option::is_none")]
    word_display: Option<String>,
    #[sqlx(rename = "Desc")]
    desc: String,
}

fn parse_json_opt(raw: Option<String>) -> Option<Vec<String>> {
    raw.and_then(|s| serde_json::from_str(&s).ok())
}

// --- Commands ---

#[command]
pub async fn is_db_ready(state: State<'_, AppState>) -> Result<bool, String> {
    let guard = state.dict_pool.read().await;
    Ok(guard.is_some())
}

#[command]
pub async fn get_en_words(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let sql = format!("SELECT Word FROM {} ORDER BY Word ASC", TBL_EN);
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[command]
pub async fn get_ru_words(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let sql = format!("SELECT Word FROM {} ORDER BY Word ASC", TBL_RU);
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

// Updated Struct for the Km list
#[derive(Serialize, sqlx::FromRow)]
pub struct KmWord {
    #[sqlx(rename = "Word")]
    word: String,
    is_verified: bool,
}

#[command]
pub async fn get_km_words(state: State<'_, AppState>) -> Result<Vec<KmWord>, String> {
    let pool = state.get_pool().await?;

    let sql = format!(
        "SELECT
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
         FROM {}
         ORDER BY Word ASC",
        TBL_KM
    );

    // Directly fetch into KmWord structs
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
    let sql = format!("SELECT * FROM {} WHERE Word = ?", TBL_KM);
    let row = sqlx::query_as::<_, WordDetailKmRaw>(&sql)
        .bind(word)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row.map(WordDetailKm::from))
}

#[command]
pub async fn get_word_detail_en(
    state: State<'_, AppState>,
    word: String,
    use_extension_db: bool,
) -> Result<Option<WordDetailEn>, String> {
    let pool = state.get_pool().await?;
    let sql = if use_extension_db {
        format!(
            "SELECT DISTINCT d.* FROM {} d JOIN {} e ON d.Word = e.Extension WHERE e.Word = ?",
            TBL_EN, TBL_EN_EXT
        )
    } else {
        format!("SELECT * FROM {} WHERE Word = ?", TBL_EN)
    };
    let row = sqlx::query_as::<_, WordDetailEn>(&sql)
        .bind(word)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row)
}

#[command]
pub async fn get_word_detail_ru(
    state: State<'_, AppState>,
    word: String,
) -> Result<Option<WordDetailRu>, String> {
    let pool = state.get_pool().await?;
    let sql = format!("SELECT * FROM {} WHERE Word = ?", TBL_RU);
    let row = sqlx::query_as::<_, WordDetailRu>(&sql)
        .bind(word)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(row)
}

// --- Content Search ---

#[command]
pub async fn search_en_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let pattern = format!("%{}%", query);
    let sql = format!(
        "SELECT Word FROM {} WHERE Desc LIKE ? ORDER BY LENGTH(Word) ASC LIMIT 50",
        TBL_EN
    );
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .bind(pattern)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[command]
pub async fn search_ru_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let pattern = format!("%{}%", query);
    let sql = format!(
        "SELECT Word FROM {} WHERE Desc LIKE ? ORDER BY LENGTH(Word) ASC LIMIT 50",
        TBL_RU
    );
    let rows = sqlx::query_as::<_, WordRow>(&sql)
        .bind(pattern)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

#[command]
pub async fn search_km_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    let pool = state.get_pool().await?;
    let pattern = format!("%{}%", query);
    let sql = format!(
        "SELECT Word FROM {}
         WHERE Desc LIKE ?
            OR Wiktionary LIKE ?
            OR from_chuon_nath LIKE ?
            OR from_russian_wiki LIKE ?
            OR from_csv_rawHtml LIKE ?
            OR en_km_com LIKE ?
         ORDER BY LENGTH(Word) ASC LIMIT 50",
        TBL_KM
    );
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
