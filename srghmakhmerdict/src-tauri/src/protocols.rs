use std::fs;
use tauri::{
    AppHandle, Manager,
    http::{Request, Response, StatusCode},
};

pub fn handle_local_assets(
    app_handle: &AppHandle,
    request: Request<Vec<u8>>,
    scheme: &str,      // e.g., "imglocal"
    folder_name: &str, // e.g., constants::IMAGES_FOLDER_NAME
) -> Response<Vec<u8>> {
    println!("🔎 [{}] Request received: {}", scheme, request.uri());

    let uri_path = request.uri().path();

    // Clean the path. If URL is imglocal://localhost/1295.webp, path is /1295.webp
    let filename = uri_path.trim_start_matches('/');

    // Decode URL (handle spaces etc)
    let decoded_filename = match urlencoding::decode(filename) {
        Ok(s) => s.to_string(),
        Err(e) => {
            println!(
                "❌ [{}] Failed to decode filename '{}': {}",
                scheme, filename, e
            );
            filename.to_string()
        }
    };

    println!("📂 [{}] Looking for file: {}", scheme, decoded_filename);

    // Resolve directory
    let app_dir = match app_handle.path().app_local_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            println!("❌ [{}] Failed to get app_local_data_dir: {}", scheme, e);
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(vec![])
                .unwrap();
        }
    };

    let base_directory = app_dir.join(folder_name);
    let file_path = base_directory.join(&decoded_filename);

    println!("📍 [{}] Absolute path: {:?}", scheme, file_path);

    // Security check
    if !file_path.starts_with(&base_directory) {
        println!(
            "🚫 [{}] Security check failed. Path {:?} is not inside {:?}",
            scheme, file_path, base_directory
        );
        return Response::builder()
            .status(StatusCode::FORBIDDEN)
            .body(vec![])
            .unwrap();
    }

    // Read file
    match fs::read(&file_path) {
        Ok(data) => {
            println!("✅ [{}] File found! Size: {} bytes", scheme, data.len());
            let extension = file_path.extension().and_then(|e| e.to_str()).unwrap_or("");
            let mime = match extension {
                "webp" => "image/webp",
                "jpg" | "jpeg" => "image/jpeg",
                "png" => "image/png",
                "svg" => "image/svg+xml",
                _ => "application/octet-stream",
            };

            Response::builder()
                .header("Content-Type", mime)
                .header("Access-Control-Allow-Origin", "*")
                .body(data)
                .unwrap()
        }
        Err(e) => {
            println!("❌ [{}] File read error for {:?}: {}", scheme, file_path, e);
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body("Not Found".as_bytes().to_vec())
                .unwrap()
        }
    }
}
