#[cfg(feature = "tauri-app")]
use crate::app_state::AppState;
#[cfg(feature = "tauri-app")]
use crate::db::dict::en_impl::{
    WordDetailEn, ShortDefinitionEn,
    get_en_words_impl, get_word_detail_en_impl, search_en_content_impl,
    get_en_km_com_images_ocr_impl, en_for_many_short_description_none_if_word_not_found_impl,
    en_for_many_short_description_throws_if_word_not_found_impl,
    en_for_many_full_details_throws_if_word_not_found_impl,
    en_for_many_full_details_none_if_word_not_found_impl,
};
#[cfg(feature = "tauri-app")]
use std::collections::HashMap;
#[cfg(feature = "tauri-app")]
use tauri::{State, command};

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_en_words(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    get_en_words_impl(&state).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_word_detail_en(
    state: State<'_, AppState>,
    word: String,
    use_extension_db: bool,
) -> Result<Option<WordDetailEn>, String> {
    get_word_detail_en_impl(&state, word, use_extension_db).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn search_en_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    search_en_content_impl(&state, query).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_en_km_com_images_ocr(
    state: State<'_, AppState>,
    ids: Vec<i64>,
) -> Result<HashMap<i64, String>, String> {
    get_en_km_com_images_ocr_impl(&state, ids).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn en_for_many_short_description_none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<ShortDefinitionEn>>, String> {
    en_for_many_short_description_none_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn en_for_many_short_description_throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, ShortDefinitionEn>, String> {
    en_for_many_short_description_throws_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn en_for_many_full_details_throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailEn>, String> {
    en_for_many_full_details_throws_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn en_for_many_full_details_none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailEn>>, String> {
    en_for_many_full_details_none_if_word_not_found_impl(&state, words).await
}
