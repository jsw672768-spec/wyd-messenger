# WYD Messenger

2027 WYD 참가자가 QR로 행사에 참여하고, 선택한 언어로 공지·일정·채팅을 확인하는 프로젝트입니다. 기존 Next.js/React/Supabase 웹앱은 `my-app`, Android 앱은 `android-app`에 있습니다.

통합 작업은 [PR #3](https://github.com/jsw672768-spec/wyd-messenger/pull/3)입니다. 기존 PR #1·#2의 기능과 디자인을 포함합니다. 아직 운영 데이터베이스에 연결하거나 참가자에게 공개 배포하지 않았습니다.

- [검증 결과와 남은 작업](docs/VERIFICATION.md)
- [APK 설치 조사·갤럭시탭 확인 절차](docs/ANDROID_INSTALL.md)
- [기존 Supabase 보존·이전 계획](docs/SUPABASE_ROLLOUT.md)
- [운영·비용·개인정보 정책안](docs/OPERATIONS.md)
- [웹 실행](my-app/README.md) · [Android 빌드·서명](android-app/README.md)

`supabase/migrations`는 **새로운 격리 검증 프로젝트용**입니다. 기존 프로젝트에 바로 적용하지 마세요. 기존 `events` 테이블이 있으면 첫 마이그레이션이 중단됩니다. 실제 운영 스키마를 확인한 뒤 별도 이전안을 작성해야 합니다.
