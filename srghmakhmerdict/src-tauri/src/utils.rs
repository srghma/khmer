use std::path::Path;
use tauri::Manager;

pub fn log_dir_tree(path: &Path, prefix: &str, depth: usize, max_depth: usize) {
    if depth > max_depth {
        return;
    }

    let entries = match std::fs::read_dir(path) {
        Ok(entries) => entries,
        Err(e) => {
            println!("{}├─ ❌ Error reading directory: {}", prefix, e);
            return;
        }
    };

    let mut entries: Vec<_> = entries.filter_map(Result::ok).collect();
    entries.sort_by_key(|e| e.path());

    let total = entries.len();

    for (idx, entry) in entries.iter().enumerate() {
        let path = entry.path();
        let is_last = idx == total - 1;
        let connector = if is_last { "└─" } else { "├─" };
        let extension = if is_last { "   " } else { "│  " };

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("<invalid>");

        if let Ok(metadata) = entry.metadata() {
            if metadata.is_dir() {
                println!("{}{} 📁 {}/", prefix, connector, name);
                log_dir_tree(
                    &path,
                    &format!("{}{}", prefix, extension),
                    depth + 1,
                    max_depth,
                );
            } else {
                let size = metadata.len();
                let size_str = if size > 1_000_000 {
                    format!("{:.2} MB", size as f64 / 1_000_000.0)
                } else if size > 1_000 {
                    format!("{:.2} KB", size as f64 / 1_000.0)
                } else {
                    format!("{} B", size)
                };
                println!("{}{} 📄 {} ({})", prefix, connector, name, size_str);
            }
        } else {
            println!("{}{} ❓ {}", prefix, connector, name);
        }
    }
}

pub fn investigate_paths(app: &mut tauri::App) {
    println!("\n{}", "=".repeat(60));
    println!("🔍 INVESTIGATING ANDROID ASSETS & PATHS");
    println!("{}\n", "=".repeat(60));

    let resolver = app.path();

    // 1. Check standard Tauri paths
    println!("📍 TAURI PATH RESOLVER:");
    if let Ok(resource_path) = resolver.resolve("dict.db.gz", tauri::path::BaseDirectory::Resource)
    {
        println!("  Resource (dict.db.gz): {:?}", resource_path);
    }
    if let Ok(app_data) = resolver.app_local_data_dir() {
        println!("  AppLocalData: {:?}", app_data);
    }
    println!();

    // 2. PROBE ASSET RESOLVER
    println!("📦 PROBING ASSET KEYS:");
    let potential_keys = vec![
        "dict.db.gz",
        "resources/dict.db.gz",
        "assets/dict.db.gz",
        "/dict.db.gz",
        "../dict.db.gz",
    ];

    let mut found = false;
    for key in potential_keys {
        match app.asset_resolver().get(key.to_string()) {
            Some(data) => {
                println!(
                    "  ✅ Found key: '{}' (Size: {} bytes)",
                    key,
                    data.bytes().len()
                );
                found = true;
            }
            None => println!("  ❌ Key failed: '{}'", key),
        }
    }

    if !found {
        println!("\n  ⚠️  CRITICAL: dict.db.gz not found in any standard path.");
    }
    println!();

    // 3. Explore actual filesystem
    #[cfg(target_os = "android")]
    {
        println!("🗂️  FILESYSTEM EXPLORATION:");
        let search_roots = vec!["/data/user/0/com.srghma.srghmakhmerdict"];

        for root in search_roots {
            let root_path = Path::new(root);
            if root_path.exists() {
                println!("\n📂 {}", root);
                log_dir_tree(root_path, "", 0, 3);
            } else {
                println!("\n❌ {} (doesn't exist)", root);
            }
        }
    }

    println!("\n{}", "=".repeat(60));
    println!("🏁 INVESTIGATION COMPLETE");
    println!("{}\n", "=".repeat(60));
}
