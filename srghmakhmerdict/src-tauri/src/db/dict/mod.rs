pub mod are_words_in_dict;
pub mod are_words_in_dict_impl;
pub mod common;
pub mod en;
pub mod en_impl;
pub mod is_word_in_dict;
pub mod is_word_in_dict_impl;
pub mod km;
pub mod km_impl;
pub mod ru;
pub mod ru_impl;

use crate::app_state::AppState;
#[cfg(feature = "tauri-app")]
use tauri::{State, command};

#[derive(serde::Serialize)]
pub struct DbStatus {
    pub is_ready: bool,
    pub error: Option<String>,
}

pub async fn get_db_status_impl(state: &AppState) -> Result<DbStatus, String> {
    let pool_guard = state.dict_pool.read().await;
    let error_guard = state.init_error.read().await;

    Ok(DbStatus {
        is_ready: pool_guard.is_some(),
        error: error_guard.clone(),
    })
}

#[cfg(feature = "tauri-app")]
#[command]
pub async fn get_db_status(state: State<'_, AppState>) -> Result<DbStatus, String> {
    get_db_status_impl(&state).await
}
