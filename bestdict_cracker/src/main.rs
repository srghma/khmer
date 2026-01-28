use aes::cipher::{BlockDecrypt, KeyInit};
use aes::{Aes128, Aes256};
use anyhow::Result;
use base64::{engine::general_purpose, Engine as _};
use memmap2::MmapOptions;
use pbkdf2::pbkdf2;
use rayon::prelude::*;
use std::fs::File;
use std::path::Path;
use std::str;

// --- CONFIGURATION ---

// The encrypted Base64 string from your DB
const ENCRYPTED_B64: &str = "a64NqFqDSxvTLP5CFFfpzlQ7T4cvjNs8TH4kU0upQqf459FT1Qa0fAn6tAAGArmhsEEXtvBrvkvjWbM1IC7YldR/0zGCeCrMKTZJ5T8/RMmU6ZgECeJP5nzknX/ORN8QBF/SrTQN6oKTOthpTRF6FvqVvJ6rrX5zHyr13Z83rHJHRQ+YMzwl4K9NSyBcD8QqCL+vetbLkIcWlW3DYWnwtgbFfnS+iwR9zhOoWUuCnWjZzzbpQhPtk0k/JR0EY1KfN8d7XjSGsnLyDIFOzcmebmQExjkx4pSlmTzgNQ8cXsMPxiD9dtPv/YzF3h7NzsOw1XQGiwsLiN9jUWYmZp6/fXdprH3nP+uXb5xKVvz9xIll2Xsb84tDsZgbHspKbSEJptLaO4sK9mq0YNJg+EuwwR/8Uds9HQWpYcqSb7Y24/l/xFuKure+vRfr4wLBkABwWjyXTiJHv96GvbU3jn6CG7TC0rwTDBSaYzjROLB+iVGbSX5l5UWQ6UKunDVJROqB";

// The path to your .so file (Change this to your actual path)
// Use the x86_64 version if possible, but arm64 works fine for data scanning too.
const LIB_PATH: &str = "/home/srghma/output_folder/resources/en.km.bestdict.apk/lib/x86_64/libgetData.so";

// Java Salt from Const.java
const SALT_BYTES: [u8; 20] = [
    5, 45, 174, 255, 54, 98, 156, 244, 43, 2, 248, 252, 9, 5, 150, 149, 223, 45, 255, 84,
];

fn main() -> Result<()> {
    // 1. Decode Base64
    let encrypted_data = general_purpose::STANDARD.decode(ENCRYPTED_B64)?;
    println!("Loaded {} bytes of encrypted data.", encrypted_data.len());
    println!("Target: Find HTML content inside decryption.");

    // 2. Strategy A: Smart Passwords (PBKDF2)
    println!("\n--- Phase 1: Checking Smart Passwords (PBKDF2) ---");
    let candidates = vec![
        "bestdict", "en.km.bestdict", "getData", "libgetData", "android", "123456", "",
    ];

    for pass in candidates {
        // Try SHA1 (Standard Java)
        check_pbkdf2(pass, &SALT_BYTES, &encrypted_data);
    }

    // 3. Strategy B: Binary Sliding Window (The big gun)
    println!("\n--- Phase 2: Scanning libgetData.so for Hardcoded Keys ---");
    if Path::new(LIB_PATH).exists() {
        scan_binary_for_key(LIB_PATH, &encrypted_data)?;
    } else {
        println!("ERROR: Could not find libgetData.so at: {}", LIB_PATH);
        println!("Please edit LIB_PATH in main.rs");
    }

    Ok(())
}

fn check_decryption(key: &[u8], ciphertext: &[u8], label: &str) -> bool {
    // Try AES-128 (16 bytes) or AES-256 (32 bytes)
    // We try ECB mode first (simplest, used in raw AES implementations)

    let decrypted_attempt = if key.len() == 16 {
        decrypt_ecb_128(key, ciphertext)
    } else if key.len() == 32 {
        decrypt_ecb_256(key, ciphertext)
    } else {
        return false;
    };

    if let Some(data) = decrypted_attempt {
        // Heuristic: Does it look like HTML?
        // Dictionary descriptions almost always contain HTML tags.
        if let Ok(text) = str::from_utf8(&data) {
            if text.contains("<div") || text.contains("<b>") || text.contains("<font") || text.contains("<p") || text.contains("span") {
                println!("\n✅✅✅ MATCH FOUND! ✅✅✅");
                println!("Method: {}", label);
                println!("Key (Hex): {}", hex::encode(key));
                println!("Decrypted Preview:\n{}", &text[0..std::cmp::min(150, text.len())]);
                std::process::exit(0); // Found it, exit immediately
            }
        }
    }
    false
}

// --- HELPER FUNCTIONS ---

fn check_pbkdf2(password: &str, salt: &[u8], encrypted: &[u8]) {
    let mut key128 = [0u8; 16];
    let mut key256 = [0u8; 32];

    // PBKDF2-HMAC-SHA1 (Common in Java)
    pbkdf2::<hmac::Hmac<sha1::Sha1>>(password.as_bytes(), salt, 1000, &mut key128);
    pbkdf2::<hmac::Hmac<sha1::Sha1>>(password.as_bytes(), salt, 1000, &mut key256);

    check_decryption(&key128, encrypted, &format!("PBKDF2-SHA1-128 ('{}')", password));
    check_decryption(&key256, encrypted, &format!("PBKDF2-SHA1-256 ('{}')", password));
}

fn scan_binary_for_key(path: &str, encrypted: &[u8]) -> Result<()> {
    let file = File::open(path)?;
    let mmap = unsafe { MmapOptions::new().map(&file)? };
    let file_len = mmap.len();

    println!("Scanning {} bytes... (Multi-threaded)", file_len);

    // Use Rayon for parallel scanning
    // We iterate over every byte index in the file
    (0..file_len - 32).into_par_iter().for_each(|i| {
        // Try 16-byte key (AES-128)
        let key_candidate_128 = &mmap[i..i+16];
        if check_decryption(key_candidate_128, encrypted, &format!("Binary Offset {} (16-bit)", i)) {
            return;
        }

        // Try 32-byte key (AES-256)
        let key_candidate_256 = &mmap[i..i+32];
        if check_decryption(key_candidate_256, encrypted, &format!("Binary Offset {} (32-bit)", i)) {
            return;
        }
    });

    println!("Scan complete. If no match found, the key might be dynamically generated.");
    Ok(())
}

fn decrypt_ecb_128(key: &[u8], data: &[u8]) -> Option<Vec<u8>> {
    let key_arr = aes::cipher::Key::<Aes128>::from_slice(key);
    let cipher = Aes128::new(key_arr);

    // We only need to decrypt the first block to see if it's HTML
    // data must be at least 16 bytes
    if data.len() < 16 { return None; }

    let mut block = aes::cipher::Block::<Aes128>::from_slice(&data[0..16]).clone();
    cipher.decrypt_block(&mut block);

    Some(block.to_vec())
}

fn decrypt_ecb_256(key: &[u8], data: &[u8]) -> Option<Vec<u8>> {
    let key_arr = aes::cipher::Key::<Aes256>::from_slice(key);
    let cipher = Aes256::new(key_arr);

    if data.len() < 16 { return None; }

    let mut block = aes::cipher::Block::<Aes256>::from_slice(&data[0..16]).clone();
    cipher.decrypt_block(&mut block);

    Some(block.to_vec())
}
