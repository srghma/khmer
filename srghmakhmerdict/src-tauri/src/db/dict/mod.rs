pub mod common;
pub mod en;
pub mod km;
pub mod ru;


use crate::app_state::AppState;
use tauri::{State, command};

#[derive(serde::Serialize)]
pub struct DbStatus {
    pub is_ready: bool,
    pub error: Option<String>,
}

#[command]
pub async fn get_db_status(state: State<'_, AppState>) -> Result<DbStatus, String> {
    let pool_guard = state.dict_pool.read().await;
    let error_guard = state.init_error.read().await;

    Ok(DbStatus {
        is_ready: pool_guard.is_some(),
        error: error_guard.clone(),
    })
}
