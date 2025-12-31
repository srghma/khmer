import 'package:flutter/material.dart';

enum DictionaryMode {
  enKm,
  kmEn,
  ruKm;

  String get prefix => switch (this) {
    DictionaryMode.enKm => 'en_km',
    DictionaryMode.kmEn => 'km_en',
    DictionaryMode.ruKm => 'ru_km',
  };

  String get label => switch (this) {
    DictionaryMode.enKm => 'EN-KM',
    DictionaryMode.kmEn => 'KM-EN',
    DictionaryMode.ruKm => 'RU-KM',
  };

  // Helper to render the flag (Text or Image)
  Widget getFlagWidget({double size = 24}) {
    switch (this) {
      case DictionaryMode.enKm:
        return Text('🇬🇧', style: TextStyle(fontSize: size));
      case DictionaryMode.kmEn:
        return Text('🇰🇭', style: TextStyle(fontSize: size));
      case DictionaryMode.ruKm:
        return Image.asset(
          'assets/bwbrussia.png',
          width: size,
          height: size,
          fit: BoxFit.contain,
        );
    }
  }

  String get dictTable => '${prefix}_tbl_Dict';
}

enum AppTab {
  enKm,
  kmEn,
  ruKm,
  history,
  favorites;

  String get title => switch (this) {
    AppTab.enKm => 'EN',
    AppTab.kmEn => 'KM',
    AppTab.ruKm => 'RU',
    AppTab.history => 'History',
    AppTab.favorites => 'Saved',
  };

  DictionaryMode? get mode {
    return switch (this) {
      AppTab.enKm => DictionaryMode.enKm,
      AppTab.kmEn => DictionaryMode.kmEn,
      AppTab.ruKm => DictionaryMode.ruKm,
      _ => null,
    };
  }
}
