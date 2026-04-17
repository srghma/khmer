# Settings View Spec

The configuration panel for app-wide preferences.

## ASCII Layout

```text
+---------------------------------------------------------------------------------+
| SETTINGS                                                                       |
| Manage your experience and tools...                                             |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [ TEXT SIZE ]                                                                  |
|  UI Size: [----------O----------] 100%                                          |
|  Definition Text: [-------O------] 100%                                         |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | [ TOOLS ]                                                                 |  |
|  | [ OPEN KHMER COMPLEX TABLE ]                                              |  |
|  | [ OPEN KHMER ANALYZER ]                                                   |  |
|  +---------------------------------------------------------------------------+  |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | [ SEARCH ]                                                                |  |
|  | Mode: [ STARTS ] [ INCLUDES ] [ REGEX ]                                   |  |
|  | Search in content: [X]                                                     |  |
|  | Highlight in list: [X]                                                     |  |
|  +---------------------------------------------------------------------------+  |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | [ INTERFACE ]                                                             |  |
|  | Theme: [ Dark Mode Toggle ]                                               |  |
|  | Language: [ EN | RU | UK ]                                                |  |
|  +---------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

## UI Element Descriptions

### Grouped Sections
Settings are organized into visually distinct "cards" or "blocks" with a small uppercase label.

### Form Elements
- **Sliders**: Used for UI and Text scaling. Includes marks and tooltips showing the current percentage.
- **Toggle Groups**: Segmented buttons for mutually exclusive options like Search Mode.
- **Switches**: Standard boolean toggles for highlighting and content search settings.
- **Action Buttons**: Full-width buttons that navigate to specialized tools (Analyzer, Complex Table, About).

### Thematic Feedback
- **Tools**: Primary colored (Blue) to emphasize utility.
- **Project/Support**: Warning colored (Yellow) to distinguish about/donate actions.
