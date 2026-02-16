# Capacitor Native App Setup

MediaTech Empire uses Capacitor to wrap the existing web app into native iOS and Android applications.

## Configuration

- **App ID**: `com.mediatechempire.app`
- **App Name**: MediaTech Empire
- **Web Directory**: `dist/public`
- **Config File**: `capacitor.config.ts` (project root)

Both iOS and Android use HTTPS scheme for consistent behavior with cookies, CORS, and secure APIs.

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run cap:build` | Build web + sync | Full build pipeline for native apps |
| `npm run cap:sync` | Sync only | Copy latest web assets to native projects |
| `npm run cap:open:ios` | Open Xcode | Opens the iOS project in Xcode |
| `npm run cap:open:android` | Open Android Studio | Opens the Android project in Android Studio |

## Build Workflow

1. **Build the web app and sync to native projects:**
   ```bash
   npm run cap:build
   ```

2. **Open in Xcode (macOS only):**
   ```bash
   npm run cap:open:ios
   ```

3. **Open in Android Studio:**
   ```bash
   npm run cap:open:android
   ```

4. **Build and submit from the native IDE** (Xcode or Android Studio).

## Directory Structure

- `/ios` — Native iOS Xcode project (generated, gitignored)
- `/android` — Native Android Studio project (generated, gitignored)
- `capacitor.config.ts` — Capacitor configuration (committed)

## Regenerating Native Projects

Since `/ios` and `/android` are gitignored, regenerate them on a new machine:

```bash
npm install
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

iOS requires macOS with Xcode and CocoaPods installed. Android requires Android Studio with the Android SDK.

## Plugins

Only core Capacitor plugins are installed. The SplashScreen plugin is configured with auto-hide enabled and no spinner.
