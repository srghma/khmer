use crate::app_state::AppState;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
use tokio::sync::RwLock;

mod app_state;
mod constants;
mod db;
mod db_initialize;
mod image_manager;
mod protocols;
pub mod utils;

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
                    -- Primary Identifiers
                    word TEXT NOT NULL,
                    language TEXT NOT NULL,
                    timestamp INTEGER NOT NULL, -- When the favorite was added (creation date)

                    -- FSRS Core State
                    stability REAL NOT NULL DEFAULT 0,
                    difficulty REAL NOT NULL DEFAULT 0,

                    -- Scheduling Timestamps
                    last_review INTEGER, -- NULL if never reviewed (New card)
                    due INTEGER NOT NULL, -- For New cards, this usually equals 'timestamp' (due immediately)

                    -- Statistics (Metadata)
                    -- reps INTEGER NOT NULL DEFAULT 0,
                    -- lapses INTEGER NOT NULL DEFAULT 0,
                    -- state INTEGER NOT NULL DEFAULT 0, -- 0=New, 1=Learning, 2=Review, 3=Relearning

                    PRIMARY KEY (word, language)
                );
        ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // 1. REGISTER CUSTOM PROTOCOL with Debug Logging
        .register_uri_scheme_protocol("imglocal", move |ctx, request| {
            protocols::handle_local_assets(
                ctx.app_handle(),
                request,
                "imglocal",
                constants::IMAGES_FOLDER_NAME,
            )
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
            // db::anki::get_all_anki_cards,
            // db::anki::save_anki_cards,
            image_manager::check_offline_images_status,
            image_manager::download_offline_images
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
