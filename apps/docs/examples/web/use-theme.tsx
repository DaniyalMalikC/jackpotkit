import { useJackpotKitTheme } from '@jackpotkit/react';
import type { ReactNode } from 'react';

/** Application chrome that matches the games inside the same provider. */
export function GamePanel({ children }: { readonly children: ReactNode }) {
  const theme = useJackpotKitTheme();
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.md,
        color: theme.colors.text,
        padding: theme.spacing.md,
      }}
    >
      {children}
    </div>
  );
}
