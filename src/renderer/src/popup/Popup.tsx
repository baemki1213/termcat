import { useEffect, useState } from 'react'

import { createLogger } from '@renderer/logger'
import type { PopupState, SessionSnapshot } from '@shared/types'

import { AgentCard } from './AgentCard'
import { formatDuration, formatTokens, SPEED_COLORS, SPEED_LABEL } from './format'
import * as s from './Popup.css'

const log = createLogger('popup')

const POLL_MS = 500

const EMPTY_STATE: PopupState = { sessions: [], agents: [], openAtLogin: false }

function SessionCard({ session }: { session: SessionSnapshot }): JSX.Element {
  const colors = SPEED_COLORS[session.speedLevel]
  const tokens = session.tokens

  return (
    <div className={s.sessionItem}>
      <p className={s.sessionCommand}>{session.command}</p>

      <div className={s.sessionMeta}>
        <span className={s.speedBadge} style={{ background: colors.bg, color: colors.fg }}>
          {SPEED_LABEL[session.speedLevel]}
        </span>
        <span className={s.cps}>{Math.round(session.cps)} chars/s</span>
      </div>

      <p className={s.duration}>세션 시간: {formatDuration(session.startedAt)}</p>

      {tokens !== null && (
        <div className={s.tokenSection}>
          {tokens.model != null && (
            <div className={s.tokenRow}>
              <span className={s.tokenLabel}>모델</span>
              <span className={s.tokenValue}>{tokens.model}</span>
            </div>
          )}
          {tokens.inputTokens !== undefined && (
            <div className={s.tokenRow}>
              <span className={s.tokenLabel}>입력 토큰</span>
              <span className={s.tokenValue}>{formatTokens(tokens.inputTokens)}</span>
            </div>
          )}
          {tokens.outputTokens !== undefined && (
            <div className={s.tokenRow}>
              <span className={s.tokenLabel}>출력 토큰</span>
              <span className={s.tokenValue}>{formatTokens(tokens.outputTokens)}</span>
            </div>
          )}
          {tokens.contextWindowSize !== undefined &&
            tokens.contextWindowSize > 0 &&
            tokens.contextUsedPercent !== undefined && (
              <>
                <div className={s.tokenRow}>
                  <span className={s.tokenLabel}>컨텍스트</span>
                  <span className={s.tokenValue}>
                    {tokens.contextUsedPercent.toFixed(1)}% /{' '}
                    {formatTokens(tokens.contextWindowSize)}
                  </span>
                </div>
                <div className={s.contextBar}>
                  <div
                    className={s.contextBarFill}
                    style={{
                      width: `${tokens.contextUsedPercent}%`,
                      background: tokens.contextUsedPercent > 80 ? '#dc2626' : '#4ade80',
                    }}
                  />
                </div>
              </>
            )}
        </div>
      )}
    </div>
  )
}

export function Popup(): JSX.Element {
  const [state, setState] = useState<PopupState>(EMPTY_STATE)

  useEffect(() => {
    function poll(): void {
      window.popup
        .getState()
        .then(setState)
        .catch((err) => log.error('failed to get popup state', err))
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={s.container}>
      <div className={s.header}>
        <p className={s.appName}>termcat</p>
      </div>

      {state.sessions.length === 0 && state.agents.length === 0 ? (
        <div className={s.emptyState}>
          <p className={s.emptyText}>실행 중인 세션이 없어요</p>
        </div>
      ) : (
        <div className={s.sessionList}>
          {state.sessions.map((session) => (
            <SessionCard key={session.pid} session={session} />
          ))}
          {state.agents.length > 0 && <p className={s.listHeading}>에이전트</p>}
          {state.agents.map((agent) => (
            <AgentCard key={agent.key} agent={agent} />
          ))}
        </div>
      )}

      <div className={s.footer}>
        <span className={s.footerLabel}>자동 시작: {state.openAtLogin ? '✓' : '✗'}</span>
        <button
          className={s.quitButton}
          onClick={() => window.popup.quit().catch((err) => log.error('quit failed', err))}
        >
          종료
        </button>
      </div>
    </div>
  )
}
