import 'dictionary_mode.dart';

class KeyExtraction {
  /// Returns a record of (PrimaryTag?, SecondaryTag?).
  /// Returns (null, null) if no valid script characters are found.
  static (String?, String?) extract(String word, DictionaryMode mode) {
    if (word.isEmpty) return (null, null);

    switch (mode) {
      case DictionaryMode.enKm:
      case DictionaryMode.kmEn:
        return _extractGeneric(word, _isLatin);
      case DictionaryMode.ruKm:
        return _extractGeneric(word, _isCyrillic);
    }
  }

  /// Specialized extractor that scans for the first valid character of any supported script
  /// and applies the corresponding extraction logic.
  static (String?, String?) extractSmart(String word) {
    if (word.isEmpty) return (null, null);

    final runes = word.runes;
    for (final code in runes) {
      if (_isKhmer(code)) {
        return _extractKhmer(word);
      } else if (_isCyrillic(code)) {
        return _extractGeneric(word, _isCyrillic);
      } else if (_isLatin(code)) {
        return _extractGeneric(word, _isLatin);
      }
    }

    // No valid script character found (e.g. "123 !@#")
    return (null, null);
  }

  static (String?, String?) _extractGeneric(String word, bool Function(int) predicate) {
    final runes = word.runes.toList();

    int? firstIndex;

    // Find first valid char
    for (int i = 0; i < runes.length; i++) {
      if (predicate(runes[i])) {
        firstIndex = i;
        break;
      }
    }

    if (firstIndex == null) {
      return (null, null);
    }

    final l1 = String.fromCharCode(runes[firstIndex]).toUpperCase();

    // Find secondary char (next char in sequence, regardless of type, unless it's strictly excluded?)
    // Usually for generic languages, we just take the next char if available.
    if (firstIndex + 1 < runes.length) {
      final l2 = String.fromCharCode(runes[firstIndex + 1]).toUpperCase();
      return (l1, l2);
    }

    return (l1, null);
  }

  static (String?, String?) _extractKhmer(String word) {
    final runes = word.runes.toList();
    int? firstIndex;

    // 1. Find Primary: First Khmer Char
    for (int i = 0; i < runes.length; i++) {
      if (_isKhmer(runes[i])) {
        firstIndex = i;
        break;
      }
    }

    if (firstIndex == null) return (null, null);
    final l1 = String.fromCharCode(runes[firstIndex]);

    // 2. Find Secondary
    int nextSearchIndex = firstIndex + 1;

    if (nextSearchIndex < runes.length) {
      int code = runes[nextSearchIndex];

      // Handle Subscript: If current is 17D2 (COENG), use the NEXT char as the visual secondary key
      if (code == 0x17D2) {
        nextSearchIndex++;
        if (nextSearchIndex < runes.length) {
          code = runes[nextSearchIndex];
        } else {
          return (l1, null);
        }
      }

      return (l1, String.fromCharCode(code));
    }

    return (l1, null);
  }

  // --- Predicates ---

  static bool _isLatin(int code) {
    return (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
  }

  static bool _isCyrillic(int code) {
    return code >= 0x0400 && code <= 0x04FF;
  }

  static bool _isKhmer(int code) {
    return code >= 0x1780 && code <= 0x17FF;
  }
}
