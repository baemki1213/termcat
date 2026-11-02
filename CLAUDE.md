# termcat — CLAUDE.md

AI 터미널 세션을 감지해 macOS 메뉴바에 고양이 애니메이션을 표시하는 앱.

---

## 개발 커맨드

```bash
npm run dev           # 개발 서버 (Electron + Vite HMR)
npm run typecheck     # TypeScript 타입 검사
npm run lint          # ESLint 검사
npm run lint:fix      # ESLint 자동 수정
npm run format        # Prettier 포맷 적용
npm run format:check  # CI용 포맷 검사
npm run build         # 프로덕션 빌드
npm run build:mac     # .dmg 패키지 빌드
```

---

## 문서

| 문서 | 내용 |
|------|------|
| [기능 명세 인덱스](./docs/index.md) | 전체 기능 목록 및 아키텍처 |
| [아키텍처 원칙](./docs/conventions/architecture.md) | 단일 책임, 파일 크기, 단방향 레이어 |
| [TypeScript 컨벤션](./docs/conventions/typescript.md) | 타입, export, 에러 처리 |
| [Electron 패턴](./docs/conventions/electron.md) | IPC, 보안, Tray, 생명주기 |
| [React 컨벤션](./docs/conventions/react.md) | 컴포넌트, Zustand, 스타일링 |
| [Git 워크플로](./docs/conventions/git.md) | 브랜치, 커밋 메시지, PR |
| [네이밍 규칙](./docs/conventions/naming.md) | 파일, 변수, IPC 채널명 |
| [에러 핸들링](./docs/conventions/error-handling.md) | Error Boundary, IPC 에러, ParseError, 전역 수집 |
| [좋은 코드 원칙](./docs/conventions/code-quality.md) | 가독성·예측 가능성·응집도·결합도 |

---

## 프로젝트 구조

```
src/
  main/        Electron main process
  preload/     contextBridge 보안 브리지
  renderer/    React UI (팝업, 온보딩, 설정 창)
  cli/         node-pty 래퍼 CLI (별도 번들)
  shared/      프로세스 공통 타입 (types.ts), 역할→외모 매핑 (agent-look.ts)
docs/
  features/    기능별 명세
  conventions/ 코딩 컨벤션
resources/
  sprites/     고양이 PNG 스프라이트 (16×16, 8프레임)
```

---

## 핵심 원칙

- `any` 사용 금지 — `src/shared/types.ts` 에 공통 타입 정의
- IPC 채널명 하드코딩 금지 — `IpcChannel` 타입에서만 관리
- `export default` 금지 — named export만 사용
- `console.log` 프로덕션 코드 금지 — `electron-log` 사용
- 컴포넌트에서 `window.electron.*` 직접 호출 금지 — 훅으로 래핑

## 좋은 코드 원칙 (코드 작성 시 항상 참조)

> 전체 내용: [`docs/conventions/code-quality.md`](./docs/conventions/code-quality.md)

코드를 작성할 때 아래 네 가지 기준으로 스스로 검토한다.

**가독성** — 함수 하나에서 다루는 개념은 6~7개 이하. 복잡한 조건은 변수로 이름을 붙인다. ternary 중첩은 2단계 이하. 같은 함수 안에서 추상화 수준을 통일한다.

**예측 가능성** — 비슷한 이름의 함수는 반환 타입이 일치한다. 함수 안에 숨겨진 부작용은 이름이나 시그니처에 드러낸다.

**응집도** — 같이 변경되는 파일은 같은 디렉터리에 둔다. 매직 넘버는 이름 있는 상수로 추출한다.

**결합도** — Props Drilling은 3단계 초과 금지. 억지로 공통화해서 결합도가 높아진다면 전략적 중복을 허용한다.
