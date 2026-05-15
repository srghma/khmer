#[cfg(feature = "tauri-app")]
use crate::app_state::AppState;
#[cfg(feature = "tauri-app")]
use crate::db::dict::ru_impl::{
    WordDetailRu, ShortDefinitionRu,
    get_ru_words_impl, get_word_detail_ru_impl, search_ru_content_impl,
    ru_for_many_full_details_throws_if_word_not_found_impl,
    ru_for_many_full_details_none_if_word_not_found_impl,
    ru_for_many_short_description_none_if_word_not_found_impl,
    ru_for_many_short_description_throws_if_word_not_found_impl,
};
#[cfg(feature = "tauri-app")]
use std::collections::HashMap;
#[cfg(feature = "tauri-app")]
use tauri::{State, command};

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_ru_words(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    get_ru_words_impl(&state).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_word_detail_ru(
    state: State<'_, AppState>,
    word: String,
) -> Result<Option<WordDetailRu>, String> {
    get_word_detail_ru_impl(&state, word).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn search_ru_content(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<String>, String> {
    search_ru_content_impl(&state, query).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn ru_for_many_full_details_throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, WordDetailRu>, String> {
    ru_for_many_full_details_throws_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn ru_for_many_full_details_none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<WordDetailRu>>, String> {
    ru_for_many_full_details_none_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn ru_for_many_short_description_none_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, Option<ShortDefinitionRu>>, String> {
    ru_for_many_short_description_none_if_word_not_found_impl(&state, words).await
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn ru_for_many_short_description_throws_if_word_not_found(
    state: State<'_, AppState>,
    words: Vec<String>,
) -> Result<HashMap<String, ShortDefinitionRu>, String> {
    ru_for_many_short_description_throws_if_word_not_found_impl(&state, words).await
}
