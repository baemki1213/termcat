# termcat — 기능 명세 인덱스

AI 터미널 세션을 감지하여 시스템 트레이에 고양이 애니메이션을 표시하는 macOS 메뉴바 앱.

---

## 기능 목록

### 🔴 Must

| # | 기능 | 파일 | 상태 |
|---|------|------|------|
| 01 | [PTY 래퍼 CLI](./features/01-pty-wrapper.md) | `termcat <command>` 실행 진입점 | ✅ |
| 02 | [chars/sec 측정 & 속도 분류](./features/02-speed-measurement.md) | 슬라이딩 윈도우 기반 출력 속도 계산 | ✅ |
| 03 | [트레이 고양이 애니메이션](./features/03-tray-animation.md) | 픽셀 아트 스프라이트 회전 애니메이션 | ✅ |
| 04 | [세션 라이프사이클 관리](./features/04-session-lifecycle.md) | 세션 시작/종료/상태 전이 | ✅ |
| 05 | [로그인 시 자동 시작](./features/05-auto-launch.md) | macOS 로그인 항목 등록 | ✅ |
| 06 | [첫 실행 온보딩](./features/06-onboarding.md) | shell alias 안내 및 자동 등록 | ✅ |
| 07 | [빌드 & 배포](./features/07-build-distribution.md) | `.dmg` 패키지 빌드 파이프라인 | ✅ |

### 🟡 Should

| # | 기능 | 파일 | 상태 |
|---|------|------|------|
| 08 | [다중 세션 지원](./features/08-multi-session.md) | 세션 수만큼 고양이 표시, 세션별 속도 반영 | ✅ |
| 09 | [트레이 상태 팝업](./features/09-status-popup.md) | 클릭 시 세션 요약 UI | ✅ |
| 10 | [설정 커스터마이즈](./features/10-settings.md) | 속도 임계값, 고양이 색상 등 | ✅ |
| 11 | 앱 아이콘 | DMG / 앱 번들 아이콘 (`resources/icon.icns`) | ✅ |
| 12 | AI 런처 숏컷 | 트레이 메뉴에서 AI 명령어 바로 실행, 설정 창에서 커스텀 숏컷 CRUD | ✅ |

---

## 아키텍처 요약

```
사용자 터미널
    │
    ▼
termcat PTY 래퍼 (Node.js CLI)   ──▶  AI CLI (claude / chatgpt / gemini ...)
    │                                        │
    │            ◀──── 스트리밍 출력 ────────┘
    │
    ▼
SpeedMonitor (chars/sec 측정)
    │
    ▼
IPC → Electron main process
    │
    ▼
TrayAnimator (고양이 아이콘 교체)
```

## 컨벤션 문서

| 문서 | 내용 |
|------|------|
| [아키텍처](./conventions/architecture.md) | 단일 책임, 파일 크기, 단방향 레이어 |
| [TypeScript](./conventions/typescript.md) | 타입 선언, export 규칙, 에러 처리 |
| [Electron](./conventions/electron.md) | IPC 패턴, 보안 설정, Tray 관리 |
| [React](./conventions/react.md) | 컴포넌트 구조, Zustand, vanilla-extract |
| [Git](./conventions/git.md) | 브랜치 전략, 커밋 메시지, PR 규칙 |
| [네이밍](./conventions/naming.md) | 파일, 변수, IPC 채널명 규칙 |
| [에러 핸들링](./conventions/error-handling.md) | Error Boundary, IPC 에러, ParseError, 전역 수집 |

---

## 프로세스 경계

| 프로세스 | 역할 |
|---------|------|
| **CLI 프로세스** (Node.js) | PTY 생성, 출력 가로채기, chars/sec 계산, IPC 송신 |
| **Electron main** | Tray 관리, IPC 수신, 애니메이션 타이머, 앱 생명주기 |
| **Electron renderer** | (선택적) 세션 상태 팝업 UI |
