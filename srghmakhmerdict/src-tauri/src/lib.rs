use flate2::read::GzDecoder;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{Row, SqlitePool};
use std::fs;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_fs::FsExt;
use tauri_plugin_sql::{Migration, MigrationKind};
use tokio::sync::RwLock;

mod db;

pub struct AppState {
    pub dict_pool: RwLock<Option<SqlitePool>>,
}

impl AppState {
    pub async fn get_pool(&self) -> Result<SqlitePool, String> {
        let guard = self.dict_pool.read().await;
        match &*guard {
            Some(pool) => Ok(pool.clone()),
            None => Err("DB_NOT_READY".to_string()),
        }
    }
}

/// Helper to check the version inside the existing extracted DB
async fn get_existing_db_version(db_path: &PathBuf) -> Option<String> {
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

// Return Result<PathBuf, String> to ensure the Future is Send (Box<dyn Error> is !Send)
pub async fn ensure_dict_db(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_local_data = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;

    let dest_path = app_local_data.join("dict.db");

    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    // 1. Get Target Version (from tauri.conf.json)
    let target_version = app_handle.package_info().version.to_string();

    // 2. Get Existing Version (from DB metadata)
    let existing_version = get_existing_db_version(&dest_path).await;

    let is_dev = cfg!(debug_assertions);
    let db_missing = existing_version.is_none();
    let version_mismatch = existing_version.as_deref() != Some(&target_version);

    if is_dev || db_missing || version_mismatch {
        println!("📦 DB Setup Required.");
        println!(
            "   Reason -> Dev: {}, Missing: {}, VersionMismatch: {} (Target: {}, Found: {:?})",
            is_dev, db_missing, version_mismatch, target_version, existing_version
        );

        if dest_path.exists() {
            let _ = fs::remove_file(&dest_path);
        }

        println!("📦 Extracting DB from assets...");

        // Resolve asset path
        let resource_path = app_handle
            .path()
            .resolve("dict.dbgz", BaseDirectory::Resource)
            .map_err(|e| format!("Failed to resolve resource: {}", e))?;

        // Read into RAM
        let compressed_bytes = app_handle
            .fs()
            .read(&resource_path)
            .map_err(|e| format!("Failed to read asset bytes: {}", e))?;

        // Decompress
        let cursor = Cursor::new(compressed_bytes);
        let mut decoder = GzDecoder::new(cursor);
        let mut dest_file = fs::File::create(&dest_path).map_err(|e| e.to_string())?;

        std::io::copy(&mut decoder, &mut dest_file).map_err(|e| e.to_string())?;

        println!("✅ DB Extracted successfully to: {:?}", dest_path);
    } else {
        println!(
            "✅ DB is up to date (v{}). Skipping extraction.",
            target_version
        );
    }

    Ok(dest_path)
}

async fn init_db_process(app_handle: AppHandle) {
    let dest_path_res = ensure_dict_db(&app_handle).await;

    match dest_path_res {
        Ok(path) => {
            let db_url = format!("sqlite://{}", path.display());
            println!("🔥 Connecting to Main DB at: {}", db_url);

            let pool_res = SqlitePoolOptions::new()
                .max_connections(5)
                .connect(&db_url)
                .await;

            match pool_res {
                Ok(pool) => {
                    let state = app_handle.state::<AppState>();
                    let mut guard = state.dict_pool.write().await;
                    *guard = Some(pool);
                    println!("✅ Dictionary DB Connected");
                    let _ = app_handle.emit("db-initialized", ());
                }
                Err(e) => {
                    eprintln!("❌ DB Connection Error: {}", e);
                    let _ = app_handle.emit("db-error", e.to_string());
                }
            }
        }
        Err(e) => {
            eprintln!("❌ DB Extraction Error: {}", e);
            let _ = app_handle.emit("db-error", e.to_string());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: "
                CREATE TABLE IF NOT EXISTS history (
                    word TEXT NOT NULL,
                    language TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    PRIMARY KEY (word, language)
                );
                CREATE TABLE IF NOT EXISTS favorites (
                    word TEXT NOT NULL,
                    language TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    PRIMARY KEY (word, language)
                );
        ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_tts::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:user_data.db", migrations)
                .build(),
        )
        .setup(|app| {
            app.manage(AppState {
                dict_pool: RwLock::new(None),
            });

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                init_db_process(handle).await;
            });

            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::dict::get_en_words,
            db::dict::get_km_words,
            db::dict::get_ru_words,
            db::dict::get_word_detail_km,
            db::dict::get_word_detail_en,
            db::dict::get_word_detail_ru,
            db::dict::search_en_content,
            db::dict::search_km_content,
            db::dict::search_ru_content,
            db::dict::is_db_ready
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
