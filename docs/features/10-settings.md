# 기능 10 — 설정 커스터마이즈 (Should)

## 개요

속도 단계 임계값, 고양이 색상 등 사용자가 조절할 수 있는 설정을 제공한다.

---

## 설정 항목

| 키 | 타입 | 기본값 | 설명 |
|----|------|--------|------|
| `thresholds.slow` | number | 10 | slow → mid 전환 chars/sec |
| `thresholds.mid` | number | 80 | mid → fast 전환 chars/sec |
| `thresholds.smoothingTicks` | number | 3 | 레벨 전환 스무딩 tick 수 |
| `catStyle` | `'cat' \| 'cat2' \| 'runner'` | `'cat'` | 고양이 스프라이트 스타일 |
| `multiSessionDisplay` | `'multi' \| 'single'` | `'multi'` | 여러 세션일 때 고양이를 세션마다 / 한 마리로 표시 |
| `sessionColors` | boolean | false | 세션(슬롯)마다 다른 색으로 고양이 칠하기 |
| `openAtLogin` | boolean | true | 로그인 시 자동 시작 |
| `onboardingDone` | boolean | false | 온보딩 완료 여부 |

---

## 저장소

`electron-store` 사용 — `~/Library/Application Support/termcat/config.json`

```ts
import Store from 'electron-store'

const store = new Store<AppSettings>({
  defaults: {
    thresholds: { slow: 10, mid: 80, smoothingTicks: 3 },
    cat: { color: 'default' },
    openAtLogin: true,
    onboardingDone: false,
  },
})
```

---

## 설정 UI

트레이 메뉴 → "설정..." 클릭 시 설정 윈도우 표시.

| 항목 | UI 요소 |
|------|---------|
| 속도 임계값 | 슬라이더 (slow: 1~50, mid: 20~200) |
| 스무딩 tick | 드롭다운 (1 / 3 / 5) |
| 고양이 스타일 | 버튼 그룹 (픽셀 / 타이핑 / 달리기) |
| 여러 세션 표시 | 버튼 그룹 (세션마다 한 마리 / 한 마리로 합치기) |
| 세션별 색 구분 | 버튼 그룹 (끄기 / 켜기) |

---

## 완료 조건

- [ ] 설정이 앱 재시작 후에도 유지됨
- [ ] 속도 임계값 변경 시 즉시 SpeedMonitor에 반영됨
- [ ] 설정 초기화(기본값으로 되돌리기) 버튼 동작
- [ ] 잘못된 값(slow > mid 등) 입력 시 유효성 검사

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/store.ts` | electron-store 초기화 및 타입 |
| `src/renderer/src/Settings.tsx` | 설정 UI 컴포넌트 |
| `src/shared/types.ts` | `AppSettings` 타입 |
