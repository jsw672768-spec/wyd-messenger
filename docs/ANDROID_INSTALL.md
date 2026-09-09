# APK 설치 조사와 Galaxy Tab 확인

조사일: 2026-09-09. **크기가 작다는 이유만으로 손상으로 판정하지 않았습니다.** 기존 두 APK는 각각 21,543바이트의 실제 네이티브 WebView 앱입니다. ZIP CRC, DEX, resources, 바이너리 manifest, v2 서명과 정렬 검사를 통과했습니다. 네이티브 `.so`가 없어 CPU ABI 필터에 의한 설치 제한은 없습니다.

## 재현 결과

[설치 및 서명 재현 CI](https://github.com/jsw672768-spec/wyd-messenger/actions/runs/34324161522)에서 Android 8(API 26)과 Android 16(API 36)을 각각 실행했습니다.

| 항목 | API 26 | API 36 |
| --- | --- | --- |
| 기존 첫 APK 신규 설치·네이티브 실행 | 통과 | 통과 |
| 다른 CI에서 만든 두 번째 APK로 업데이트 | `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | 동일 오류 |
| 새 테스트 APK 신규 설치·네이티브 실행 | 통과 | 통과 |
| 휴대폰·태블릿 크기의 시작 화면 캡처 | 저장 | 저장 |

기존 두 APK는 같은 패키지/버전이지만 CI 실행마다 임시 디버그 키가 생성되어 서명이 달랐습니다. 이는 **업데이트 거부 원인**을 증명하며, 사용자의 Galaxy Tab에서 처음 보인 오류의 원인을 확정하지는 못합니다. 해당 기기의 모델·Android 버전·상세 설치 오류는 아직 받지 못했습니다. 기존 APK는 minSdk 26, targetSdk 35, `org.wyd.messenger.debug`, versionCode 1로 정상 선언되어 있었습니다.

## 전달한 동일 파일

| 항목 | 값 |
| --- | --- |
| 파일 | `WYD-Messenger-1.0.1-debug.apk` |
| 크기 | 22,970바이트 |
| 버전 | `1.0.1-debug` / versionCode `2` |
| 패키지 | `org.wyd.messenger.debug` |
| min / target / compile SDK | 26 / 36 / 36 |
| 서명 | RSA 2048, APK Signature Scheme v2 검증 통과 |
| 파일 SHA-256 | `7d6c8fe535681815add1ca2e4deb018af92e9b216dd450d690d77b62adf6be3e` |
| 인증서 SHA-256 | `51f0321e3f5980ec2834cf76e5ddb754557a80a7add1199f894e725ad70070e8` |

위 CI에서 설치한 동일 바이트입니다. 서버 주소를 기본 내장하지 않아 **서비스 주소 설정 화면**으로 시작합니다. 이 파일의 임시 서명키는 보존되지 않았습니다. 같은 인증서로 다음 업데이트를 서명할 수 있다고 약속하지 않습니다. 다음 배포는 영구 관리되는 키를 준비한 후 진행합니다.

기존 첫 인증서: `0b0b9c9f9353422a390c3dbcfb51b8ea3a6b3e65c179ef73026d352c5547e619`  
기존 두 번째 인증서: `f6bc6c2d18c808c50c8d94c6f92e69de51f49b40bdf6aaed16756ed3805bd731`

## 사용자가 할 최소 확인

1. 전달 APK를 다운로드해 **내 파일 → 다운로드**에서 엽니다. 이번 파일은 ZIP 안의 아티팩트가 아닌 APK 자체입니다.
2. 설치 출처 승인을 요구할 때만 파일을 연 브라우저/내 파일 앱의 해당 권한을 확인합니다. 보안 기능 전체를 끄거나 별도의 알 수 없는 설치 관리 앱을 설치하지 않습니다.
3. 설치 후 WYD를 열어 서비스 주소 설정 화면이 나오는지 확인합니다. 운영 주소가 준비되기 전에는 Codespaces를 최종 주소로 입력하지 않습니다.
4. 실패하면 **태블릿 모델명, Android 버전, 설치 오류 화면**만 전달합니다. 이미 WYD가 설치되어 있다면 삭제하지 말고 알려주세요. 삭제하면 익명 참가자·방장 세션을 잃을 수 있습니다.

운영 HTTPS 서버와 검증된 Supabase가 준비된 후 QR 카메라, 다른 기기와 공지·채팅·일정·확인을 검사합니다. APK 설치 검사만으로 이 전체 흐름이 검증된 것은 아닙니다.

## 개발 담당자용 진단

허용된 별도 테스트 기기에서 `adb install -r <APK>`의 실제 오류 코드를 수집합니다. 설치된 앱의 `pm path`로 APK를 가져와 `apksigner verify --print-certs`로 인증서를 비교합니다. 신규 설치와 업데이트, OS 버전·기존 패키지·기기 관리 제한을 구분합니다. 사용자 기기에서 `adb uninstall`을 자동 실행하지 않습니다. 저장소의 `install-smoke.sh`는 에뮬레이터임을 확인한 뒤에만 정리합니다.

근거: [apksigner](https://developer.android.com/tools/apksigner), [adb](https://developer.android.com/tools/adb), [APK v2 서명](https://source.android.com/docs/security/features/apksigning/v2).
