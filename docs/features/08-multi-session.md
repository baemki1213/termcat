# 기능 08 — 다중 세션 지원 (Should)

## 개요

`termcat`을 여러 터미널 탭에서 동시에 실행하면,  
메뉴바에 고양이 여러 마리가 각자 독립적인 속도로 회전한다.

---

## 유저 스토리

- 터미널 창 2개에서 각각 `termcat claude`를 실행하면 메뉴바에 고양이 2마리가 나타난다.
- 각 고양이는 해당 세션의 토큰 속도를 독립적으로 반영한다.
- 세션이 종료되면 해당 고양이만 사라진다.

---

## 구현

### 세션별 속도 → 세션별 고양이

`SessionManager.tick()` 이 세션 시작 순서대로 `{ pid, level }[]` 를 돌려주고,
`MultiTrayManager.update()` 가 그 목록 길이만큼 Tray 를 유지하며 i 번째 Tray 를 i 번째 세션의 속도로 회전시킨다.

```ts
// index.ts — 100ms 마다
trayManager.update(sessionManager.tick())
```

```ts
// multi-tray-manager.ts
const manager = createMultiTrayManager(createTray, spritesDir, catStyle)

manager.update([])                                   // 세션 0개 → idle 고양이 1마리
manager.update([{ pid: 1, level: 'fast' }])          // 1마리, fast 회전
manager.update([{ pid: 1, level: 'fast' }, { pid: 2, level: 'slow' }]) // 2마리
manager.setStyle('cat2')                             // 모든 고양이 스타일 교체 (속도 유지)
manager.destroy()                                    // 종료 시 전부 제거
```

### 슬롯 방식

- 슬롯 i 는 i 번째로 시작된 세션에 대응한다. 세션이 늘면 Tray 를 추가하고, 줄면 마지막 Tray 부터 제거한다.
- 세션이 0개여도 메뉴/팝업 진입점을 위해 idle 고양이 1마리(`MIN_TRAY_COUNT`)는 항상 남긴다.
- 레벨이 바뀐 슬롯만 `animator.setLevel()` 을 호출해 같은 속도에서 애니메이션이 리셋되지 않도록 한다.
- 모든 Tray 는 `index.ts` 의 `createTray` 팩토리로 만들어지므로, 어느 고양이를 클릭해도 팝업/컨텍스트 메뉴가 뜬다.

### 표시 모드 (`multiSessionDisplay`)

설정 창의 "여러 세션 표시" 항목으로 고른다. `electron-store` 에 저장되며 변경 즉시 반영된다.

| 값 | 동작 |
|----|------|
| `multi` (기본) | 세션마다 고양이 한 마리, 각자 자기 세션 속도로 회전 |
| `single` | 세션 수와 무관하게 한 마리만 표시, 가장 빠른 세션 속도로 회전 |

`single` 은 매니저 안에서 세션 목록을 최대 레벨 하나로 접은 뒤(`collapseToSingle`) 같은 슬롯 로직을 태운다.

### 세션별 색 (`sessionColors`)

켜면 슬롯 i 가 `SESSION_PALETTE[i % 4]` (주황·파랑·초록·분홍) 색으로 칠해진다.
스타일/색 설정이 바뀌면 `rebuildAnimators()` 가 모든 슬롯의 애니메이터를 현재 속도를 유지한 채 다시 만든다.
색칠 방식은 [기능 03](./03-tray-animation.md#세션별-색-tint) 참고.

### Tray 레퍼런스 유지

Tray 는 GC 되면 메뉴바에서 사라지므로, 매니저가 수명 동안 `slots` 배열에 레퍼런스를 유지한다.

---

## 완료 조건

- [x] 동시에 2개 세션 실행 시 고양이 2마리 표시
- [x] 각 세션의 속도가 독립적으로 반영됨
- [x] 세션 종료 시 고양이가 한 마리 줄어듦
- [x] 세션이 0개일 때 idle 고양이 1마리 유지
- [x] `single` 모드로 한 마리에 합치기 가능
- [x] `sessionColors` 로 세션마다 다른 색

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/multi-tray-manager.ts` | 세션 수만큼 Tray 생성/제거, 세션별 속도 반영, `multi`/`single` 표시 모드 |
| `src/main/session-manager.ts` | 세션별 SpeedMonitor, `tick()` 으로 세션별 레벨 반환 |
| `src/main/index.ts` | `createTray` 팩토리, 100ms 틱 연결 |
