use flate2::read::GzDecoder;
use sqlx::SqlitePool;
use sqlx::sqlite::SqlitePoolOptions;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager}; // Added Emitter
use tauri_plugin_sql::{Migration, MigrationKind};
use tokio::sync::RwLock; // Added RwLock

mod db;

// 1. Change AppState to hold an optional, thread-safe pool
pub struct AppState {
    pub dict_pool: RwLock<Option<SqlitePool>>,
}

// Helper to access the pool easily in commands
impl AppState {
    pub async fn get_pool(&self) -> Result<SqlitePool, String> {
        let guard = self.dict_pool.read().await;
        match &*guard {
            Some(pool) => Ok(pool.clone()),
            None => Err("DB_NOT_READY".to_string()),
        }
    }
}

pub fn ensure_dict_db(app_handle: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_local_data = app_handle.path().app_local_data_dir()?;
    let dest_path = app_local_data.join("dict.db");

    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let should_extract = cfg!(debug_assertions) || !dest_path.exists();

    if should_extract {
        let mode = if cfg!(debug_assertions) {
            "DEV"
        } else {
            "PROD"
        };
        println!(
            "📦 {} MODE: Extracting embedded DB to {:?}",
            mode, dest_path
        );

        const DB_COMPRESSED: &[u8] = include_bytes!("../dict.db.gz");
        let mut decoder = GzDecoder::new(DB_COMPRESSED);
        let mut dest_file = fs::File::create(&dest_path)?;
        std::io::copy(&mut decoder, &mut dest_file)?;

        println!("✅ DB extraction complete");
    } else {
        println!("✅ PROD MODE: DB already exists");
    }

    Ok(dest_path)
}

// Refactored to be purely async and take an AppHandle
async fn init_db_process(app_handle: AppHandle) {
    println!("🔥 Starting DB Init Process...");

    // 1. Extract File
    let dest_path_res = ensure_dict_db(&app_handle);
    if let Err(e) = dest_path_res {
        eprintln!("🔥 FATAL: Failed to extract DB: {}", e);
        let _ = app_handle.emit("db-error", e.to_string());
        return;
    }
    let dest_path = dest_path_res.unwrap();

    // 2. Connect
    let db_url = format!("sqlite://{}", dest_path.display());
    let pool_res = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await;

    match pool_res {
        Ok(pool) => {
            println!("🔥 DB Connected successfully");

            // 3. Update State
            let state = app_handle.state::<AppState>();
            let mut guard = state.dict_pool.write().await;
            *guard = Some(pool);
            drop(guard); // Release lock explicitly

            // 4. Notify Frontend
            let _ = app_handle.emit("db-initialized", ());
        }
        Err(e) => {
            eprintln!("🔥 FATAL: Failed to connect to DB: {}", e);
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
                CREATE UNIQUE INDEX IF NOT EXISTS history_word_language_uq ON history(word, language);
                CREATE UNIQUE INDEX IF NOT EXISTS favorites_word_language_uq ON favorites(word, language);
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
            // 1. Initialize State with None immediately
            // This registers the AppState type so commands can access it later
            app.manage(AppState {
                dict_pool: RwLock::new(None),
            });

            // 2. Spawn the heavy lifting in the background
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                init_db_process(handle).await;
            });

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            // --- DELETED LEGACY CODE HERE ---
            // The call to 'setup_dictionary_db' was removed because
            // 'init_db_process' above now handles it.

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
