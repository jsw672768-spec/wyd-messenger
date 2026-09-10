#!/usr/bin/env bash
set -euo pipefail
apk=$1
report=$2
sdk_tools="${ANDROID_HOME:?Android SDK is required}/build-tools/35.0.0"
mkdir -p "$report"
sha256sum "$apk" > "$report/sha256.txt"
"$sdk_tools/aapt" dump badging "$apk" > "$report/manifest.txt"
"$sdk_tools/aapt" dump xmltree "$apk" AndroidManifest.xml > "$report/manifest-tree.txt"
"$sdk_tools/apksigner" verify --verbose --print-certs --min-sdk-version 26 --max-sdk-version 36 "$apk" > "$report/signature.txt"
"$sdk_tools/zipalign" -c -v 4 "$apk" > "$report/alignment.txt"
python3 - "$apk" > "$report/integrity.txt" <<'PY'
import sys, zipfile, os
with zipfile.ZipFile(sys.argv[1]) as z:
    assert z.testzip() is None, 'APK has a corrupt ZIP entry'
    assert 'AndroidManifest.xml' in z.namelist()
    assert 'classes.dex' in z.namelist()
    assert not any(n.startswith('lib/') for n in z.namelist()), 'Review native ABI / page-size compatibility'
    for i in z.infolist(): print(i.filename, i.file_size, i.compress_type)
print('bytes', os.path.getsize(sys.argv[1]))
print('ZIP CRC verification passed; no native ABI restrictions')
PY
cat "$report/sha256.txt" "$report/signature.txt"
