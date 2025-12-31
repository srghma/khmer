import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart'; // Import for kDebugMode
import 'package:flutter/services.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'dictionary_mode.dart';

class DefinitionGroup {
  final String sourceName;
  final String htmlContent;
  DefinitionGroup(this.sourceName, this.htmlContent);
}

class WordDetail {
  final String word;
  // for en db - can contain HTML like <font>, <b>
  // for km db - no such field
  // for ru db - no html inside
  final String? wordDisplayHtml;
  final List<DefinitionGroup> definitions;

  WordDetail({
    required this.word,
    this.wordDisplayHtml,
    required this.definitions,
  });
}

class DbHelper {
  static Database? _db;

  static Future<Database> getDb() async {
    return _db ??= await _initDb('dict.db');
  }

  static Future<Database> _initDb(String fileName) async {
    final docsDir = await getApplicationDocumentsDirectory();
    final path = join(docsDir.path, fileName);

    // ==============================================================================
    // AUTO-UPDATE LOGIC:
    // If we are in Debug mode (developing), ALWAYS delete the old DB to ensure
    // we see the latest changes from assets/dict.db.
    // ==============================================================================
    // if (kDebugMode) {
    if (true) {
      if (await File(path).exists()) {
        print("DEBUG MODE DETECTED: Deleting old cached DB to force refresh...");
        try {
          await File(path).delete();
        } catch (e) {
          print("Warning: Could not delete old DB: $e");
        }
      }
    }

    // Copy from assets if not exists (or if deleted above)
    if (!await File(path).exists()) {
      print("Copying $fileName from assets to $path...");
      try {
        ByteData data = await rootBundle.load("assets/$fileName");
        List<int> bytes = data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
        await File(path).writeAsBytes(bytes, flush: true);
        print("Database copied successfully.");
      } catch (e) {
        print("Error copying database: $e");
        throw Exception("Failed to copy dictionary database");
      }
    } else {
      print("Opening existing database from storage.");
    }

    return await openDatabase(path, readOnly: true);
  }

  // --- Load All Words (Memory Mode) ---

  static Future<List<String>> getAllWords(Database db, DictionaryMode mode) async {
    final table = mode.dictTable;
    // We only need the Word column.
    // Ordering by Word ASC ensures the list is sorted for the UI.
    final List<Map<String, dynamic>> maps = await db.rawQuery(
      'SELECT Word FROM $table ORDER BY Word ASC'
    );

    return maps.map((row) => row['Word'] as String).toList();
  }

  // --- Search Logic (Legacy/Fallback) ---

  static Future<List<Map<String, dynamic>>> searchWords(
    Database db,
    String query,
    DictionaryMode mode, {
    int limit = 50,
    int offset = 0,
  }) {
    final cleanQuery = query.trim();
    final table = mode.dictTable;

    const columns = "rowid as id, Word";

    final sql = cleanQuery.isEmpty
        ? 'SELECT $columns FROM $table ORDER BY Word ASC LIMIT $limit OFFSET $offset'
        : '''
          SELECT $columns
          FROM $table
          WHERE Word LIKE ?
          ORDER BY Word ASC
          LIMIT $limit OFFSET $offset
          ''';

    // Use parameterized query to prevent SQL injection
    return cleanQuery.isEmpty
        ? db.rawQuery(sql)
        : db.rawQuery(sql, ['$cleanQuery%']);
  }

  // --- Detail Logic ---

  static Future<WordDetail> getWordDetail(
    Database db,
    String word,
    DictionaryMode mode,
  ) async {
    final definitions = <DefinitionGroup>[];

    // Fetch all columns to handle WordDisplay and JSON fields
    final List<Map<String, dynamic>> res = await db.query(
      mode.dictTable,
      where: 'Word = ?',
      whereArgs: [word],
    );

    if (res.isEmpty) {
      return WordDetail(word: word, definitions: []);
    }

    final row = res.first;
    String? displayHtml;

    if (mode == DictionaryMode.kmEn) {
      // KM-EN: No WordDisplay column.
      _addJsonArrayIfPresent(definitions, 'Variants', row['from_csv_variants']);
      _addJsonArrayIfPresent(definitions, 'Noun Forms', row['from_csv_nounForms']);
      _addJsonArrayIfPresent(definitions, 'Pronunciations', row['from_csv_pronunciations']);

      _addIfPresent(definitions, 'General', row['Desc']);
      _addIfPresent(definitions, 'Wiktionary', row['Wiktionary']);
      _addIfPresent(definitions, 'Chuon Nath', row['from_chuon_nath']);
      _addIfPresent(definitions, 'Headley', row['from_csv_rawHtml']);
      _addIfPresent(definitions, 'Russian Loan', row['from_russian']);

    } else {
      // EN-KM, RU-KM
      // WordDisplay might exist and contain HTML (fonts, colors)
      // If WordDisplay is NULL, displayHtml becomes null, and UI handles it (shows plain Word)
      displayHtml = row['WordDisplay'] as String?;

      String mainContent = (row['Desc'] as String?) ?? "";
      if (mainContent.isNotEmpty) {
        definitions.add(DefinitionGroup('Definition', mainContent));
      }
    }

    // Extensions (EN-KM only)
    if (mode == DictionaryMode.enKm) {
      final extensions = await db.rawQuery(
        "SELECT Extension FROM ${mode.prefix}_tbl_Extension WHERE Word = ?",
        [word],
      );
      for (var extRow in extensions) {
        final extWord = extRow['Extension'] as String;
        // For extensions, we also check WordDisplay inside the referenced entry
        final extRes = await db.query(mode.dictTable, where: 'Word = ?', whereArgs: [extWord]);
        if (extRes.isNotEmpty) {
          final r = extRes.first;
          final desc = r['Desc'] as String? ?? "";
          final disp = (r['WordDisplay'] as String?) ?? extWord;
          definitions.add(DefinitionGroup(extWord, "<B>$disp</B><br>$desc"));
        }
      }
    }

    return WordDetail(
      word: word,
      wordDisplayHtml: displayHtml,
      definitions: definitions
    );
  }

  static void _addIfPresent(List<DefinitionGroup> list, String title, dynamic content) {
    if (content != null && content is String && content.trim().isNotEmpty) {
      list.add(DefinitionGroup(title, content));
    }
  }

  static void _addJsonArrayIfPresent(List<DefinitionGroup> list, String title, dynamic content) {
    if (content != null && content is String && content.isNotEmpty) {
      final parsed = jsonDecode(content);
      if (parsed is List && parsed.isNotEmpty) {
        final joined = parsed.map((e) => "<b>$e</b>").join(', ');
        list.add(DefinitionGroup(title, joined));
      }
    }
  }
}
