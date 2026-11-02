import { style } from '@vanilla-extract/css'

import { vars } from '@renderer/styles/tokens.css'

export const container = style({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg.surface,
  boxSizing: 'border-box',
  overflow: 'hidden',
})

export const header = style({
  padding: `${vars.space['3']} ${vars.space['4']}`,
  borderBottom: `1px solid ${vars.color.border.default}`,
  flexShrink: 0,
})

export const appName = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const sessionList = style({
  flex: 1,
  overflowY: 'auto',
})

export const sessionItem = style({
  padding: `${vars.space['3']} ${vars.space['4']}`,
  borderBottom: `1px solid ${vars.color.border.default}`,
})

export const sessionCommand = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: `0 0 ${vars.space['1']} 0`,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const sessionMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space['2'],
  marginBottom: vars.space['1'],
})

export const speedBadge = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  padding: `1px ${vars.space['2']}`,
  borderRadius: vars.radius.sm,
})

export const cps = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontFamily: 'monospace',
})

export const duration = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const tokenSection = style({
  marginTop: vars.space['2'],
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
})

export const tokenRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const tokenLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const tokenValue = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontFamily: 'monospace',
})

export const contextBar = style({
  marginTop: vars.space['1'],
  height: '3px',
  borderRadius: '2px',
  background: vars.color.border.default,
  overflow: 'hidden',
})

export const contextBarFill = style({
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s ease',
})

export const listHeading = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.muted,
  margin: 0,
  padding: `${vars.space['2']} ${vars.space['4']} 0`,
})

export const agentHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space['2'],
})

export const agentDot = style({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
  marginBottom: vars.space['1'],
})

export const agentRole = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontFamily: 'monospace',
})

export const emptyState = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space['6'],
})

export const emptyText = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  textAlign: 'center',
})

export const footer = style({
  padding: `${vars.space['2']} ${vars.space['4']}`,
  borderTop: `1px solid ${vars.color.border.default}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
})

export const footerLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const quitButton = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: `${vars.space['1']} ${vars.space['2']}`,
  borderRadius: vars.radius.sm,
  selectors: {
    '&:hover': {
      background: vars.color.border.default,
    },
  },
})
