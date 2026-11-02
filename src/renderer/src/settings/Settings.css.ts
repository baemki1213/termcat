import { style } from '@vanilla-extract/css'

import { vars } from '@renderer/styles/tokens.css'

export const container = style({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  padding: vars.space['6'],
  paddingTop: '44px',
  gap: vars.space['4'],
  boxSizing: 'border-box',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const title = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['2'],
  flex: 1,
  overflowY: 'auto',
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
  padding: vars.space['3'],
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.default}`,
  background: vars.color.bg.surface,
})

export const cardRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const cardName = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const cardCommand = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
  fontFamily: 'monospace',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const cardActions = style({
  display: 'flex',
  gap: vars.space['1'],
  flexShrink: 0,
})

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['2'],
  padding: vars.space['3'],
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.default}`,
  background: vars.color.bg.overlay,
})

export const formRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
})

export const label = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  margin: 0,
})

export const input = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.sans,
  color: vars.color.text.primary,
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.sm,
  padding: `${vars.space['1']} ${vars.space['2']}`,
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: vars.color.text.secondary,
    },
  },
})

export const formActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space['2'],
  marginTop: vars.space['1'],
})

export const empty = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  textAlign: 'center',
  padding: vars.space['4'],
})

export const divider = style({
  height: '1px',
  background: vars.color.border.default,
  margin: `${vars.space['2']} 0`,
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['3'],
})

export const sectionTitle = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const sectionHint = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  margin: 0,
})

export const sliderRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
})

export const sliderHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const labelRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space['1'],
})

export const sliderValue = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontFamily: 'monospace',
  margin: 0,
})

export const slider = style({
  width: '100%',
  accentColor: vars.color.text.primary,
  cursor: 'pointer',
})

export const selectRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
})

export const select = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.sans,
  color: vars.color.text.primary,
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.sm,
  padding: `${vars.space['1']} ${vars.space['2']}`,
  outline: 'none',
  cursor: 'pointer',
})

export const styleOptions = style({
  display: 'flex',
  gap: vars.space['2'],
})

const styleOptionBase = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: vars.space['1'],
  flex: 1,
  padding: vars.space['3'],
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.default}`,
  background: vars.color.bg.surface,
  textAlign: 'left' as const,
  cursor: 'pointer',
}

export const styleOption = style({
  ...styleOptionBase,
  selectors: {
    '&:hover': {
      borderColor: vars.color.text.secondary,
    },
  },
})

export const styleOptionActive = style({
  ...styleOptionBase,
  borderColor: vars.color.text.primary,
  background: vars.color.bg.overlay,
})

export const styleOptionName = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const styleOptionDesc = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
  margin: 0,
})

export const tooltipWrapper = style({
  display: 'inline-flex',
  alignItems: 'center',
})

export const tooltipIcon = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
  cursor: 'help',
  userSelect: 'none',
})

const tooltipBase = {
  position: 'fixed' as const,
  zIndex: 9999,
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space['1']} ${vars.space['2']}`,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  whiteSpace: 'nowrap' as const,
  pointerEvents: 'none' as const,
}

export const tooltipBox = style({
  ...tooltipBase,
  transform: 'translateX(-50%)',
})

export const tooltipBoxRight = style({
  ...tooltipBase,
  transform: 'translateY(-50%)',
})
