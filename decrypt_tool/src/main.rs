use aes::cipher::{BlockDecrypt, KeyInit, Block};
use aes::Aes256;
use anyhow::{Context, Result};
use base64::{engine::general_purpose, Engine as _};
use indicatif::{ProgressBar, ProgressStyle}; // <--- Import
use rusqlite::{params, Connection};
use std::time::Duration;

// --- CONFIGURATION ---
const DB_PATH: &str = "/home/srghma/Downloads/km_en.db";
const TABLE_NAME: &str = "tbl_Dict";
const KEY_HEX: &str = "a33d776b0aa30d060e3727fc5c94b9f4a8576ca1e5075687ccbf2f51ffbdffdc";
const BATCH_SIZE: usize = 5000;

fn main() -> Result<()> {
    println!("Opening database: {}", DB_PATH);
    let mut conn = Connection::open(DB_PATH)?;

    conn.busy_timeout(Duration::from_secs(5))?;
    let _ = conn.execute("PRAGMA journal_mode=WAL;", []);

    let _ = conn.execute(
        &format!("ALTER TABLE {} ADD COLUMN Desc_decoded TEXT", TABLE_NAME),
        [],
    );

    let key_bytes = hex::decode(KEY_HEX).context("Invalid Hex Key")?;
    let cipher = Aes256::new_from_slice(&key_bytes).map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Reading rows into memory...");
    let rows: Vec<(i64, String)> = {
        let mut stmt = conn.prepare(&format!("SELECT rowid, Desc FROM {}", TABLE_NAME))?;
        stmt.query_map([], |row| {
            let id: i64 = row.get(0)?;
            let desc: String = row.get(1).unwrap_or_default();
            Ok((id, desc))
        })?
        .filter_map(Result::ok)
        .collect()
    };

    let total_rows = rows.len();
    println!("Starting decryption of {} rows...", total_rows);

    // --- PROGRESS BAR SETUP ---
    let pb = ProgressBar::new(total_rows as u64);
    pb.set_style(ProgressStyle::default_bar()
        .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} ({eta})")
        .unwrap()
        .progress_chars("#>-"));

    let mut updated_total = 0;

    for chunk in rows.chunks(BATCH_SIZE) {
        let mut tx = conn.transaction()?;

        {
            let mut update_stmt = tx.prepare(&format!(
                "UPDATE {} SET Desc_decoded = ? WHERE rowid = ?",
                TABLE_NAME
            ))?;

            for (id, desc_b64) in chunk {
                // Increment progress bar regardless of success/skip
                pb.inc(1);

                if desc_b64.trim().is_empty() { continue; }

                // 1. Clean & Decode
                let clean_b64: String = desc_b64.chars().filter(|c| !c.is_whitespace()).collect();
                let mut data = match general_purpose::STANDARD.decode(&clean_b64) {
                    Ok(d) => d,
                    Err(_) => continue,
                };

                if data.len() == 0 || data.len() % 16 != 0 { continue; }

                // 2. Decrypt
                for block_chunk in data.chunks_mut(16) {
                    let block = Block::<Aes256>::from_mut_slice(block_chunk);
                    cipher.decrypt_block(block);
                }

                // 3. Strip Padding
                let len = data.len();
                let last_byte = data[len - 1] as usize;
                let mut padding_valid = false;
                if last_byte > 0 && last_byte <= 16 && last_byte <= len {
                    padding_valid = true;
                    for k in 0..last_byte {
                        if data[len - 1 - k] != last_byte as u8 {
                            padding_valid = false;
                            break;
                        }
                    }
                }

                let actual_len = if padding_valid { len - last_byte } else { len };
                let result = String::from_utf8_lossy(&data[..actual_len]).to_string();

                // 4. Update
                update_stmt.execute(params![result, id])?;
                updated_total += 1;
            }
        }

        tx.commit()?;
    }

    pb.finish_with_message("Done!");

    println!("\n✅ Process Complete.");
    println!("Successfully Decrypted & Updated: {} rows", updated_total);

    Ok(())
}
