# WYD Messenger for Android

This is a native Android WebView host for the existing Next.js application in `my-app`. It is not an offline replacement for the server. It preserves the existing QR-first event, announcement, schedule, meeting-point, and chat UI. The Android project can be opened in Android Studio or built with Gradle and JDK 17.

## Install a development APK

Open the GitHub Actions workflow **Android APK**, run it on the feature branch, and download the `WYD-Messenger-Android-debug` artifact. Extract the ZIP and install `app-debug.apk` on an Android 8.0+ device. The APK is a development build signed by the Android debug key, not a Play Store release. Different build machines may have different debug keys, so uninstall an older debug build if Android reports a signature mismatch. Uninstalling can erase locally stored app data.

At first launch, enter the HTTPS origin of your running WYD website. If using Codespaces, run `cd /workspaces/wyd-messenger/my-app && npm run dev -- --hostname 0.0.0.0 --port 3000`, make port 3000 public, and copy its HTTPS forwarded URL into the app. Codespaces is temporary, so use a stable deployment for a real event. The same server must have the Supabase configuration and translation API available. Never enter service-role keys into the app.

For a preconfigured build, set repository variable `WYD_SITE_URL` or pass `site_url` to the workflow. The URL must be an HTTPS origin, without paths, queries, credentials, or fragments. The app can still change its server in Settings. QR links use the existing web application paths. Native `wyd://event/ID` and `wyd://room/ID` links are supported. Ordinary HTTPS links are not claimed as verified Android App Links; domain verification requires control of the deployed domain and an assetlinks.json file.

## Build locally

Install Android SDK platform 35, build tools, JDK 17 and Gradle 8.11.1. From `android-app`, run `gradle testDebugUnitTest assembleDebug`. The APK is produced at `app/build/outputs/apk/debug/app-debug.apk`. Android Studio can also import the project and generate a signed release after you configure your own signing key. Never commit a release keystore or its passwords.

## Limitations

The native shell does not bundle a Next.js server or a translation model. Camera access is granted only to the configured HTTPS origin and only for video capture. External links are opened outside the WebView. The existing website's database permissions, translation quotas, reliability and privacy controls still require production verification. No push-notification service, offline synchronization, iOS binary, or store release is included. Use the development APK for testing, not as proof of production readiness.
