# WYD Messenger Android

기존 웹앱을 연결하는 네이티브 WebView 앱입니다. 아이콘·시작 설정 화면, 신뢰한 HTTPS 사이트의 QR 카메라 권한, 안전한 외부 링크, 공유, 뒤로가기, 네트워크 복구, 키보드·화면 여백 대응을 포함합니다.

## 빌드

JDK 17, Gradle 8.11.1, Android SDK 플랫폼 36과 빌드 도구를 준비하고 android-app에서 gradle --no-daemon testDebugUnitTest assembleDebug lintDebug를 실행합니다. 결과는 app/build/outputs/apk/debug/app-debug.apk입니다. 최소 Android 8(API 26), 대상 Android 16(API 36)입니다.

테스트 패키지는 org.wyd.messenger.debug, 정식 패키지는 org.wyd.messenger입니다. WYD_SITE_URL 또는 wydSiteUrl Gradle 속성에 안정적인 HTTPS origin을 설정합니다. 비어 있으면 주소 설정 화면으로 시작합니다. Codespaces를 최종 서비스 주소로 사용하지 않습니다.

## 검사와 배포

- Android verification: PR 빌드·단위 검사·lint·aapt/apksigner/zipalign와 API 26/36 설치·네이티브 실행을 검사합니다. 임시 CI 서명 결과는 반복 배포용이 아닙니다. 과거 APK 진단은 원래 아티팩트가 남아 있을 때만 수동으로 선택합니다.
- Android managed test distribution: 영구 테스트 서명과 승인된 HTTPS 주소를 요구하는 수동 배포입니다. 같은 APK의 두 API 설치 검사가 모두 통과한 뒤 WYD-managed-APK-install-verified 아티팩트를 생성합니다. 후보 아티팩트는 설치 검증 완료본이 아닙니다.
- 정식 앱은 별도 정식 키로 배포합니다. 키를 공개 저장소에 넣지 않습니다. Play 배포는 아직 구성되지 않았습니다.

android-distribution 환경에는 WYD_DEBUG_KEYSTORE_BASE64, WYD_DEBUG_STORE_PASSWORD, WYD_DEBUG_KEY_ALIAS, WYD_DEBUG_KEY_PASSWORD 비밀값과 WYD_DEBUG_CERT_SHA256 변수가 필요합니다. **환경 보호와 키는 아직 계정에 설정하지 않았습니다.** 키가 없으면 중단하고 임시 키로 배포하지 않습니다. 키는 실행 중 임시 경로에서만 복원해 마지막에 지웁니다. 버전 번호는 이전 배포보다 커야 합니다. 첫 관리 배포 이후에는 이전 관리 APK에 대한 업데이트 검사도 추가해야 합니다.

서명 충돌 시 기존 앱을 무조건 삭제하지 마세요. 익명 신원·방장 세션을 잃을 수 있습니다. [설치 조사·Galaxy Tab 확인](../docs/ANDROID_INSTALL.md)에 전달 파일의 정확한 지문과 증거를 기록했습니다.

## 남은 확인

Samsung 실기기, 실제 카메라·공유 대상·키보드, 운영 WebView 인증·전체 행사 흐름은 미검증입니다. HTTPS는 아직 검증된 Android App Links가 아닙니다. 도메인과 정식 서명 확정 후 assetlinks.json을 설정합니다. 푸시·오프라인 동기화·스토어 등록은 미구현입니다.
