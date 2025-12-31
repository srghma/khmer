import 'dart:async';
import 'dart:io';
import 'package:alphabet_list_view/alphabet_list_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:provider/provider.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:audioplayers/audioplayers.dart';
import 'db_helper.dart';
import 'user_repository.dart';
import 'settings_store.dart';
import 'dictionary_mode.dart';
import 'key_extraction.dart';

// --- Main List Implementation ---

class WordList extends StatefulWidget {
  final DictionaryMode mode;
  final Function(String) onTap;

  const WordList({super.key, required this.mode, required this.onTap});

  @override
  State<WordList> createState() => _WordListState();
}

class _WordListState extends State<WordList> {
  final ScrollController _scrollController = ScrollController();

  // Cache the processed structure to avoid rebuilding on every build call
  List<String>? _inputListRef;
  List<dynamic> _processedItems = []; // Can contain AlphabetListViewItemGroup or AlphabetListView2LevelRootItemGroup
  List<String> _primarySymbols = [];
  List<String> _secondarySymbols = [];

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _processList(List<String> words) {
    if (words == _inputListRef) return; // No change

    // Structure for valid 2-level items: Map<L1, Map<L2, List<String>>>
    final Map<String, Map<String, List<String>>> grouped = {};

    // List for items that don't match script (numbers, symbols, etc)
    final List<String> miscWords = [];

    final Set<String> primarySet = {};
    final Set<String> secondarySet = {};

    for (final word in words) {
      final (l1, l2) = KeyExtraction.extractSmart(word);

      if (l1 == null) {
        // No valid script char found, add to misc
        miscWords.add(word);
        continue;
      }

      primarySet.add(l1);

      // If l2 is missing (single letter word), use l1 as the secondary key
      // so it appears within the group (e.g. 'A' inside 'A').
      // Using '*' or specialized chars might break sorting or look weird if not handled.
      // We use l1 as fallback for L2 to keep it consistent.
      final safeL2 = (l2 != null && l2.isNotEmpty) ? l2 : l1;
      secondarySet.add(safeL2);

      grouped.putIfAbsent(l1, () => {});
      grouped[l1]!.putIfAbsent(safeL2, () => []);
      grouped[l1]![safeL2]!.add(word);
    }

    final List<dynamic> finalItems = [];

    // 1. Add Misc/Symbol group if exists (Tag: '*')
    // This is a 1-level item group. The library handles mixed types.
    if (miscWords.isNotEmpty) {
      primarySet.add('*');
      finalItems.add(
        AlphabetListViewItemGroup.builder(
          tag: '*',
          itemCount: miscWords.length,
          itemBuilder: (context, i) {
            final word = miscWords[i];
            return _buildTile(word);
          },
        ),
      );
    }

    // 2. Add 2-level groups
    final sortedL1 = grouped.keys.toList()..sort();

    for (final tag1 in sortedL1) {
      final level2Map = grouped[tag1]!;
      final List<AlphabetListViewItemGroup> childGroups = [];

      final sortedL2 = level2Map.keys.toList()..sort();

      for (final tag2 in sortedL2) {
        final wordsInGroup = level2Map[tag2]!;

        childGroups.add(
          AlphabetListViewItemGroup.builder(
            tag: tag2,
            itemCount: wordsInGroup.length,
            itemBuilder: (context, i) {
              return _buildTile(wordsInGroup[i]);
            },
          ),
        );
      }

      finalItems.add(
        AlphabetListView2LevelRootItemGroup(
          tag: tag1,
          children: childGroups,
        ),
      );
    }

    _processedItems = finalItems;

    // Sort primary symbols: '*' should be first (ASCII) or explicitly handled.
    // If sortedL1 contains alphanumeric, '*' comes before 'A' or Khmer chars in standard string sort.
    // So we can just sort the set.
    final allPrimary = primarySet.toList()..sort();
    _primarySymbols = allPrimary;

    _secondarySymbols = secondarySet.toList()..sort();
    _inputListRef = words;
  }

  Widget _buildTile(String word) {
    return Consumer<AppState>(
      builder: (context, state, child) {
        return _WordListTile(
          word: word,
          regex: state.activeRegex,
          highlight: state.highlightMatches,
          onTap: () => widget.onTap(word),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    if (state.isLoadingList) {
      return const Center(child: CircularProgressIndicator());
    }

    final words = state.filteredList;

    if (words.isEmpty) {
      return const Center(child: Text("No words found."));
    }

    // Process data into 2-level structure
    _processList(words);

    return AlphabetListView2Level(
      items: _processedItems,
      scrollController: _scrollController,
      primarySymbols: _primarySymbols,
      secondarySymbols: _secondarySymbols,
      options: AlphabetListViewOptions(
        listOptions: ListOptions(
          stickySectionHeader: true,
          topOffset: 0,
          listHeaderBuilder: (context, symbol) {
            return Container(
              height: 40,
              color: Colors.teal.shade50,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              alignment: Alignment.centerLeft,
              child: Text(
                symbol,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.teal,
                  fontSize: 18,
                ),
              ),
            );
          },
        ),
        scrollbarOptions: ScrollbarOptions(
          backgroundColor: Colors.transparent,
          width: 30,
          symbolBuilder: (context, symbol, state) {
            final color = state == AlphabetScrollbarItemState.active
                ? Colors.teal
                : Colors.grey;
            return Center(
              child: Text(
                symbol,
                style: TextStyle(
                  color: color,
                  fontWeight: state == AlphabetScrollbarItemState.active
                      ? FontWeight.bold
                      : FontWeight.normal,
                  fontSize: 12,
                ),
              ),
            );
          },
        ),
        overlayOptions: OverlayOptions(
          showOverlay: true,
          overlayBuilder: (context, symbol) {
            return Container(
              alignment: Alignment.center,
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.teal.withOpacity(0.9),
                shape: BoxShape.circle,
              ),
              child: Text(
                symbol,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// Separate widget for list tile with caching
class _WordListTile extends StatefulWidget {
  final String word;
  final RegExp? regex;
  final bool highlight;
  final VoidCallback onTap;

  const _WordListTile({
    required this.word,
    required this.regex,
    required this.highlight,
    required this.onTap,
  });

  @override
  State<_WordListTile> createState() => _WordListTileState();
}

class _WordListTileState extends State<_WordListTile>
    with AutomaticKeepAliveClientMixin {
  // Cache the highlighted text widget
  Widget? _cachedTextWidget;
  String? _cachedWord;
  RegExp? _cachedRegex;
  bool? _cachedHighlight;

  @override
  bool get wantKeepAlive => true; // Keep state alive when scrolled away

  Widget _buildHighlightedText() {
    // Return cached widget if nothing changed
    if (_cachedTextWidget != null &&
        _cachedWord == widget.word &&
        _cachedRegex == widget.regex &&
        _cachedHighlight == widget.highlight) {
      return _cachedTextWidget!;
    }

    // Build new widget
    Widget textWidget;

    if (!widget.highlight || widget.regex == null) {
      textWidget = Text(widget.word);
    } else {
      try {
        final matches = widget.regex!.allMatches(widget.word);
        if (matches.isEmpty) {
          textWidget = Text(widget.word);
        } else {
          final spans = <TextSpan>[];
          int start = 0;

          for (final match in matches) {
            if (match.start > start) {
              spans.add(
                TextSpan(text: widget.word.substring(start, match.start)),
              );
            }
            spans.add(
              TextSpan(
                text: widget.word.substring(match.start, match.end),
                style: const TextStyle(
                  backgroundColor: Colors.yellow,
                  fontWeight: FontWeight.bold,
                ),
              ),
            );
            start = match.end;
          }

          if (start < widget.word.length) {
            spans.add(TextSpan(text: widget.word.substring(start)));
          }

          textWidget = RichText(
            text: TextSpan(
              style: const TextStyle(color: Colors.black),
              children: spans,
            ),
          );
        }
      } catch (e) {
        textWidget = Text(widget.word);
      }
    }

    // Cache the result
    _cachedTextWidget = textWidget;
    _cachedWord = widget.word;
    _cachedRegex = widget.regex;
    _cachedHighlight = widget.highlight;

    return textWidget;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin

    return ListTile(
      visualDensity: VisualDensity.compact,
      title: _buildHighlightedText(),
      onTap: widget.onTap,
    );
  }
}

// --- Top Level Regex Constants ---
final RegExp kRegExpKhmer = RegExp(r'[\u1780-\u17FF\u19E0-\u19FF]');
final RegExp kRegExpEnglish = RegExp(r'[a-zA-Z]');
final RegExp kRegExpRussian = RegExp(r'[\u0400-\u04FF\u0500-\u052F]');

void main() {
  if (Platform.isLinux || Platform.isWindows || Platform.isMacOS) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
        ChangeNotifierProvider(create: (_) => SettingsStore()),
      ],
      child: const MyApp(),
    ),
  );
}

class AppState extends ChangeNotifier {
  Database? _dictDb;
  AppTab _currentTab = AppTab.enKm;
  String _searchQuery = "";

  // Settings
  bool _isRegexMode = false;
  bool _filterResults = true; // "Show only matched"
  bool _highlightMatches = true;

  // Cache for all words: Map<Mode, List<String>>
  final Map<DictionaryMode, List<String>> _cachedWords = {};

  // The list currently being displayed (filtered)
  List<String> _filteredList = [];
  bool _isLoadingList = false;

  // Cached Regex for highlighting/filtering to avoid recompilation on scroll
  RegExp? _activeRegex;

  Timer? _debounceTimer;

  String? _selectedWord;
  DictionaryMode? _selectedMode;
  bool _isDbReady = false;

  AppState() {
    _init();
  }

  Database? get db => _dictDb;
  AppTab get currentTab => _currentTab;
  String get searchQuery => _searchQuery;

  bool get isRegexMode => _isRegexMode;
  bool get filterResults => _filterResults;
  bool get highlightMatches => _highlightMatches;

  String? get selectedWord => _selectedWord;
  DictionaryMode? get selectedMode => _selectedMode;
  bool get isDbReady => _isDbReady;

  List<String> get filteredList => _filteredList;
  bool get isLoadingList => _isLoadingList;
  RegExp? get activeRegex => _activeRegex;

  Future<void> _init() async {
    _dictDb = await DbHelper.getDb();
    _isDbReady = true;

    // Initial load for default tab
    if (_currentTab.mode != null) {
      await _ensureDictionaryLoaded(_currentTab.mode!);
    }
    notifyListeners();
  }

  Future<void> _ensureDictionaryLoaded(DictionaryMode mode) async {
    if (_cachedWords.containsKey(mode)) {
      _applyFilter();
      notifyListeners(); // Ensure listeners are notified when loading from cache
      return;
    }

    _isLoadingList = true;
    notifyListeners();

    if (_dictDb != null) {
      final words = await DbHelper.getAllWords(_dictDb!, mode);
      _cachedWords[mode] = words;
    }

    _isLoadingList = false;
    _applyFilter(); // Filter immediately after loading
    notifyListeners();
  }

  // FIXME: GIVEN i visit en, then km, then ru, then history, click on ru or km or en. EXPECTED should open tab, ACTUAL doesnt open
  void setTab(AppTab tab) {
    _currentTab = tab;

    // If we switch to a dictionary tab, ensure its data is loaded
    if (tab.mode != null) {
      _ensureDictionaryLoaded(tab.mode!);
    } else {
      // Clear filtered list for non-dict tabs (History/Favs handle their own data)
      _filteredList = [];
      notifyListeners();
    }
  }

  // --- Settings Toggles ---

  void setRegexMode(bool value) {
    _isRegexMode = value;
    _applyFilter();
    notifyListeners();
  }

  void setFilterResults(bool value) {
    _filterResults = value;
    _applyFilter();
    notifyListeners();
  }

  void setHighlightMatches(bool value) {
    _highlightMatches = value;
    notifyListeners();
  }

  // --- Search Logic ---

  void setSearchQuery(String query) {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();

    // UI update immediate for text field state
    _searchQuery = query;
    notifyListeners();

    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _autoSwitchTab(query);
      _applyFilter();
      notifyListeners();
    });
  }

  void _applyFilter() {
    final mode = _currentTab.mode;
    if (mode == null || !_cachedWords.containsKey(mode)) {
      _filteredList = [];
      return;
    }

    final allWords = _cachedWords[mode]!;
    final query = _searchQuery.trim();

    // Reset regex cache
    _activeRegex = null;

    if (query.isEmpty) {
      _filteredList = allWords;
      return;
    }

    // Build the regex once
    if (_isRegexMode) {
      try {
        _activeRegex = RegExp(query, caseSensitive: false, unicode: true);
      } catch (e) {
        print("Invalid Regex: $e");
        _filteredList = [];
        return;
      }
    } else {
      // For normal mode, create regex for highlighting
      _activeRegex = RegExp(RegExp.escape(query), caseSensitive: false);
    }

    if (!_filterResults) {
      // "Show All" mode - no filtering
      _filteredList = allWords;
      return;
    }

    // OPTIMIZATION: Use efficient filtering
    if (_isRegexMode) {
      if (_activeRegex != null) {
        _filteredList = _filterWithRegex(allWords, _activeRegex!);
      } else {
        _filteredList = [];
      }
    } else {
      // OPTIMIZATION: Fast prefix search without regex
      final lowerQuery = query.toLowerCase();
      _filteredList = _filterByPrefix(allWords, lowerQuery);
    }
  }

  // Optimized filtering methods
  List<String> _filterWithRegex(List<String> words, RegExp regex) {
    final result = <String>[];
    for (var word in words) {
      if (regex.hasMatch(word)) {
        result.add(word);
      }
    }
    return result;
  }

  List<String> _filterByPrefix(List<String> words, String prefix) {
    // Binary search optimization since words are sorted
    final result = <String>[];

    // Find first match
    int left = 0;
    int right = words.length;

    while (left < right) {
      final mid = (left + right) ~/ 2;
      if (words[mid].toLowerCase().compareTo(prefix) < 0) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Collect all matching words
    for (int i = left; i < words.length; i++) {
      final lowerWord = words[i].toLowerCase();
      if (lowerWord.startsWith(prefix)) {
        result.add(words[i]);
      } else {
        // Since sorted, no more matches after first non-match
        break;
      }
    }

    return result;
  }

  Future<void> searchAndSelect(String query) async {
    _searchQuery = query;
    _autoSwitchTab(query);

    if (_currentTab.mode != null) {
      await _ensureDictionaryLoaded(_currentTab.mode!); // Ensure loaded

      // Try to find exact match in the memory cache first
      final allWords = _cachedWords[_currentTab.mode]!;
      final exactMatch = allWords.firstWhere(
        (w) => w.toLowerCase() == query.toLowerCase(),
        orElse: () => "",
      );

      if (exactMatch.isNotEmpty) {
        selectWord(exactMatch, _currentTab.mode!);
      } else {
        // If no exact match, just update filter
        _applyFilter();
      }
    }
    notifyListeners();
  }

  void selectWord(String word, DictionaryMode mode) {
    _selectedWord = word;
    _selectedMode = mode;
    UserRepository.addToHistory(word, mode).then((_) => notifyListeners());
    notifyListeners();
  }

  void clearSelection() {
    _selectedWord = null;
    notifyListeners();
  }

  void _autoSwitchTab(String char) {
    if (char.isEmpty) return;
    if (_currentTab == AppTab.history || _currentTab == AppTab.favorites) {
      return;
    }

    // Only auto-switch if we are NOT in regex mode,
    // because regex syntax characters might trigger wrong language detection
    if (_isRegexMode) return;

    final firstChar = char.trim().characters.first;

    AppTab? targetTab;
    if (kRegExpKhmer.hasMatch(firstChar)) {
      targetTab = AppTab.kmEn;
    } else if (kRegExpEnglish.hasMatch(firstChar)) {
      targetTab = AppTab.enKm;
    } else if (kRegExpRussian.hasMatch(firstChar)) {
      targetTab = AppTab.ruKm;
    }

    if (targetTab != null && targetTab != _currentTab) {
      _currentTab = targetTab;
      _ensureDictionaryLoaded(targetTab.mode!);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Khmer Dictionary',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
        visualDensity: VisualDensity.compact,
        listTileTheme: const ListTileThemeData(dense: true),
        fontFamily: Platform.isWindows ? 'Segoe UI' : null,
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    if (!state.isDbReady) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final isSplitView = constraints.maxWidth >= 700;

        return Scaffold(
          body: Row(
            children: [
              Expanded(
                flex: isSplitView ? 4 : 1,
                child: Column(
                  children: [
                    const GlobalSearchBar(),
                    _buildTabBar(context, state),
                    Expanded(child: _buildBody(context, state, isSplitView)),
                  ],
                ),
              ),
              if (isSplitView)
                VerticalDivider(width: 1, color: Colors.grey.shade300),
              if (isSplitView)
                Expanded(
                  flex: 6,
                  child: state.selectedWord != null
                      ? DetailView(
                          word: state.selectedWord!,
                          mode: state.selectedMode!,
                          db: state.db!,
                          isSplitView: true,
                        )
                      : const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.translate,
                                size: 64,
                                color: Colors.grey,
                              ),
                              SizedBox(height: 16),
                              Text(
                                "Select a word",
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTabBar(BuildContext context, AppState state) {
    return Container(
      color: Colors.teal.shade50,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: AppTab.values.map((tab) {
            final isSelected = state.currentTab == tab;
            return InkWell(
              onTap: () => context.read<AppState>().setTab(tab),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  border: isSelected
                      ? const Border(
                          bottom: BorderSide(color: Colors.teal, width: 3),
                        )
                      : null,
                ),
                child: Row(
                  children: [
                    if (tab.mode != null)
                      tab.mode!.getFlagWidget(size: 20)
                    else
                      Icon(
                        tab == AppTab.history ? Icons.history : Icons.star,
                        size: 18,
                      ),
                    const SizedBox(width: 8),
                    Text(
                      tab.title,
                      style: TextStyle(
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                        color: isSelected ? Colors.teal : Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, AppState state, bool isSplitView) {
    final tab = state.currentTab;

    if (tab.mode != null) {
      // Use the new memory-based list logic with AlphabetListView2Level
      return WordList(
        key: ValueKey('${tab.mode}'), // Key depends on mode
        mode: tab.mode!,
        onTap: (word) {
          context.read<AppState>().selectWord(word, tab.mode!);
          if (!isSplitView) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    DetailScreen(word: word, mode: tab.mode!, db: state.db!),
              ),
            );
          }
        },
      );
    }

    return UserDataList(
      key: ValueKey(tab),
      isHistory: tab == AppTab.history,
      onTap: (word, mode) {
        context.read<AppState>().selectWord(word, mode);
        if (!isSplitView) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) =>
                  DetailScreen(word: word, mode: mode, db: state.db!),
            ),
          );
        }
      },
    );
  }
}

class GlobalSearchBar extends StatefulWidget {
  const GlobalSearchBar({super.key});

  @override
  State<GlobalSearchBar> createState() => _GlobalSearchBarState();
}

class _GlobalSearchBarState extends State<GlobalSearchBar> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final query = context.read<AppState>().searchQuery;
    _controller = TextEditingController(text: query);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // In case the provider updates from outside (e.g. clear button), sync here
    final stateQuery = context.read<AppState>().searchQuery;
    if (_controller.text != stateQuery) {
      _controller.text = stateQuery;
      // Preserve selection end if possible, or just go to end
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: stateQuery.length),
      );
    }
  }

  void _showSettings(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) {
        // Use a StatefulBuilder/Consumer in dialog to see updates immediately
        return AlertDialog(
          title: const Text("Search Settings"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Consumer<AppState>(
                builder: (context, state, child) {
                  return Column(
                    children: [
                      SwitchListTile(
                        title: const Text("Regex Mode"),
                        subtitle: const Text("Use regular expressions"),
                        value: state.isRegexMode,
                        onChanged: (val) => state.setRegexMode(val),
                      ),
                      SwitchListTile(
                        title: const Text("Filter Results"),
                        subtitle: const Text("Show only matched words"),
                        value: state.filterResults,
                        onChanged: (val) => state.setFilterResults(val),
                      ),
                      SwitchListTile(
                        title: const Text("Highlight Matches"),
                        subtitle: const Text("Highlight text in list"),
                        value: state.highlightMatches,
                        onChanged: (val) => state.setHighlightMatches(val),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Close"),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // We only listen to select parts if needed, but here we just need current values
    final state = context.watch<AppState>();

    return Container(
      color: Colors.teal,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        bottom: 8,
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: state.isRegexMode
                    ? 'Regex (e.g. \\p{Script=Khmer})'
                    : 'Search...',
                filled: true,
                fillColor: Colors.white,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: state.searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 20),
                        onPressed: () {
                          context.read<AppState>().setSearchQuery("");
                          _controller.clear();
                        },
                      )
                    : null,
              ),
              onChanged: (val) {
                // Update state without rebuilding the textfield controller from state
                context.read<AppState>().setSearchQuery(val);
              },
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white),
            tooltip: 'Search Settings',
            onPressed: () => _showSettings(context),
          ),
        ],
      ),
    );
  }
}

class UserDataList extends StatefulWidget {
  final bool isHistory;
  final Function(String, DictionaryMode) onTap;

  const UserDataList({super.key, required this.isHistory, required this.onTap});

  @override
  State<UserDataList> createState() => _UserDataListState();
}

class _UserDataListState extends State<UserDataList> {
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    if (widget.isHistory) {
      UserRepository.getHistory().then((res) => _update(res));
    } else {
      UserRepository.getFavorites().then((res) => _update(res));
    }
  }

  void _update(List<Map<String, dynamic>> res) {
    if (mounted) setState(() => _items = res);
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) return const Center(child: Text('Empty.'));

    return ListView.separated(
      itemCount: _items.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (ctx, i) {
        final item = _items[i];
        final word = item['word'] as String;
        final modeIndex = item['mode_index'] as int;
        if (modeIndex >= DictionaryMode.values.length) return const SizedBox();
        final mode = DictionaryMode.values[modeIndex];

        return ListTile(
          leading: SizedBox(
            width: 24,
            height: 24,
            child: Center(child: mode.getFlagWidget(size: 20)),
          ),
          title: Text(word),
          trailing: const Icon(Icons.arrow_forward_ios, size: 14),
          onTap: () => widget.onTap(word, mode),
        );
      },
    );
  }
}

class DetailScreen extends StatelessWidget {
  final String word;
  final DictionaryMode mode;
  final Database db;

  const DetailScreen({
    super.key,
    required this.word,
    required this.mode,
    required this.db,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(word),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: DetailView(word: word, mode: mode, db: db),
    );
  }
}

class DetailView extends StatefulWidget {
  final String word;
  final DictionaryMode mode;
  final Database db;
  final bool isSplitView;

  const DetailView({
    super.key,
    required this.word,
    required this.mode,
    required this.db,
    this.isSplitView = false,
  });

  @override
  State<DetailView> createState() => _DetailViewState();
}

class _DetailViewState extends State<DetailView> {
  WordDetail? _detail;
  bool _isFavorite = false;
  String _currentSelectedText = '';

  // TTS & Audio
  final FlutterTts _flutterTts = FlutterTts();
  final AudioPlayer _audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _load();
    _initTts();
  }

  void _initTts() {
    _flutterTts.setStartHandler(() => debugPrint("TTS started"));
    _flutterTts.setCompletionHandler(() => debugPrint("TTS completed"));
    _flutterTts.setErrorHandler((msg) => debugPrint("TTS error: $msg"));
  }

  @override
  void dispose() {
    _flutterTts.stop();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant DetailView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.word != widget.word || oldWidget.mode != widget.mode) {
      _load();
    }
  }

  void _load() async {
    setState(() => _detail = null);

    final det = await DbHelper.getWordDetail(
      widget.db,
      widget.word,
      widget.mode,
    );
    final fav = await UserRepository.isFavorite(widget.word, widget.mode);

    if (mounted) {
      setState(() {
        _detail = det;
        _isFavorite = fav;
      });
    }
  }

  void _toggleFav() async {
    await UserRepository.toggleFavorite(widget.word, widget.mode);
    setState(() => _isFavorite = !_isFavorite);
  }

  Map<String, String> _detectTtsLanguage(String text) {
    String nativeLang = 'en-US';
    String googleLang = 'en';

    if (kRegExpKhmer.hasMatch(text)) {
      nativeLang = 'km-KH';
      googleLang = 'km';
    } else if (kRegExpRussian.hasMatch(text)) {
      nativeLang = 'ru-RU';
      googleLang = 'ru';
    } else if (kRegExpEnglish.hasMatch(text)) {
      nativeLang = 'en-US';
      googleLang = 'en';
    }
    return {'native': nativeLang, 'google': googleLang};
  }

  Future<void> _speakNative({required String text, String? langCode}) async {
    try {
      final detectedLang = langCode ?? _detectTtsLanguage(text)['native']!;
      await _flutterTts.setLanguage(detectedLang);
      await _flutterTts.speak(text);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Native TTS Error: $e")));
      }
    }
  }

  Future<void> _speakGoogle({required String text, String? langCode}) async {
    try {
      final detectedLang = langCode ?? _detectTtsLanguage(text)['google']!;
      final url =
          "https://translate.google.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(text)}&tl=$detectedLang&client=tw-ob";
      await _audioPlayer.play(UrlSource(url));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Google TTS Error: $e")));
      }
    }
  }

  void _onLinkTap(String? url) {
    if (url == null) return;
    if (url.startsWith('bword://')) {
      final targetWord = url.replaceAll('bword://', '');
      context.read<AppState>().selectWord(targetWord, widget.mode);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_detail == null) {
      return const Center(child: CircularProgressIndicator());
    }
    final settings = context.watch<SettingsStore>();
    final d = _detail!;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey.shade100,
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (d.wordDisplayHtml != null)
                      Html(
                        data: d.wordDisplayHtml,
                        style: {
                          "body": Style(
                            fontSize: FontSize(24.0),
                            fontWeight: FontWeight.bold,
                            color: Colors.teal,
                            margin: Margins.zero,
                          ),
                          "font": Style(fontSize: FontSize(24.0)),
                        },
                      )
                    else
                      SelectableText(
                        d.word,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.teal,
                        ),
                      ),
                    Text(
                      widget.mode.label,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.volume_up, color: Colors.teal),
                tooltip: 'Native TTS (Main Word)',
                onPressed: () => _speakNative(text: widget.word),
              ),
              IconButton(
                icon: const Icon(Icons.g_translate, color: Colors.blue),
                tooltip: 'Google TTS (Main Word)',
                onPressed: () => _speakGoogle(text: widget.word),
              ),
              IconButton(
                icon: Icon(
                  _isFavorite ? Icons.star : Icons.star_border,
                  color: _isFavorite ? Colors.orange : Colors.grey,
                  size: 32,
                ),
                onPressed: _toggleFav,
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: d.definitions.isEmpty
              ? const Center(child: Text("No definition found."))
              : ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: d.definitions.length,
                  itemBuilder: (ctx, i) {
                    final def = d.definitions[i];
                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      child: Theme(
                        data: Theme.of(
                          context,
                        ).copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          initiallyExpanded: settings.isExpanded(
                            def.sourceName,
                          ),
                          onExpansionChanged: (isOpen) {
                            settings.setExpanded(def.sourceName, isOpen);
                          },
                          title: Text(
                            def.sourceName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.teal,
                            ),
                          ),
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              child: SelectionArea(
                                onSelectionChanged: (content) {
                                  _currentSelectedText =
                                      content?.plainText ?? '';
                                },
                                contextMenuBuilder: (context, editableTextState) {
                                  final selectedText = _currentSelectedText;

                                  final List<ContextMenuButtonItem>
                                  buttonItems =
                                      editableTextState.contextMenuButtonItems;

                                  if (selectedText.isNotEmpty) {
                                    buttonItems.insert(
                                      0,
                                      ContextMenuButtonItem(
                                        onPressed: () {
                                          ContextMenuController.removeAny();
                                          _speakNative(text: selectedText);
                                        },
                                        label: 'Pronounce Native',
                                      ),
                                    );
                                    buttonItems.insert(
                                      1,
                                      ContextMenuButtonItem(
                                        onPressed: () {
                                          ContextMenuController.removeAny();
                                          _speakGoogle(text: selectedText);
                                        },
                                        label: 'Pronounce Google',
                                      ),
                                    );
                                    buttonItems.insert(
                                      2,
                                      ContextMenuButtonItem(
                                        onPressed: () {
                                          ContextMenuController.removeAny();
                                          context
                                              .read<AppState>()
                                              .searchAndSelect(selectedText);
                                        },
                                        label: 'Search App',
                                      ),
                                    );
                                    buttonItems.add(
                                      ContextMenuButtonItem(
                                        onPressed: () {
                                          ContextMenuController.removeAny();
                                          try {
                                            launchUrlString(
                                              "https://www.google.com/search?q=${Uri.encodeComponent(selectedText)}",
                                              mode: LaunchMode
                                                  .externalApplication,
                                            );
                                          } catch (_) {}
                                        },
                                        label: 'Google Web',
                                      ),
                                    );
                                  }

                                  return AdaptiveTextSelectionToolbar.buttonItems(
                                    anchors:
                                        editableTextState.contextMenuAnchors,
                                    buttonItems: buttonItems,
                                  );
                                },
                                child: Html(
                                  data: def.htmlContent,
                                  onLinkTap: (url, _, _) => _onLinkTap(url),
                                  style: {
                                    "body": Style(
                                      fontSize: FontSize(16.0),
                                      margin: Margins.zero,
                                    ),
                                    "a": Style(
                                      textDecoration: TextDecoration.none,
                                      color: Colors.blue,
                                    ),
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
