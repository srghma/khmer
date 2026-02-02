use flate2::read::GzDecoder;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{Row, SqlitePool};
use std::fs;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::http::{Response, StatusCode};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_fs::FsExt;
use tauri_plugin_sql::{Migration, MigrationKind};
use tokio::sync::RwLock;

mod constants;
mod db;
mod db_initialize;
mod image_manager;
pub mod utils;

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
                CREATE TABLE IF NOT EXISTS anki (
                    word TEXT PRIMARY KEY,
                    due INTEGER NOT NULL,
                    stability REAL NOT NULL,
                    difficulty REAL NOT NULL,
                    elapsed_days INTEGER NOT NULL,
                    scheduled_days INTEGER NOT NULL,
                    reps INTEGER NOT NULL,
                    lapses INTEGER NOT NULL,
                    state INTEGER NOT NULL,
                    last_review INTEGER
                );
        ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // 1. REGISTER CUSTOM PROTOCOL with Debug Logging
        .register_uri_scheme_protocol("imglocal", move |ctx, request| {
            println!("🔎 [imglocal] Request received: {}", request.uri());

            let app_handle = ctx.app_handle();
            let uri_path = request.uri().path();

            // Clean the path. If URL is imglocal://localhost/1295.webp, path is /1295.webp
            let filename = uri_path.trim_start_matches('/');

            // Decode URL (handle spaces etc)
            let decoded_filename = match urlencoding::decode(filename) {
                Ok(s) => s.to_string(),
                Err(e) => {
                    println!(
                        "❌ [imglocal] Failed to decode filename '{}': {}",
                        filename, e
                    );
                    filename.to_string()
                }
            };

            println!("📂 [imglocal] Looking for file: {}", decoded_filename);

            // Resolve directory
            let app_dir = match app_handle.path().app_local_data_dir() {
                Ok(dir) => dir,
                Err(e) => {
                    println!("❌ [imglocal] Failed to get app_local_data_dir: {}", e);
                    return Response::builder()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(vec![])
                        .unwrap();
                }
            };

            let image_path = app_dir
                .join(constants::IMAGES_FOLDER_NAME)
                .join(&decoded_filename);

            println!("📍 [imglocal] Absolute path: {:?}", image_path);

            // Security check
            let expected_prefix = app_dir.join(constants::IMAGES_FOLDER_NAME);
            if !image_path.starts_with(&expected_prefix) {
                println!(
                    "🚫 [imglocal] Security check failed. Path {:?} is not inside {:?}",
                    image_path, expected_prefix
                );
                return Response::builder()
                    .status(StatusCode::FORBIDDEN)
                    .body(vec![])
                    .unwrap();
            }

            // Read file
            match std::fs::read(&image_path) {
                Ok(data) => {
                    println!("✅ [imglocal] File found! Size: {} bytes", data.len());
                    let mime = if image_path.extension().map_or(false, |e| e == "webp") {
                        "image/webp"
                    } else {
                        "application/octet-stream"
                    };

                    Response::builder()
                        .header("Content-Type", mime)
                        .header("Access-Control-Allow-Origin", "*")
                        .body(data)
                        .unwrap()
                }
                Err(e) => {
                    println!("❌ [imglocal] File read error for {:?}: {}", image_path, e);
                    Response::builder()
                        .status(StatusCode::NOT_FOUND)
                        .body("Not Found".as_bytes().to_vec())
                        .unwrap()
                }
            }
        })
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
                db_initialize::init_db_process(handle).await;
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
            db::dict::is_db_ready,
            db::dict::get_en_km_com_images_ocr,
            db::dict::get_km_words_detail_short,
            db::dict::get_km_words_detail_full,
            db::anki::get_all_anki_cards,
            db::anki::save_anki_cards,
            image_manager::check_offline_images_status,
            image_manager::download_offline_images
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
