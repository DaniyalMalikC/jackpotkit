import type { CSSProperties } from 'react';

export type WebEasing = CSSProperties['transitionTimingFunction'];

export interface WebPresentationProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}
