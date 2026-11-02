# 기능 09 — 트레이 상태 팝업 (Should)

## 개요

메뉴바 고양이를 클릭하면 현재 세션 상태 요약 팝업이 표시된다.

---

## 유저 스토리

- 고양이를 클릭하면 작은 팝업이 메뉴바 아래에 뜬다.
- 현재 속도, 세션 지속 시간, 실행 중인 명령어를 확인할 수 있다.
- 팝업 바깥을 클릭하면 닫힌다.

---

## 팝업 표시 내용

```
┌────────────────────────────┐
│  termcat                   │
├────────────────────────────┤
│  claude                    │
│  🟢 fast  •  127 chars/s   │
│  세션 시간: 12분 34초       │
├────────────────────────────┤
│  자동 시작: ✓              │
│  종료                      │
└────────────────────────────┘
```

---

## 구현

### BrowserWindow 팝업

```ts
tray.on('click', (_, bounds) => {
  if (popupWindow?.isVisible()) {
    popupWindow.hide()
    return
  }
  positionAndShow(popupWindow, bounds)
})

function positionAndShow(win: BrowserWindow, trayBounds: Electron.Rectangle): void {
  const { x, y } = calculatePosition(trayBounds, win.getBounds())
  win.setPosition(x, y)
  win.show()
  win.focus()
}
```

- `BrowserWindow` 옵션: `frame: false`, `alwaysOnTop: true`, `resizable: false`
- 포커스 잃으면 자동 닫힘: `win.on('blur', () => win.hide())`

### 위치 계산

트레이 아이콘 중앙 아래 배치:
```ts
function calculatePosition(trayBounds, winBounds) {
  return {
    x: Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2),
    y: Math.round(trayBounds.y + trayBounds.height),
  }
}
```

---

## 완료 조건

- [ ] 고양이 클릭 시 팝업이 메뉴바 아래 정확한 위치에 표시됨
- [ ] 현재 chars/sec, 속도 레벨, 세션 지속 시간이 실시간 업데이트됨
- [ ] 팝업 바깥 클릭 시 자동으로 닫힘
- [ ] 다중 세션 시 각 세션 정보가 모두 표시됨

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/popup-window.ts` | 팝업 윈도우 생성 및 위치 계산 |
| `src/renderer/src/popup/Popup.tsx` | 팝업 UI 컴포넌트 |
| `src/renderer/src/popup/AgentCard.tsx` | 서브에이전트 카드 (이름·역할 색 점·호출 빈도) — [기능 13](./13-agent-hud.md) |
