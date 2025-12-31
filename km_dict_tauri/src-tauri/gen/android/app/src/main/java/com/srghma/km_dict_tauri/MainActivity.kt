package com.srghma.km_dict_tauri

import androidx.activity.enableEdgeToEdge
import android.os.Bundle
// import android.util.Log
// import java.io.File
// import java.io.FileOutputStream
// import java.io.InputStream

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // setupDictionaryDatabase()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    }

    // private fun setupDictionaryDatabase() {
    //     val dbName = "mydb/dict.db"
    //     // This is where Android expects databases: /data/user/0/com.srghma.km_dict_tauri/databases/dict.db
    //     val dbPath = getDatabasePath(dbName)
    //
    //     Log.i("AndroidNative", "⚠️ Database ${dbPath}")
    //
    //     if (!dbPath.exists()) {
    //         Log.i("AndroidNative", "⚠️ Database not found at ${dbPath.absolutePath}. Extracting...")
    //
    //         try {
    //             // Create the "databases" directory if it doesn't exist
    //             dbPath.parentFile?.let {
    //                 if (!it.exists()) it.mkdirs()
    //             }
    //
    //             // Tauri bundles "resources" from tauri.conf.json into the "public" assets folder
    //             // but prefixes them. Try "mydb/dict.db"
    //             val assetPath = "mydb/dict.db"
    //
    //             assets.open(assetPath).use { inputStream ->
    //                 FileOutputStream(dbPath).use { outputStream ->
    //                     val buffer = ByteArray(1024 * 8)
    //                     var length: Int
    //                     while (inputStream.read(buffer).also { length = it } > 0) {
    //                         outputStream.write(buffer, 0, length)
    //                     }
    //                 }
    //             }
    //             Log.i("AndroidNative", "✅ Database successfully extracted to ${dbPath.absolutePath}")
    //         } catch (e: Exception) {
    //             Log.e("AndroidNative", "❌ FATAL: Failed to copy database: ${e.message}")
    //             e.printStackTrace()
    //         }
    //     } else {
    //         Log.i("AndroidNative", "✅ Database already exists at ${dbPath.absolutePath}")
    //     }
    // }
}
