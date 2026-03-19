https://play.google.com/store/apps/details?id=com.srghma.srghmakhmerdict

# Hacking

```
GPC_JSON_KEY_PATH=~/... fastlane upload_aab_production

source ~/.dotfiles/secrets/khmer-dict-env.sh && tauri android build && (adb uninstall com.srghma.srghmakhmerdict || true) && (adb install /home/srghma/projects/khmer/srghmakhmerdict/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk || true)

(adb uninstall com.srghma.srghmakhmerdict || true) && tauri android dev
```
