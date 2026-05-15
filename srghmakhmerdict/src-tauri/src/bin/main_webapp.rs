use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use serde_json::{json, Value};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use std::path::PathBuf;
use tokio::sync::RwLock;

use srghmakhmerdict_lib::app_state::AppState;

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        dict_pool: RwLock::new(None),
        init_error: RwLock::new(None),
    });

    // Path provided by the user
    let db_path = PathBuf::from("/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db");

    if !db_path.exists() {
         panic!("Database not found at {:?}", db_path);
    }

    srghmakhmerdict_lib::db_initialize_impl::init_db_standalone_impl(state.clone(), db_path).await;

    let app = Router::new()
        .route("/api/:command", post(handler))
        .route("/google_tts", axum::routing::get(google_tts_handler))
        .route("/native_tts", axum::routing::get(native_tts_audio_handler))
        .route("/update_pos", axum::routing::post(update_pos_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("🚀 JSON API Server (Standalone) running on http://localhost:3001");
    axum::serve(listener, app).await.unwrap();
}

async fn handler(
    State(state): State<Arc<AppState>>,
    Path(command): Path<String>,
    Json(payload): Json<Value>,
) -> impl IntoResponse {
    let res = match command.as_str() {
        "get_en_words" => json!(srghmakhmerdict_lib::db::dict::en_impl::get_en_words_impl(&state).await),
        "get_km_words" => json!(srghmakhmerdict_lib::db::dict::km_impl::get_km_words_impl(&state).await),
        "get_ru_words" => json!(srghmakhmerdict_lib::db::dict::ru_impl::get_ru_words_impl(&state).await),

        "get_word_detail_en" => {
            let word = payload["word"].as_str().unwrap_or_default().to_string();
            let use_ext = payload["useExtensionDb"].as_bool().unwrap_or_default();
            json!(srghmakhmerdict_lib::db::dict::en_impl::get_word_detail_en_impl(&state, word, use_ext).await)
        }
        "get_word_detail_km" => {
            let word = payload["word"].as_str().unwrap_or_default().to_string();
            json!(srghmakhmerdict_lib::db::dict::km_impl::get_word_detail_km_impl(&state, word).await)
        }
        "get_word_detail_ru" => {
            let word = payload["word"].as_str().unwrap_or_default().to_string();
            json!(srghmakhmerdict_lib::db::dict::ru_impl::get_word_detail_ru_impl(&state, word).await)
        }

        "search_en_content" => {
            let query = payload["query"].as_str().unwrap_or_default().to_string();
            json!(srghmakhmerdict_lib::db::dict::en_impl::search_en_content_impl(&state, query).await)
        }
        "search_km_content" => {
            let query = payload["query"].as_str().unwrap_or_default().to_string();
            json!(srghmakhmerdict_lib::db::dict::km_impl::search_km_content_impl(&state, query).await)
        }
        "search_ru_content" => {
            let query = payload["query"].as_str().unwrap_or_default().to_string();
            json!(srghmakhmerdict_lib::db::dict::ru_impl::search_ru_content_impl(&state, query).await)
        }

        "get_db_status" => json!(srghmakhmerdict_lib::db::dict::get_db_status_impl(&state).await),

        "is_word_in_dict" => {
            let word = payload["word"].as_str().unwrap_or_default().to_string();
            let lang = payload["language"].as_str().unwrap_or_default().to_string();
            json!(srghmakhmerdict_lib::db::dict::is_word_in_dict_impl::is_word_in_dict_impl(&state, word, lang).await)
        }

        "are_words_in_dict" => {
            let en = payload["en"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            let ru = payload["ru"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            let km = payload["km"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::are_words_in_dict_impl::are_words_in_dict_impl(&state, en, ru, km).await)
        }

        "en_for_many_short_description_none_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::en_impl::en_for_many_short_description_none_if_word_not_found_impl(&state, words).await)
        }
        "en_for_many_short_description_throws_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::en_impl::en_for_many_short_description_throws_if_word_not_found_impl(&state, words).await)
        }
        "en_for_many_full_details_none_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::en_impl::en_for_many_full_details_none_if_word_not_found_impl(&state, words).await)
        }
        "en_for_many_full_details_throws_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::en_impl::en_for_many_full_details_throws_if_word_not_found_impl(&state, words).await)
        }

        "km_for_many_short_description_none_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::km_impl::km_for_many_short_description_none_if_word_not_found_impl(&state, words).await)
        }
        "km_for_many_short_description_throws_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::km_impl::km_for_many_short_description_throws_if_word_not_found_impl(&state, words).await)
        }
        "km_for_many_full_details_none_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::km_impl::km_for_many_full_details_none_if_word_not_found_impl(&state, words).await)
        }
        "km_for_many_full_details_throws_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::km_impl::km_for_many_full_details_throws_if_word_not_found_impl(&state, words).await)
        }

        "ru_for_many_short_description_none_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::ru_impl::ru_for_many_short_description_none_if_word_not_found_impl(&state, words).await)
        }
        "ru_for_many_short_description_throws_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::ru_impl::ru_for_many_short_description_throws_if_word_not_found_impl(&state, words).await)
        }
        "ru_for_many_full_details_none_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::ru_impl::ru_for_many_full_details_none_if_word_not_found_impl(&state, words).await)
        }
        "ru_for_many_full_details_throws_if_word_not_found" => {
            let words = payload["words"].as_array().unwrap_or(&vec![]).iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect();
            json!(srghmakhmerdict_lib::db::dict::ru_impl::ru_for_many_full_details_throws_if_word_not_found_impl(&state, words).await)
        }

        _ => return (StatusCode::NOT_FOUND, Json(json!({"error": "Unknown command"}))).into_response(),
    };

    Json(res).into_response()
}

async fn google_tts_handler(
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let text = params.get("q").cloned().unwrap_or_default();
    let lang = params.get("tl").cloned().unwrap_or_default();

    if text.is_empty() || lang.is_empty() {
        return (StatusCode::BAD_REQUEST, "Missing text or lang").into_response();
    }

    println!("🔊 Proxying Google TTS: lang={}, text='{}'", lang, text);

    let url = format!(
        "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={}&q={}",
        urlencoding::encode(&lang),
        urlencoding::encode(&text)
    );

    println!("🔗 Fetching from Google: {}", url);

    let client = reqwest::Client::new();
    let res = match client
        .get(url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("Fetch error: {}", e)).into_response(),
    };

    if !res.status().is_success() {
        println!("❌ Google returned error: {}", res.status());
        return (StatusCode::from_u16(res.status().as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR), "Google returned error").into_response();
    }

    println!("✅ Google returned success: {} bytes", res.content_length().unwrap_or(0));

    let bytes = match res.bytes().await {
        Ok(bytes) => bytes,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("Bytes error: {}", e)).into_response(),
    };

    (
        [(axum::http::header::CONTENT_TYPE, "audio/mpeg")],
        bytes,
    ).into_response()
}

#[derive(serde::Deserialize)]
struct NativeTtsParams {
    q: String,
}

async fn native_tts_audio_handler(
    axum::extract::Query(params): axum::extract::Query<NativeTtsParams>,
) -> impl IntoResponse {
    let text = params.q;
    println!("🗣️  Native TTS request for: {}", text);

    let output = tokio::task::spawn_blocking(move || {
        let voices = ["km", "khmer", "en-us"];
        let mut last_error = String::new();

        for voice in voices {
            println!("   Trying voice: {}", voice);
            let output = std::process::Command::new("espeak-ng")
                .arg("-v")
                .arg(voice)
                .arg("-s")
                .arg("150")
                .arg(&text)
                .arg("--stdout")
                .output();

            match output {
                Ok(output) if output.status.success() => return Ok((voice, output.stdout)),
                Ok(output) => {
                    last_error = String::from_utf8_lossy(&output.stderr).to_string();
                }
                Err(e) => {
                    last_error = e.to_string();
                }
            }
        }
        Err(last_error)
    })
    .await;

    match output {
        Ok(Ok((voice, stdout))) => {
            println!("   ✅ Success using voice: {}", voice);
            (
                [(axum::http::header::CONTENT_TYPE, "audio/wav")],
                stdout,
            ).into_response()
        }
        Ok(Err(err)) => {
            eprintln!("❌ All espeak-ng voices failed. Last error: {}", err);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("TTS Error: {}", err)).into_response()
        }
        Err(e) => {
            eprintln!("❌ espeak-ng Task Panic: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
        }
    }
}

#[derive(serde::Deserialize)]
struct UpdatePosPayload {
    word: String,
    pos: String,
}

async fn update_pos_handler(
    Json(payload): Json<UpdatePosPayload>,
) -> impl IntoResponse {
    let data_path = PathBuf::from("/home/srghma/projects/khmer/srghmakhmerdict/public/data.json");

    println!("📝 Updating POS for word '{}' to '{}'", payload.word, payload.pos);

    let content = match tokio::fs::read_to_string(&data_path).await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("❌ Read error: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Read error: {}", e)).into_response()
        },
    };

    let mut data: Vec<Value> = match serde_json::from_str(&content) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("❌ Parse error: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Parse error: {}", e)).into_response()
        },
    };

    let mut found = false;
    for item in data.iter_mut() {
        if let Some(word) = item.get("word").and_then(|w| w.as_str()) {
            if word == payload.word {
                if let Some(obj) = item.as_object_mut() {
                    obj.insert("pos".to_string(), json!(payload.pos));
                    found = true;
                    break;
                }
            }
        }
    }

    if !found {
        println!("⚠️ Word '{}' not found in data.json", payload.word);
        return (StatusCode::NOT_FOUND, "Word not found").into_response();
    }

    let updated_content = match serde_json::to_string_pretty(&data) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("❌ Serialize error: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Serialize error: {}", e)).into_response()
        },
    };

    if let Err(e) = tokio::fs::write(&data_path, updated_content).await {
        eprintln!("❌ Write error: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Write error: {}", e)).into_response();
    }

    println!("✅ POS updated successfully");
    (StatusCode::OK, "Updated").into_response()
}
