#!/usr/bin/env bash
set -euo pipefail
apk_dir=$1
report=$2
mkdir -p "$report"
# ONLY disposable CI emulators; never run cleanup on a user's device.
test "$(adb shell getprop ro.kernel.qemu | tr -d '\r')" = 1
adb shell getprop > "$report/device-properties.txt"
adb logcat -c
package=org.wyd.messenger.debug
component="$package/org.wyd.messenger.MainActivity"
adb install "$apk_dir/original/app-debug.apk" 2>&1 | tee "$report/original-install.txt"
adb shell am start -W -n "$component" | tee "$report/original-launch.txt"
grep -q 'Status: ok' "$report/original-launch.txt"
adb shell pidof "$package" > "$report/original-pid.txt"
set +e
adb install -r "$apk_dir/previous-verification/app-debug.apk" > "$report/original-update.txt" 2>&1
update_status=$?
set -e
test "$update_status" -ne 0
grep -q 'INSTALL_FAILED_UPDATE_INCOMPATIBLE' "$report/original-update.txt"
adb uninstall "$package" > "$report/emulator-cleanup.txt"
adb install "$apk_dir/current/WYD-Messenger-debug.apk" 2>&1 | tee "$report/current-install.txt"
adb shell am start -W -n "$component" | tee "$report/current-launch.txt"
grep -q 'Status: ok' "$report/current-launch.txt"
sleep 3
adb shell pidof "$package" > "$report/current-pid.txt"
adb shell uiautomator dump /sdcard/wyd-ui.xml
adb pull /sdcard/wyd-ui.xml "$report/phone-ui.xml"
adb exec-out screencap -p > "$report/phone.png"
adb shell wm size 1200x1920
adb shell wm density 240
sleep 2
adb shell uiautomator dump /sdcard/wyd-ui.xml
adb pull /sdcard/wyd-ui.xml "$report/tablet-ui.xml"
adb exec-out screencap -p > "$report/tablet.png"
adb shell input keyevent KEYCODE_BACK
adb shell am start -W -n "$component" > "$report/relaunch.txt"
adb logcat -d -b all > "$report/logcat.txt"
if grep -q 'FATAL EXCEPTION' "$report/logcat.txt"; then
  echo 'A fatal exception was recorded; inspect logcat before distributing.'
  exit 1
fi
printf 'Original and current APKs installed and native setup launched; independent debug-signature conflict reproduced. Web service and physical devices not tested here.\n' > "$report/RESULT.txt"
