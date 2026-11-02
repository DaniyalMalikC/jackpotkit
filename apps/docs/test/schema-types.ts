/**
 * Compile-time checks, run by `pnpm typecheck`: a schema that names a missing prop, binds a
 * control to a prop of the wrong type, or forgets a callback must not compile.
 */
import { defineGameSchema } from '@/lib/playground/schema';
import type { PlaygroundPropsMap } from '@/lib/playground/games';

type CoinFlipProps = PlaygroundPropsMap['coin-flip'];

const events = [
  'onReady',
  'onPlayStart',
  'onResultRequest',
  'onResultResolved',
  'onAnimationStart',
  'onRevealStart',
  'onComplete',
  'onReset',
  'onError',
  'onEvent',
  'onStatusChange',
] as const;

const base = {
  componentName: 'CoinFlip',
  defaults: {},
  game: 'coin-flip',
  libraryDefaults: {},
  modes: { controlled: false, provider: false, random: true },
} as const;

export const valid = defineGameSchema<CoinFlipProps>()({
  ...base,
  controls: [{ kind: 'number', label: 'Size', max: 200, min: 80, prop: 'size', step: 4 }],
  events,
});

export const unknownProp = defineGameSchema<CoinFlipProps>()({
  ...base,
  // @ts-expect-error `radius` is not a Coin Flip prop.
  controls: [{ kind: 'number', label: 'Radius', max: 200, min: 80, prop: 'radius', step: 4 }],
  events,
});

export const wrongKind = defineGameSchema<CoinFlipProps>()({
  ...base,
  // @ts-expect-error `faceStyle` is a string union, so it cannot be a number control.
  controls: [{ kind: 'number', label: 'Style', max: 1, min: 0, prop: 'faceStyle', step: 1 }],
  events,
});

export const wrongOption = defineGameSchema<CoinFlipProps>()({
  ...base,
  controls: [
    {
      kind: 'select',
      label: 'Style',
      // @ts-expect-error `round` is not a CoinFaceStyle.
      options: [{ label: 'Round', value: 'round' }],
      prop: 'faceStyle',
    },
  ],
  events,
});

// @ts-expect-error `onStatusChange` is missing from the event list.
export const missingEvent = defineGameSchema<CoinFlipProps>()({
  ...base,
  controls: [],
  events: events.filter(
    (event) => event !== 'onStatusChange',
  ) as readonly (typeof events)[number][] as readonly [
    'onReady',
    'onPlayStart',
    'onResultRequest',
    'onResultResolved',
    'onAnimationStart',
    'onRevealStart',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
  ],
});
