import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@renderer/components/index'
import { createLogger } from '@renderer/logger'
import { type AIShortcut, type CatStyle, type MultiSessionDisplay } from '@shared/types'

import * as s from './Settings.css'
import { useSettingsStore } from './useSettingsStore'

const log = createLogger('settings')

const SMOOTHING_OPTIONS = [1, 2, 3, 5, 8]

type TooltipPlacement = 'top' | 'right'

function Tooltip({
  text,
  placement = 'top',
}: {
  text: string
  placement?: TooltipPlacement
}): JSX.Element {
  const [pos, setPos] = useState<CSSProperties | null>(null)
  const iconRef = useRef<HTMLSpanElement>(null)

  function handleMouseEnter(): void {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    if (placement === 'right') {
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 6 })
    } else {
      setPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left + rect.width / 2 })
    }
  }

  return (
    <span className={s.tooltipWrapper}>
      <span
        ref={iconRef}
        className={s.tooltipIcon}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setPos(null)}
      >
        ⓘ
      </span>
      {pos !== null &&
        createPortal(
          <span className={placement === 'right' ? s.tooltipBoxRight : s.tooltipBox} style={pos}>
            {text}
          </span>,
          document.body
        )}
    </span>
  )
}

interface DraftState {
  id: string
  name: string
  command: string
}

interface ShortcutCardProps {
  shortcut: AIShortcut
  onEdit: () => void
  onDelete: () => Promise<void>
}

function ShortcutCard({ shortcut, onEdit, onDelete }: ShortcutCardProps): JSX.Element {
  return (
    <div className={s.card}>
      <div className={s.cardRow}>
        <p className={s.cardName}>{shortcut.name}</p>
        <div className={s.cardActions}>
          <Button variant="ghost" onClick={onEdit}>
            편집
          </Button>
          <Button variant="ghost" onClick={onDelete}>
            삭제
          </Button>
        </div>
      </div>
      <p className={s.cardCommand}>{shortcut.command}</p>
    </div>
  )
}

interface ShortcutFormProps {
  draft: DraftState
  onChange: (draft: DraftState) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

function ShortcutForm({
  draft,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: ShortcutFormProps): JSX.Element {
  const isValid = draft.name.trim().length > 0 && draft.command.trim().length > 0

  return (
    <div className={s.form}>
      <div className={s.formRow}>
        <p className={s.label}>이름</p>
        <input
          className={s.input}
          placeholder="그냥 클로드 키기"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </div>
      <div className={s.formRow}>
        <p className={s.label}>명령어</p>
        <input
          className={s.input}
          placeholder="claude --dangerously-skip-permissions"
          value={draft.command}
          onChange={(e) => onChange({ ...draft, command: e.target.value })}
        />
      </div>
      <div className={s.formActions}>
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" disabled={!isValid || isSaving} onClick={onSave}>
          저장
        </Button>
      </div>
    </div>
  )
}

const CAT_STYLE_LABELS: Record<CatStyle, { name: string; desc: string }> = {
  cat: { name: '픽셀 고양이', desc: '기본 스프라이트' },
  cat2: { name: '타이핑 고양이', desc: '실사 스타일, 67프레임' },
  runner: { name: '달리는 고양이', desc: '옆모습 8프레임, 런캣 스타일' },
}

function CatStyleForm(): JSX.Element {
  const selected = useSettingsStore((state) => state.catStyle)
  const setCatStyle = useSettingsStore((state) => state.setCatStyle)

  return (
    <div className={s.section}>
      <p className={s.sectionTitle}>고양이 스타일</p>
      <div className={s.styleOptions}>
        {(Object.keys(CAT_STYLE_LABELS) as CatStyle[]).map((style) => {
          const { name, desc } = CAT_STYLE_LABELS[style]
          const isActive = selected === style
          return (
            <button
              key={style}
              className={isActive ? s.styleOptionActive : s.styleOption}
              onClick={() => void setCatStyle(style)}
            >
              <p className={s.styleOptionName}>{name}</p>
              <p className={s.styleOptionDesc}>{desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const MULTI_SESSION_DISPLAY_LABELS: Record<MultiSessionDisplay, { name: string; desc: string }> = {
  multi: { name: '세션마다 한 마리', desc: '세션 수만큼 고양이가 각자 속도로 회전' },
  single: { name: '한 마리로 합치기', desc: '가장 빠른 세션 속도로 한 마리만 표시' },
}

function MultiSessionDisplayForm(): JSX.Element {
  const selected = useSettingsStore((state) => state.multiSessionDisplay)
  const setDisplay = useSettingsStore((state) => state.setMultiSessionDisplay)

  return (
    <div className={s.section}>
      <p className={s.sectionTitle}>여러 세션 표시</p>
      <div className={s.styleOptions}>
        {(Object.keys(MULTI_SESSION_DISPLAY_LABELS) as MultiSessionDisplay[]).map((display) => {
          const { name, desc } = MULTI_SESSION_DISPLAY_LABELS[display]
          const isActive = selected === display
          return (
            <button
              key={display}
              className={isActive ? s.styleOptionActive : s.styleOption}
              onClick={() => void setDisplay(display)}
            >
              <p className={s.styleOptionName}>{name}</p>
              <p className={s.styleOptionDesc}>{desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const SESSION_COLORS_LABELS: Array<{ value: boolean; name: string; desc: string }> = [
  { value: false, name: '끄기', desc: '메뉴바 색을 따라가는 기본 색' },
  { value: true, name: '켜기', desc: '세션마다 주황·파랑·초록·분홍 순으로 구분' },
]

function SessionColorsForm(): JSX.Element {
  const enabled = useSettingsStore((state) => state.sessionColors)
  const setSessionColors = useSettingsStore((state) => state.setSessionColors)

  return (
    <div className={s.section}>
      <p className={s.sectionTitle}>세션별 색 구분</p>
      <div className={s.styleOptions}>
        {SESSION_COLORS_LABELS.map(({ value, name, desc }) => {
          const isActive = enabled === value
          return (
            <button
              key={String(value)}
              className={isActive ? s.styleOptionActive : s.styleOption}
              onClick={() => void setSessionColors(value)}
            >
              <p className={s.styleOptionName}>{name}</p>
              <p className={s.styleOptionDesc}>{desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const AGENT_HUD_LABELS: Array<{ value: boolean; name: string; desc: string }> = [
  { value: true, name: '켜기', desc: 'Claude Code 서브에이전트마다 역할 색의 고양이 추가' },
  { value: false, name: '끄기', desc: '터미널 세션 고양이만 표시' },
]

function AgentHudForm(): JSX.Element {
  const enabled = useSettingsStore((state) => state.agentHud)
  const setAgentHud = useSettingsStore((state) => state.setAgentHud)

  return (
    <div className={s.section}>
      <p className={s.sectionTitle}>에이전트 HUD</p>
      <div className={s.styleOptions}>
        {AGENT_HUD_LABELS.map(({ value, name, desc }) => {
          const isActive = enabled === value
          return (
            <button
              key={String(value)}
              className={isActive ? s.styleOptionActive : s.styleOption}
              onClick={() => void setAgentHud(value)}
            >
              <p className={s.styleOptionName}>{name}</p>
              <p className={s.styleOptionDesc}>{desc}</p>
            </button>
          )
        })}
      </div>
      <p className={s.sectionHint}>
        트레이 메뉴의 &quot;Claude Code 훅 설치&quot; 또는 <code>termcat hooks install</code> 이
        필요합니다.
      </p>
    </div>
  )
}

function ThresholdsForm(): JSX.Element {
  const thresholds = useSettingsStore((state) => state.thresholds)
  const setThresholds = useSettingsStore((state) => state.setThresholds)

  function handleSlowChange(raw: number): void {
    const slow = Math.min(raw, thresholds.mid - 1)
    setThresholds({ ...thresholds, slow })
  }

  function handleMidChange(raw: number): void {
    const mid = Math.max(raw, thresholds.slow + 1)
    setThresholds({ ...thresholds, mid })
  }

  function handleSmoothingChange(smoothingTicks: number): void {
    setThresholds({ ...thresholds, smoothingTicks })
  }

  return (
    <div className={s.section}>
      <p className={s.sectionTitle}>속도 감지 설정</p>

      <div className={s.sliderRow}>
        <div className={s.sliderHeader}>
          <div className={s.labelRow}>
            <p className={s.label}>느림 감지 (chars/s)</p>
            <Tooltip text="이 값 이하면 고양이가 천천히 걸어요" />
          </div>
          <p className={s.sliderValue}>{thresholds.slow}</p>
        </div>
        <input
          className={s.slider}
          type="range"
          min={1}
          max={thresholds.mid - 1}
          value={thresholds.slow}
          onChange={(e) => handleSlowChange(Number(e.target.value))}
        />
      </div>

      <div className={s.sliderRow}>
        <div className={s.sliderHeader}>
          <div className={s.labelRow}>
            <p className={s.label}>빠름 감지 (chars/s)</p>
            <Tooltip text="이 값 이하면 보통 속도, 초과하면 고양이가 달려요" />
          </div>
          <p className={s.sliderValue}>{thresholds.mid}</p>
        </div>
        <input
          className={s.slider}
          type="range"
          min={thresholds.slow + 1}
          max={500}
          value={thresholds.mid}
          onChange={(e) => handleMidChange(Number(e.target.value))}
        />
      </div>

      <div className={s.selectRow}>
        <div className={s.labelRow}>
          <p className={s.label}>반응 민감도</p>
          <Tooltip text="숫자가 클수록 속도 변화에 더 느리게 반응해요" placement="right" />
        </div>
        <select
          className={s.select}
          value={thresholds.smoothingTicks}
          onChange={(e) => handleSmoothingChange(Number(e.target.value))}
        >
          {SMOOTHING_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}틱
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function Settings(): JSX.Element {
  const shortcuts = useSettingsStore((state) => state.shortcuts)
  const saveShortcut = useSettingsStore((state) => state.saveShortcut)
  const deleteShortcut = useSettingsStore((state) => state.deleteShortcut)
  const load = useSettingsStore((state) => state.load)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState>({ id: '', name: '', command: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    void load()
  }, [load])

  function startAdd(): void {
    setEditingId('')
    setDraft({ id: '', name: '', command: '' })
  }

  function startEdit(shortcut: AIShortcut): void {
    setEditingId(shortcut.id)
    setDraft({ id: shortcut.id, name: shortcut.name, command: shortcut.command })
  }

  function cancelEdit(): void {
    setEditingId(null)
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true)
    try {
      const shortcut: AIShortcut = {
        id: draft.id || crypto.randomUUID(),
        name: draft.name.trim(),
        command: draft.command.trim(),
      }
      await saveShortcut(shortcut)
      setEditingId(null)
    } catch (err) {
      log.error('failed to save shortcut', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    await deleteShortcut(id)
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <p className={s.title}>AI 실행하기</p>
      </div>

      <div className={s.list}>
        {shortcuts.length === 0 && editingId === null && (
          <p className={s.empty}>아직 설정된 숏컷이 없어요</p>
        )}

        {shortcuts.map((shortcut) =>
          editingId === shortcut.id ? (
            <ShortcutForm
              key={shortcut.id}
              draft={draft}
              onChange={setDraft}
              onSave={handleSave}
              onCancel={cancelEdit}
              isSaving={isSaving}
            />
          ) : (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut}
              onEdit={() => startEdit(shortcut)}
              onDelete={() =>
                handleDelete(shortcut.id).catch((err) =>
                  log.error('failed to delete shortcut', err)
                )
              }
            />
          )
        )}

        {editingId === '' && (
          <ShortcutForm
            draft={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={cancelEdit}
            isSaving={isSaving}
          />
        )}
      </div>

      {editingId === null && (
        <Button variant="secondary" onClick={startAdd}>
          + 숏컷 추가
        </Button>
      )}

      <div className={s.divider} />

      <CatStyleForm />

      <div className={s.divider} />

      <MultiSessionDisplayForm />

      <div className={s.divider} />

      <SessionColorsForm />

      <div className={s.divider} />

      <AgentHudForm />

      <div className={s.divider} />

      <ThresholdsForm />
    </div>
  )
}
