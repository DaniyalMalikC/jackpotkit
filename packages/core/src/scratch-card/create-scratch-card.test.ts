import { describe, expect, it } from 'vitest';

import { GameStateError, InvalidResultError } from '../errors/index.js';
import { createScratchCard } from './create-scratch-card.js';

describe('Scratch Card engine', () => {
  it('completes a controlled result at the threshold', () => {
    const engine = createScratchCard({
      now: () => 42,
      result: { prize: { code: 'WIN20' }, metadata: { mode: 'controlled' } },
      threshold: 0.6,
    });

    expect(engine.scratch(0.4)).toEqual({ completed: false, progress: 0.4 });
    expect(engine.status).toBe('playing');
    expect(engine.scratch(0.61)).toEqual({ completed: true, progress: 0.61 });
    expect(engine.result).toEqual({
      data: { prize: { code: 'WIN20' } },
      game: 'scratch-card',
      id: 'scratch-card-1',
      metadata: { mode: 'controlled' },
      prize: { code: 'WIN20' },
      timestamp: 42,
    });
  });

  it('keeps progress monotonic and supports explicit reveal', () => {
    const engine = createScratchCard<string>({ result: { prize: 'badge' }, threshold: 0.8 });
    engine.scratch(0.5);
    expect(engine.scratch(0.2).progress).toBe(0.5);

    expect(engine.reveal().prize).toBe('badge');
    expect(engine.progress).toBe(1);
    expect(engine.status).toBe('completed');
  });

  it('supports async server-authoritative results while scratching continues', async () => {
    let resolveSelection: ((value: { prize: string }) => void) | undefined;
    const provider = () =>
      new Promise<{ prize: string }>((resolve) => {
        resolveSelection = resolve;
      });
    const engine = createScratchCard<string>({ threshold: 0.5 });

    const resultPromise = engine.startWith(provider, undefined);
    expect(engine.status).toBe('requesting-result');
    expect(engine.scratch(0.7)).toEqual({ completed: false, progress: 0.7 });

    resolveSelection?.({ prize: 'server-prize' });
    await expect(resultPromise).resolves.toMatchObject({ prize: 'server-prize' });
    expect(engine.status).toBe('completed');
  });

  it('invalidates an outstanding provider request when reset', async () => {
    let resolveSelection: ((value: { prize: string }) => void) | undefined;
    const engine = createScratchCard<string>();
    const resultPromise = engine.startWith(
      () =>
        new Promise((resolve) => {
          resolveSelection = resolve;
        }),
      undefined,
    );

    engine.reset();
    resolveSelection?.({ prize: 'late' });

    await expect(resultPromise).rejects.toThrow(GameStateError);
    expect(engine.status).toBe('ready');
    expect(engine.progress).toBe(0);
  });

  it('rejects invalid provider results and prevents reveal while requesting', async () => {
    let resolveSelection: ((value: { prize?: unknown }) => void) | undefined;
    const engine = createScratchCard();
    const resultPromise = engine.startWith(
      () =>
        new Promise((resolve) => {
          resolveSelection = resolve;
        }),
      undefined,
    );

    expect(() => engine.reveal()).toThrow(GameStateError);
    resolveSelection?.(null as never);
    await expect(resultPromise).rejects.toThrow(InvalidResultError);
    expect(engine.status).toBe('error');
  });

  it('resets progress and results for a new cycle', () => {
    const engine = createScratchCard({ result: { prize: 'coupon' } });
    engine.scratch(1);
    engine.reset();

    expect(engine.progress).toBe(0);
    expect(engine.result).toBeUndefined();
    expect(engine.status).toBe('ready');
    expect(engine.start().id).toBe('scratch-card-2');
  });
});
