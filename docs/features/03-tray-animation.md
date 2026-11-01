# 기능 03 — 트레이 고양이 애니메이션

## 개요

macOS 메뉴바에 픽셀 아트 고양이 스프라이트를 표시하고,  
SpeedMonitor의 속도 단계(`idle / slow / mid / fast`)에 따라 프레임 교체 속도를 바꾼다.

---

## 유저 스토리

- 메뉴바에 항상 고양이가 보인다.
- AI가 토큰을 생성하면 고양이가 빠르게 뱅뱅 돈다.
- 대기 중이면 고양이가 느리게 돈다.
- 세션이 없으면 고양이가 멈춰있다.

---

## 스프라이트 스펙

| 항목 | 값 |
|------|-----|
| 형식 | PNG, 각 프레임 개별 파일 |
| 크기 | 16×16px (Retina: 32×32 `@2x`) |
| 프레임 수 | 8프레임 (1회전 = 8장) |
| 색상 모드 | 흑백 (macOS 메뉴바 자동 다크/라이트 대응) |
| 네이밍 | `cat-f01.png` ~ `cat-f08.png` |

> 스프라이트 에셋 경로: `resources/sprites/`

---

## 애니메이션 타이밍

| 단계 | 프레임 간격 | 1회전 소요 |
|------|------------|-----------|
| `idle` | — | 정지 (f01 고정) |
| `slow` | 200ms | 1.6초 |
| `mid` | 100ms | 0.8초 |
| `fast` | 40ms | 0.32초 |

---

## 구현

### TrayAnimator 클래스

```ts
class TrayAnimator {
  private frames: Electron.NativeImage[]
  private currentFrame = 0
  private timer: NodeJS.Timeout | null = null

  constructor(private tray: Tray) {
    this.frames = loadFrames() // resources/sprites/cat-f01..08.png
  }

  setLevel(level: SpeedLevel): void {
    this.stop()
    if (level === 'idle') {
      this.tray.setImage(this.frames[0])
      return
    }
    const interval = { slow: 200, mid: 100, fast: 40 }[level]
    this.timer = setInterval(() => this.tick(), interval)
  }

  private tick(): void {
    this.currentFrame = (this.currentFrame + 1) % this.frames.length
    this.tray.setImage(this.frames[this.currentFrame])
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
```

### 속도 전환 시 처리

- 레벨 전환 시 현재 프레임 위치를 유지하고 interval만 교체 (프레임 리셋 없음)
- `idle` 전환 시 f01(정면 고양이)로 즉시 리셋

---

## macOS 메뉴바 대응

- `tray.setImage(nativeImage)` 호출 시 macOS가 자동으로 다크/라이트 모드에 맞게 반전
- 이미지는 **Template Image** 형식 사용 — 파일명 접미사 `Template` 또는 `setTemplate(true)` 설정
  ```ts
  const img = nativeImage.createFromPath(path)
  img.setTemplateImage(true) // 메뉴바 색상 자동 적응
  ```

---

## 고양이 스타일

| 스타일 | 프레임 | 템플릿 | 설명 |
|--------|--------|--------|------|
| `cat` | 8 | O | 정면 실루엣, 회전 |
| `cat2` | 67 | X | 실사 풍 타이핑 고양이 (컬러) |
| `runner` | 8 | O | 옆모습 달리기 실루엣 (런캣 스타일), `runner-f01..08.png` |

## 세션별 색 (tint)

설정 `sessionColors` 가 켜지면 슬롯마다 `SESSION_PALETTE` 색을 받아 `createTrayAnimator(tray, dir, style, tint)` 로 프레임을 색칠한다.
템플릿 이미지는 메뉴바 색을 따라가므로, 색을 입힌 프레임은 템플릿 표시를 하지 않는다.

| 스프라이트 | 방식 |
|-----------|------|
| 실루엣 (`cat`, `runner`) | `fill` — 불투명 픽셀을 색으로 채움 |
| 사진형 (`cat2`) | `duotone` — 밝기를 유지하고 검정→색→흰색으로 재색칠 |

구현: `src/main/sprite-tint.ts` (`tintBgra` 순수 함수 + `tintImage`).

---

## 완료 조건

- [ ] 8프레임 스프라이트가 메뉴바에 정상 표시됨
- [ ] 각 속도 단계에서 올바른 interval로 회전함
- [ ] `idle` 시 첫 프레임 고정, 애니메이션 없음
- [ ] 다크/라이트 모드 전환 시 고양이 색상이 자동 대응됨
- [ ] 레벨 전환이 즉각 반영됨 (다음 tick 기다리지 않음)

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/tray-animator.ts` | TrayAnimator 클래스, 스타일별 프레임 설정 |
| `src/main/sprite-tint.ts` | 세션별 색 입히기 |
| `resources/sprites/` | PNG 스프라이트 에셋 |
| `src/shared/types.ts` | `SpeedLevel` 타입 |
