#[cfg(feature = "tauri-app")]
use crate::app_state::AppState;
#[cfg(feature = "tauri-app")]
use crate::db::dict::are_words_in_dict_impl::{AreWordsInDictResponse, are_words_in_dict_impl};
#[cfg(feature = "tauri-app")]
use tauri::{State, command};

#[cfg(feature = "tauri-app")]
#[command]
pub async fn are_words_in_dict(
    state: State<'_, AppState>,
    en: Vec<String>,
    ru: Vec<String>,
    km: Vec<String>,
) -> Result<AreWordsInDictResponse, String> {
    are_words_in_dict_impl(&state, en, ru, km).await
}
