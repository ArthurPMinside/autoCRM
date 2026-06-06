#!/bin/bash
set -e

# ============================================================
# autoCRM Mobile — Build Production APK
# ============================================================
# Usage:
#   chmod +x build-apk.sh
#   ./build-apk.sh [local|eas]
#
# Options:
#   local  — Build APK locally (requires Android SDK)
#   eas    — Build APK via EAS cloud (recommended)
# ============================================================

MODE=${1:-eas}
API_URL="https://crmio.ru/api/v1"

echo "📱 autoCRM Mobile Build"
echo "======================="
echo "API URL: $API_URL"
echo "Mode:    $MODE"
echo ""

if [ "$MODE" = "eas" ]; then
    echo "☁️  Building via EAS cloud..."
    echo "   You will receive APK download link via email or in EAS dashboard."
    echo ""
    npx eas build --platform android --profile preview --non-interactive

elif [ "$MODE" = "local" ]; then
    echo "🔨 Building locally..."
    echo "   Requires: Android SDK, JDK 17+, Gradle"
    echo ""

    # Prebuild native project
    echo "⚙️  Running expo prebuild..."
    API_URL=$API_URL npx expo prebuild --platform android --clean

    # Build release APK
    echo "🔧 Building release APK..."
    cd android
    ./gradlew assembleRelease

    # Copy APK to root
    cd ..
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
        cp "$APK_PATH" ./autocrm-prod.apk
        echo ""
        echo "✅ APK built successfully!"
        echo "   Output: ./autocrm-prod.apk"
        echo "   Size:   $(du -h ./autocrm-prod.apk | cut -f1)"
    else
        echo "❌ APK not found at $APK_PATH"
        exit 1
    fi
else
    echo "❌ Unknown mode: $MODE"
    echo "   Usage: ./build-apk.sh [local|eas]"
    exit 1
fi

echo ""
echo "📲 Next steps:"
echo "   1. Install APK on Android devices"
echo "   2. App will connect to: $API_URL"
echo "   3. Make sure https://crmio.ru is accessible from devices"
