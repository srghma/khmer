#[cfg(feature = "tauri-app")]
use crate::app_state::AppState;
#[cfg(feature = "tauri-app")]
use crate::db::dict::is_word_in_dict_impl::is_word_in_dict_impl;
#[cfg(feature = "tauri-app")]
use tauri::{State, command};

#[cfg(feature = "tauri-app")]
#[command]
pub async fn is_word_in_dict(
    state: State<'_, AppState>,
    word: String,
    language: String,
) -> Result<bool, String> {
    is_word_in_dict_impl(&state, word, language).await
}
