# 기능 13 — 서브에이전트 HUD (Should)

## 개요

Claude Code 세션 안에서 도는 **서브에이전트**(Explore, Plan, general-purpose, 플러그인 에이전트 …)마다
메뉴바에 고양이 한 마리가 더 생긴다. 역할에 따라 색과 스타일이 다르고, 아이콘 옆에 이름이 붙는다.
사람은 메뉴바에서, 에이전트는 `termcat status` 로 "지금 누가 뭘 하고 있는지" 본다.

---

## 유저 스토리

- 메인 세션이 서브에이전트 세 개를 띄우면 메뉴바에 고양이 세 마리가 추가되고, 각자 자기 활동량으로 움직인다.
- Explore 는 파란 고양이, Plan 은 초록 고양이, general-purpose 는 주황 달리는 고양이 — 역할이 한눈에 구분된다.
- 고양이 옆에 에이전트 이름(Agent 도구 호출의 description)이 짧게 붙고, 팝업에서 역할·호출 빈도·세션을 본다.
- 서브에이전트가 끝나면 그 고양이만 사라진다.
- 서브에이전트 스스로도 `termcat status` 로 다른 에이전트 현황을 읽을 수 있다. 시작할 때 자기 고양이 색을 안내받는다.

---

## 동작 원리

서브에이전트는 메인 Claude Code 프로세스 안에서 돌기 때문에 터미널 출력이 따로 없다.
그래서 PTY 속도 대신 **Claude Code 훅**으로 이벤트를 받고, 속도는 **도구 호출 빈도**로 잰다.

```
Claude Code ──(hook stdin JSON)──▶ termcat hook ──(소켓)──▶ AgentRegistry ──▶ HudComposer ──▶ Tray
                                                  ◀─(status:get)── termcat status
```

| Claude Code 훅 | termcat 이벤트 | 쓰임 |
|----------------|----------------|------|
| `PreToolUse` (matcher `Agent`) | `agent:intent` | Agent 도구의 `description` 을 이름 후보로 저장 |
| `SubagentStart` | `agent:start` | 고양이 추가. 같은 세션·역할의 intent 를 FIFO 로 가져가 이름으로 씀 |
| `PostToolUse` (`agent_id` 있을 때) | `agent:activity` | 도구 호출 1회 기록 |
| `SubagentStop` | `agent:stop` | 고양이 제거 |
| `SessionEnd` | `agent:session-end` | 그 세션의 에이전트 전부 제거 |

`SubagentStart` 에는 `description` 이 없고 `PreToolUse(Agent)` 에는 `agent_id` 가 없어서 둘을 세션+역할로 짝짓는다.
짝이 없으면 이름은 역할(`agent_type`)이 된다.

### 활동량 → 속도 (`agent-activity.ts`)

최근 15초 안의 도구 호출 수로 정한다.

| 호출 수 | 레벨 |
|---------|------|
| 0 | idle |
| 1–2 | slow |
| 3–5 | mid |
| 6+ | fast |

막 시작한 에이전트는 호출 전이라도 한 번 기록해 바로 움직이게 한다.
`SubagentStop` 을 놓쳤을 때를 대비해 10분간 활동이 없으면 지운다(`AGENT_STALE_MS`).

### 외모 (`src/shared/agent-look.ts`)

역할마다 `{ color, style }` 을 결정적으로 고른다. 색 이름은 Claude Code 에이전트 frontmatter `color` 와 같은 8색 체계다.

| 역할 | 색 | 스타일 |
|------|----|--------|
| `Explore` | blue | cat |
| `Plan` | green | cat |
| `general-purpose` | orange | runner |
| `claude-code-guide` | purple | cat |
| `fork` | cyan | runner |
| 그 외 | 이름 해시로 8색 중 하나 | runner |

CLI(`termcat hook` 의 안내 문구)와 main(트레이), renderer(팝업)가 모두 같은 함수를 써서 표현이 어긋나지 않는다.

### 고양이 목록 합성 (`hud-composer.ts`)

세션 고양이(앞) + 에이전트 고양이(뒤)를 `HudEntry[]` 로 만든다. `MultiTrayManager` 는 이 목록만 그린다.

- 에이전트 entry: `style/tint` = 역할 외모, `title` = 이름 앞 10자, `tooltip` = `이름 · 역할`
- `agentHud` 설정이 꺼지면 에이전트 entry 를 빼고, `single` 모드면 전부 한 마리로 접는다.
- 비어 있으면 idle 한 마리를 돌려준다(메뉴/팝업 진입점).

### 에이전트가 보는 쪽

- `termcat status [--json]` — 소켓에 `status:get` 을 보내고 `StatusReport` 를 받아 출력한다.
- `SubagentStart` 훅의 `additionalContext` 로 서브에이전트에게 "너는 파란 고양이다, `termcat status` 로 다른 에이전트를 봐라" 를 알려준다 (앱이 켜져 있을 때만).

---

## 훅 설치

`~/.claude/settings.json` 에 다섯 이벤트의 훅을 넣는다. 둘 중 하나:

- 트레이 메뉴 → "Claude Code 에이전트 HUD 훅 설치" 체크
- `termcat hooks install` / `termcat hooks uninstall`

커맨드는 절대 경로(`env ELECTRON_RUN_AS_NODE=1 TERMCAT_HOOK=1 "<electron>" "<cli>" hook`)라 PATH/alias 와 무관하다.
`TERMCAT_HOOK=1` 표식으로 termcat 훅만 골라 제거·갱신하므로 다른 훅(Orca 등)은 건드리지 않는다.

`termcat hook` 은 항상 exit 0 이고, 앱이 꺼져 있으면 `{}` 만 출력하고 끝나 Claude Code 를 막지 않는다. 기동 비용 약 65ms.
훅 경로에서는 node-pty 를 로드하지 않는다(`pty-wrapper` 는 래퍼 모드에서만 동적 import).

---

## 완료 조건

- [x] `SubagentStart`/`SubagentStop` 에 맞춰 고양이가 늘고 준다
- [x] 역할별로 색·스타일이 다르고 결정적이다
- [x] 이름(description)이 아이콘 옆 제목과 팝업에 보인다
- [x] 도구 호출 빈도로 속도가 바뀐다
- [x] `termcat status` 로 세션·에이전트 현황을 읽을 수 있다
- [x] 훅 설치/제거가 다른 훅을 보존한다
- [x] `agentHud` 설정으로 끌 수 있다
- [ ] 실제 메뉴바에서 제목(`tray.setTitle`)·색 렌더링 확인 (이 세션에서 Electron 실행 불가로 미검증)

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/cli/hook-command.ts` | 훅 stdin → `AgentEvent`, `additionalContext` 응답 |
| `src/cli/status-command.ts` | `termcat status` |
| `src/cli/claude-hooks.ts` | `~/.claude/settings.json` 훅 설치/제거 (순수 merge 함수 + fs) |
| `src/main/agent-registry.ts` | 에이전트 수명·이름 짝짓기·stale 정리 |
| `src/main/agent-activity.ts` | 도구 호출 빈도 → 속도 |
| `src/main/hud-composer.ts` | 세션 + 에이전트 → `HudEntry[]` |
| `src/main/multi-tray-manager.ts` | `HudEntry[]` 를 Tray 로 그림 (외모 바뀐 슬롯만 재생성) |
| `src/shared/agent-look.ts` | 역할 → 색/스타일 |
| `src/renderer/src/popup/AgentCard.tsx` | 팝업의 에이전트 카드 |
