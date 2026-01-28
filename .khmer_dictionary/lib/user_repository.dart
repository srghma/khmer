import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'dictionary_mode.dart';

class UserRepository {
  static Database? _db;

  static Future<Database> get _userDb async {
    return _db ??= await _initUserDb();
  }

  static Future<Database> _initUserDb() async {
    final docsDir = await getApplicationDocumentsDirectory();
    final path = join(docsDir.path, 'user_data.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE user_favorites (
            word TEXT NOT NULL,
            mode_index INTEGER NOT NULL,
            timestamp INTEGER,
            PRIMARY KEY (word, mode_index)
          )
        ''');
        await db.execute('''
          CREATE TABLE user_history (
            word TEXT NOT NULL,
            mode_index INTEGER NOT NULL,
            timestamp INTEGER,
            PRIMARY KEY (word, mode_index)
          )
        ''');
      },
    );
  }

  // --- History Logic ---

  static Future<void> addToHistory(String word, DictionaryMode mode) async {
    final db = await _userDb;
    final timestamp = DateTime.now().millisecondsSinceEpoch;

    await db.insert(
      'user_history',
      {'word': word, 'mode_index': mode.index, 'timestamp': timestamp},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    // Cleanup: Keep only last 100 items
    await db.rawDelete(
      'DELETE FROM user_history WHERE rowid NOT IN (SELECT rowid FROM user_history ORDER BY timestamp DESC LIMIT 100)'
    );
  }

  static Future<List<Map<String, dynamic>>> getHistory() async {
    final db = await _userDb;
    return await db.query('user_history', orderBy: 'timestamp DESC');
  }

  // --- Favorites Logic ---

  static Future<void> toggleFavorite(String word, DictionaryMode mode) async {
    final db = await _userDb;
    final isFav = await isFavorite(word, mode);

    if (isFav) {
      await db.delete(
        'user_favorites',
        where: 'word = ? AND mode_index = ?',
        whereArgs: [word, mode.index]
      );
    } else {
      await db.insert(
        'user_favorites',
        {
          'word': word,
          'mode_index': mode.index,
          'timestamp': DateTime.now().millisecondsSinceEpoch
        }
      );
    }
  }

  static Future<bool> isFavorite(String word, DictionaryMode mode) async {
    final db = await _userDb;
    final res = await db.query(
      'user_favorites',
      where: 'word = ? AND mode_index = ?',
      whereArgs: [word, mode.index],
    );
    return res.isNotEmpty;
  }

  static Future<List<Map<String, dynamic>>> getFavorites() async {
    final db = await _userDb;
    return await db.query('user_favorites', orderBy: 'timestamp DESC');
  }
}
