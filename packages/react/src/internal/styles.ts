import type { CSSProperties } from 'react';
import type { JackpotTheme } from '@jackpotkit/theme';

export function actionButtonStyle(theme: JackpotTheme, disabled: boolean): CSSProperties {
  return {
    background: theme.colors.primary,
    border: 0,
    borderRadius: theme.radii.full,
    color: theme.colors.onPrimary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.labelSize,
    fontWeight: 900,
    opacity: disabled ? 0.65 : 1,
    padding: `${theme.spacing.sm + 4}px ${theme.spacing.xl}px`,
  };
}
