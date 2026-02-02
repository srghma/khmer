use crate::constants;
use crate::utils;
use futures_util::StreamExt;
use std::fs;
use std::io::Write;
use std::path::Path;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_http::reqwest;

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    percentage: u8,
    label: String,
}

#[tauri::command]
pub async fn check_offline_images_status(app: &AppHandle) -> Result<Option<usize>, String> {
    println!("IMG: Checking offline images status...");
    let app_data = app.path().app_local_data_dir().map_err(|e| e.to_string())?;

    // We expect the folder "en_Dict_en_km_com_assets_images" to exist
    let img_path = app_data.join(constants::IMAGES_FOLDER_NAME);

    println!("IMG: Target Path: {:?}", img_path);
    println!("IMG: Exists? {}", img_path.exists());

    // Simple check: Does folder exist and is it not empty?
    if img_path.exists() {
        if let Ok(entries) = fs::read_dir(&img_path) {
            return Ok(Some(entries.count()));
        }
    }

    // // Debug: Let's see what is actually in the parent folder
    // println!("--- DIRECTORY CHECK (Parent) ---");
    // utils::log_dir_tree(&app_data, "", 0, 2);
    // println!("--------------------------------");

    Ok(None)
}

#[tauri::command]
pub async fn download_offline_images(app: &AppHandle) -> Result<Option<usize>, String> {
    let url = constants::IMAGES_DOWNLOAD_URL;
    println!("IMG: Starting download process from {}", url);

    let app_data = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let zip_path = app_data.join(constants::TEMP_ZIP_NAME);
    let final_images_dir = app_data.join(constants::IMAGES_FOLDER_NAME);

    // 1. Download
    let response = reqwest::get(url).await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    // FAIL if file is suspiciously small (e.g. < 1KB error page)
    if total_size > 0 && total_size < 1024 {
        return Err("Download too small (invalid file)".to_string());
    }

    let mut file = fs::File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut last_percent = 0;

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let percent = ((downloaded as f64 / total_size as f64) * 100.0) as u8;
            if percent > last_percent {
                last_percent = percent;
                let _ = app.emit(
                    "download-progress",
                    ProgressPayload {
                        percentage: percent,
                        label: format!("Downloading... {}%", percent),
                    },
                );
            }
        }
    }

    // Safety check on downloaded file
    let metadata = file.metadata().map_err(|e| e.to_string())?;
    if metadata.len() == 0 {
        return Err("Downloaded file is empty".to_string());
    }

    let _ = app.emit(
        "download-progress",
        ProgressPayload {
            percentage: 100,
            label: "Extracting...".to_string(),
        },
    );

    // 2. Unzip (FLATTEN STRATEGY)
    println!("IMG: Unzipping to {:?}", final_images_dir);

    // Ensure clean target directory
    if !final_images_dir.exists() {
        fs::create_dir_all(&final_images_dir).map_err(|e| e.to_string())?;
    }

    let file = fs::File::open(&zip_path).map_err(|e| e.to_string())?;
    let reader = std::io::BufReader::new(file);
    let mut archive = zip::ZipArchive::new(reader).map_err(|e| e.to_string())?;

    let archive_len = archive.len();
    if archive_len == 0 {
        return Err("Zip archive is empty".to_string());
    }

    let mut extracted_count = 0;

    for i in 0..archive_len {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;

        // Skip directories inside zip
        if (*file.name()).ends_with('/') {
            continue;
        }

        // We only care about the filename (e.g., "10000.webp"),
        // completely ignoring folders inside the zip like "src-tauri/" or "en_Dict.../"
        let file_name = match Path::new(file.name()).file_name() {
            Some(n) => n,
            None => continue,
        };

        // Destination: .../en_Dict_en_km_com_assets_images/10000.webp
        let outpath = final_images_dir.join(file_name);

        let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
        std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        extracted_count += 1;
    }

    // 3. Cleanup
    let _ = fs::remove_file(&zip_path);
    println!("IMG: Extracted {} files.", extracted_count);

    if extracted_count == 0 {
        return Err("No valid files found in zip".to_string());
    }

    utils::log_dir_tree(&final_images_dir, "", 0, 1);

    // Return the count
    Ok(Some(extracted_count))
}
