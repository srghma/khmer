import { crypto } from 'bun'
import { Buffer } from 'node:buffer'

// 1. The Encrypted Data (from your earlier post)
const inputBase64 =
  'a64NqFqDSxvTLP5CFFfpzlQ7T4cvjNs8TH4kU0upQqf459FT1Qa0fAn6tAAGArmhsEEXtvBrvkvjWbM1IC7YldR/0zGCeCrMKTZJ5T8/RMmU6ZgECeJP5nzknX/ORN8QBF/SrTQN6oKTOthpTRF6FvqVvJ6rrX5zHyr13Z83rHJHRQ+YMzwl4K9NSyBcD8QqCL+vetbLkIcWlW3DYWnwtgbFfnS+iwR9zhOoWUuCnWjZzzbpQhPtk0k/JR0EY1KfN8d7XjSGsnLyDIFOzcmebmQExjkx4pSlmTzgNQ8cXsMPxiD9dtPv/YzF3h7NzsOw1XQGiwsLiN9jUWYmZp6/fXdprH3nP+uXb5xKVvz9xIll2Xsb84tDsZgbHspKbSEJptLaO4sK9mq0YNJg+EuwwR/8Uds9HQWpYcqSb7Y24/l/xFuKure+vRfr4wLBkABwWjyXTiJHv96GvbU3jn6CG7TC0rwTDBSaYzjROLB+iVGbSX5l5UWQ6UKunDVJROqB'

const encryptedBytes = Buffer.from(inputBase64, 'base64')

// 2. The SALT found in Const.java
// Java: {5, 45, -82, -1, 54, 98, -100, -12, 43, 2, -8, -4, 9, 5, -106, -107, -33, 45, -1, 84}
const saltBytes = Buffer.from([5, 45, 174, 255, 54, 98, 156, 244, 43, 2, 248, 252, 9, 5, 150, 149, 223, 45, 255, 84])

// 3. List of passwords to try
const candidatePasswords = [
  '', // Empty password
  'bestdict', // Package name part
  'en.km.bestdict', // Full package name
  'getData', // Library name
  'android',
  '123456',
]

// Helper to decrypt
function tryDecrypt(algorithm: string, key: Buffer, iv: Buffer, data: Buffer, label: string) {
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAutoPadding(false) // Padding often fails with raw streams, disable to see raw result
    let decrypted = decipher.update(data)

    // Check if result looks like HTML (Dictionaries usually contain HTML)
    const text = decrypted.toString('utf8')
    if (text.includes('<div') || text.includes('<b') || text.includes('<font') || text.includes('span')) {
      console.log(`\n✅ [SUCCESS] Found Key!`)
      console.log(`Method: ${label}`)
      console.log(`Key (Hex): ${key.toString('hex')}`)
      console.log(`IV  (Hex): ${iv.toString('hex')}`)
      console.log(`Result Preview: ${text.slice(0, 100)}...`)
      return true
    }
  } catch (e) {
    // Ignore errors
  }
  return false
}

console.log('Starting Brute Force...')

// --- STRATEGY 1: Key = First 16/32 bytes of SALT (No password) ---
const key128_raw = saltBytes.subarray(0, 16)
// For IV, usually first 16 bytes of encrypted data, or 0.
const iv_from_data = encryptedBytes.subarray(0, 16)
const data_payload = encryptedBytes.subarray(16)
const iv_zero = Buffer.alloc(16, 0)

tryDecrypt('aes-128-cbc', key128_raw, iv_from_data, data_payload, 'Raw Salt Key (CBC)')
tryDecrypt('aes-128-ecb', key128_raw, Buffer.alloc(0), encryptedBytes, 'Raw Salt Key (ECB)')

// --- STRATEGY 2: PBKDF2 Key Derivation ---
for (const pass of candidatePasswords) {
  // Try generating key with PBKDF2 (Standard Java implementation)
  // Try 128 bit and 256 bit keys
  const key128 = crypto.pbkdf2Sync(pass, saltBytes, 1000, 16, 'sha1')
  const key256 = crypto.pbkdf2Sync(pass, saltBytes, 1000, 32, 'sha1')

  // Try CBC (Standard)
  tryDecrypt('aes-128-cbc', key128, iv_from_data, data_payload, `Pass: "${pass}" / AES-128-CBC / SHA1`)
  tryDecrypt('aes-256-cbc', key256, iv_from_data, data_payload, `Pass: "${pass}" / AES-256-CBC / SHA1`)

  // Try ECB (Older/Simpler)
  tryDecrypt('aes-128-ecb', key128, Buffer.alloc(0), encryptedBytes, `Pass: "${pass}" / AES-128-ECB`)
}

console.log('\nScan Finished. If no success, we need the .so file.')
