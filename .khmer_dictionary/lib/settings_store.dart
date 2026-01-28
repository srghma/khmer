import 'package:flutter/foundation.dart';

class SettingsStore extends ChangeNotifier {
  // Singleton
  static final SettingsStore _instance = SettingsStore._internal();
  factory SettingsStore() => _instance;
  SettingsStore._internal();

  // Map<SourceTitle, IsExpanded>
  // e.g. {'General': true, 'Wiktionary': false}
  final Map<String, bool> _accordionStates = {};

  bool isExpanded(String sourceTitle) {
    // Default to true (Open) if not set
    return _accordionStates[sourceTitle] ?? true;
  }

  void setExpanded(String sourceTitle, bool isExpanded) {
    _accordionStates[sourceTitle] = isExpanded;
    notifyListeners();
  }
}
