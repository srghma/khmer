#[cfg(feature = "tauri-app")]
use crate::app_state::AppState;
#[cfg(feature = "tauri-app")]
use crate::db::dict::km_impl::{
    KmWord, WordDetailKm, ShortDefinitionKm,
    get_km_words_impl, get_word_detail_km_impl, search_km_content_impl,
    km_for_many_short_description_none_if_word_not_found_impl,
    km_for_many_short_description_throws_if_word_not_found_impl,
    km_for_many_full_details_none_if_word_not_found_impl,
    km_for_many_full_details_throws_if_word_not_found_impl,
};
#[cfg(feature = "tauri-app")]
use std::collections::HashMap;
#[cfg(feature = "tauri-app")]
use tauri::{State, command};

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_km_words(state: State<'_, AppState>) -> Result<Vec<KmWord>, String> {
    get_km_words_impl(&state).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_word_detail_km(
    state: State<'_, AppState>,
    word: String,
) -> Result<Option<WordDetailKm>, String> {
    get_word_detail_km_impl(&state, word).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn search_km_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    search_km_content_impl(&state, query).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn km_for_many_short_description_none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<ShortDefinitionKm>>, String> {
    km_for_many_short_description_none_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn km_for_many_short_description_throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, ShortDefinitionKm>, String> {
    km_for_many_short_description_throws_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn km_for_many_full_details_none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailKm>>, String> {
    km_for_many_full_details_none_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn km_for_many_full_details_throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailKm>, String> {
    km_for_many_full_details_throws_if_word_not_found_impl(&state, words).await
}
