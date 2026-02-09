pub mod common;
pub mod en;
pub mod km;
pub mod ru;

pub use common::*;


use crate::app_state::AppState;
use tauri::{State, command};

#[command]
pub async fn is_db_ready(state: State<'_, AppState>) -> Result<bool, String> {
    let guard = state.dict_pool.read().await;
    Ok(guard.is_some())
}
