use crate::app_state::AppState;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::Row;
use std::path::PathBuf;
use std::sync::Arc;

/// Helper to check the version inside the existing extracted DB
pub async fn get_existing_db_version_impl(db_path: &PathBuf) -> Option<String> {
    if !db_path.exists() {
        return None;
    }

    let db_url = format!("sqlite://{}", db_path.display());

    // Try to connect. If DB is corrupt or locked, treat as None (triggers re-extraction)
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url)
        .await
        .ok()?;

    let row = sqlx::query("SELECT value FROM metadata WHERE key = 'version'")
        .fetch_optional(&pool)
        .await
        .ok()
        .flatten();

    pool.close().await; // Explicitly close

    row.map(|r| r.get::<String, _>("value"))
}

pub async fn init_db_standalone_impl(state: Arc<AppState>, db_path: PathBuf) {
    let db_url = format!("sqlite://{}", db_path.display());
    println!("🔥 Connecting to Main DB at: {}", db_url);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to DB");

    let mut guard = state.dict_pool.write().await;
    *guard = Some(pool);
    println!("✅ Dictionary DB Connected");
}
