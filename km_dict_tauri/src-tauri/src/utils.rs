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

// Usage in your setup function:
pub fn investigate_paths(app: &mut tauri::App) {
    println!("\n{}", "=".repeat(60));
    println!("🔍 INVESTIGATING ANDROID FILESYSTEM");
    println!("{}\n", "=".repeat(60));

    let resolver = app.path();

    // 1. Check standard Tauri paths
    println!("📍 TAURI PATH RESOLVER:");
    if let Ok(resource_path) =
        resolver.resolve("mydb/dict.db", tauri::path::BaseDirectory::Resource)
    {
        println!("  Resource: {:?}", resource_path);
    }
    if let Ok(app_data) = resolver.app_data_dir() {
        println!("  AppData: {:?}", app_data);
    }
    if let Ok(cache) = resolver.cache_dir() {
        println!("  Cache: {:?}", cache);
    }
    println!();

    // 2. Try asset resolver
    println!("📦 ASSET RESOLVER:");
    match app.asset_resolver().get("mydb/dict.db".to_string()) {
        Some(data) => println!("  ✅ Found! Size: {} bytes", data.bytes().len()),
        None => println!("  ❌ Not found in assets"),
    }
    println!();

    // 3. List all available assets
    println!("📋 ALL ASSETS IN BUNDLE:");
    for asset_path in ["mydb/dict.db", "mydb", "dict.db", "resources/mydb/dict.db"].iter() {
        match app.asset_resolver().get(asset_path.to_string()) {
            Some(data) => println!("  ✅ '{}' → {} bytes", asset_path, data.bytes().len()),
            None => println!("  ❌ '{}'", asset_path),
        }
    }
    println!();

    // 4. Explore actual filesystem
    #[cfg(target_os = "android")]
    {
        println!("🗂️  FILESYSTEM EXPLORATION:");

        let search_roots = vec![
            "/data/data/com.srghma.km_dict_tauri",
            "/data/data/com.srghma.km-dict-tauri",
            "/data/user/0/com.srghma.km_dict_tauri",
            "/data/user/0/com.srghma.km-dict-tauri",
            "/storage/emulated/0/Android/data/com.srghma.km_dict_tauri",
            "/storage/emulated/0/Android/data/com.srghma.km-dict-tauri",
        ];

        for root in search_roots {
            let root_path = Path::new(root);
            if root_path.exists() {
                println!("\n📂 {}", root);
                log_dir_tree(root_path, "", 0, 7);
            } else {
                println!("\n❌ {} (doesn't exist)", root);
            }
        }
    }

    println!("\n{}", "=".repeat(60));
    println!("🏁 INVESTIGATION COMPLETE");
    println!("{}\n", "=".repeat(60));
}
