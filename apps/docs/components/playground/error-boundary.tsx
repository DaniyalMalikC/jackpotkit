'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  /** Changing this clears a caught error and renders the children again. */
  readonly resetKey: string;
  readonly onError?: (error: unknown, info: ErrorInfo) => void;
  readonly renderError: (error: unknown) => ReactNode;
}

interface State {
  readonly error: unknown;
  readonly hasError: boolean;
  readonly resetKey: string;
}

/**
 * Shows the library's own validation error (for example a duplicate segment id) instead of
 * unmounting the page, and retries as soon as the controls change.
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  override state: State = { error: undefined, hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error, hasError: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey === state.resetKey) return null;
    return { error: undefined, hasError: false, resetKey: props.resetKey };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override render(): ReactNode {
    return this.state.hasError ? this.props.renderError(this.state.error) : this.props.children;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}
