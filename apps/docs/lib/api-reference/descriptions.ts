import type { ApiPlatform } from './paths';

/**
 * Descriptions for generated API tables. The exported types carry almost no TSDoc, so the docs
 * keep one short sentence per member here. A JSDoc comment in the source always wins over these.
 *
 * Every key must name a member that exists in the generated type: `test/api-reference.test.ts`
 * fails on a description for a member that no documented type has, so renamed or removed props
 * cannot leave stale text behind.
 *
 * Use `{ web, native }` when the behaviour differs by platform.
 */
export type ApiText = string | { readonly native: string; readonly web: string };

const theme = (token: string) => `Defaults to the theme's \`animation.${token}\` token.`;

/** Members whose meaning is the same in every type that has them. */
export const sharedDescriptions: Readonly<Record<string, ApiText>> = {
  accessibilityLabel: 'Accessible name of the game.',
  accessibilityLabels:
    'Overrides the default screen-reader copy for controls, progress, and results.',
  className: 'Class name added to the root element.',
  disabled: 'Prevents play and exposes the primary control as disabled.',
  easing: {
    native: 'Reanimated easing function used for the animation.',
    web: 'CSS `transition-timing-function` used for the animation.',
  },
  metadata: 'Application data carried through unchanged.',
  randomSource:
    'Source of client-side randomness. Inject `SeededRandomSource` for repeatable previews; client randomness is never authoritative.',
  reduceMotion: {
    native:
      '`true` always uses the short reduced-motion transition. When omitted or `false`, the system reduce-motion setting still applies.',
    web: '`true` forces the short reduced-motion transition and `false` forces full motion. When omitted, `prefers-reduced-motion` is followed.',
  },
  result:
    'Controlled next outcome. The next play resolves to this selection instead of drawing one.',
  resultProvider:
    'Sync or async function that returns the next outcome, for example from your server. Called with `resultRequest`.',
  resultRequest: 'Value passed to `resultProvider` on every play.',
  status:
    'Externally controlled status shown by the component, for example while your app waits for a server.',
  style: {
    native: 'Style for the root view.',
    web: 'Inline styles for the root element.',
  },
  theme:
    'Theme override for this component, merged over the `JackpotKitProvider` theme (or `defaultTheme`).',

  onAnimationStart: 'Called with the resolved result when the animation starts.',
  onComplete: 'Called with the result after the animation finishes and the result is announced.',
  onError: 'Called with configuration, provider, and state errors.',
  onEvent: 'Receives every lifecycle event as a typed `GameEvent`.',
  onPlayStart: 'Called when a play starts.',
  onReady: 'Called once the game is ready to play.',
  onReset: 'Called after the game resets.',
  onResultRequest: 'Called when the component starts resolving the next result.',
  onResultResolved: 'Called with the validated result, before any animation starts.',
  onRevealStart: 'Called with the result when the reveal starts.',
  onStatusChange: 'Called with each lifecycle status change.',

  reset: 'Cancels any active animation and returns the game to its initial state.',
};

/** Members described per type, keyed by the exported type name. */
export const typeDescriptions: Readonly<Record<string, Readonly<Record<string, ApiText>>>> = {
  SpinWheelProps: {
    direction: 'Rotation direction.',
    duration: `Spin duration in milliseconds. ${theme('spinDuration')}`,
    renderPointer: 'Custom pointer renderer. Receives the resolved theme.',
    renderSegment: 'Custom segment label renderer.',
    rotations: `Full turns before the wheel stops. ${theme('spinRotations')}`,
    segments:
      'Wheel segments: IDs, labels, values, colors, weights, and metadata. Weights change probability, not slice size.',
    size: {
      native:
        'Wheel diameter in layout points. Defaults to the window width minus 48, from 160 to 420.',
      web: 'Wheel diameter in CSS pixels.',
    },
  },
  SpinWheelRef: {
    spin: 'Plays with the configured result mode. Resolves after the animation and announcement.',
    spinTo: 'Spins to the given segment ID.',
  },
  WheelSegment: {
    color: 'Slice color. Falls back to the theme `colors.wheelPalette`.',
    id: 'Unique, non-empty segment ID.',
    label: 'Visible and announced label.',
    value: 'Application value returned in the result.',
    weight: 'Positive relative probability. Defaults to `1`.',
  },
  SpinWheelResult: {
    segment: 'The selected segment.',
    segmentId: 'ID of the selected segment.',
  },

  ScratchCardProps: {
    autoReveal: 'Reveals the rest of the cover once coverage reaches `threshold`.',
    borderRadius: 'Corner radius of the card.',
    brushRadius: {
      native: 'Scratch brush radius in layout points.',
      web: 'Scratch brush radius in CSS pixels.',
    },
    children:
      'Content under the cover: React nodes, or a function that receives the current result (`undefined` until it resolves).',
    cover: 'Solid or image cover drawn over the content.',
    height: 'Card height. Must be positive.',
    renderCover: {
      native: 'Custom Skia cover drawing.',
      web: 'Custom cover content. Receives the card size and resolved theme.',
    },
    revealDuration: `Duration of the final reveal in milliseconds. ${theme('revealDuration')}`,
    threshold: 'Scratched fraction in `(0, 1]` that completes the card. Defaults to `0.65`.',
    width: 'Card width. Must be positive.',
    onProgress: 'Called with the scratched fraction, from 0 to 1.',
  },
  ScratchCardRef: {
    reveal: 'Reveals the card without a gesture. Resolves with the result.',
  },
  ScratchCardSelection: {
    prize: 'The prize revealed under the cover.',
  },
  ScratchCardResult: {
    prize: 'The revealed prize.',
  },

  SlotMachineProps: {
    duration: `Reel spin duration in milliseconds. ${theme('slotDuration')}`,
    evaluate:
      'Interprets the resolved grid and winning paylines. Its return value becomes the result `evaluation`.',
    paylines: 'One row index per reel for each payline. Defaults to one straight line per row.',
    reelCount: 'Number of reels.',
    reelDelay: `Delay between reel stops in milliseconds. ${theme('slotReelDelay')}`,
    renderSymbol: 'Custom symbol renderer for text, emoji, images, or branded artwork.',
    rowCount: 'Visible rows per reel.',
    symbolHeight: 'Height of one symbol cell.',
    symbols: 'Reel symbols: IDs, labels, values, positive weights, and metadata.',
    width: 'Machine width.',
    onReelStop: 'Called when each reel stops, with the reel index and the result.',
  },
  SlotMachineRef: {
    spin: 'Plays with the configured result mode. Resolves after every reel stops.',
    spinTo: 'Spins to the given symbol-ID grid.',
  },
  SlotSymbol: {
    id: 'Unique, non-empty symbol ID.',
    label: 'Visible and announced label.',
    value: 'Application value returned in the result.',
    weight: 'Positive relative probability. Defaults to `1`.',
  },
  SlotMachineSelection: {
    reels: 'Symbol IDs for each reel, one per visible row.',
  },
  SlotMachineResult: {
    evaluation: 'The return value of `evaluate`, when supplied.',
    reels: 'Resolved symbols for each reel, one per visible row.',
    winningPaylines: 'Paylines whose symbols all match.',
  },

  BingoProps: {
    board: 'A supplied row-major card. When omitted, a card is generated with `randomSource`.',
    cellGap: 'Gap between cells.',
    freeSpace: 'Makes the center cell free. Requires an odd card size.',
    maxNumber: 'Highest callable number.',
    minNumber: 'Lowest callable number.',
    now: 'Clock used for result and event timestamps.',
    patterns: 'Built-in pattern names or custom coordinate patterns that complete the card.',
    renderCell: 'Custom cell renderer.',
    showCallButton: 'Shows the built-in "call next number" button.',
    size: 'Rows and columns of a generated card.',
    width: 'Board width.',
    onCall: 'Called with each called number and the new state.',
    onMark: 'Called when a cell is marked.',
    onUnmark: 'Called when a cell is unmarked.',
  },
  BingoRef: {
    call: 'Calls a specific number, for example one from your server.',
    check: 'Evaluates the configured patterns against the current marks.',
    draw: 'Draws and calls the next number with the random source. Returns the number.',
    mark: 'Marks a called number on the card.',
    reset: 'Clears calls and marks and returns the new state.',
    unmark: 'Removes a mark.',
  },
  BingoState: {
    calledNumbers: 'Numbers called so far, in order.',
    completed: 'Whether any configured pattern is complete.',
    markedNumbers: 'Numbers marked on the card.',
    matches: 'Completed patterns.',
    status: 'Current lifecycle status.',
  },
  BingoResult: {
    board: 'The completed card.',
    matches: 'Completed patterns.',
  },

  DiceProps: {
    count: 'Number of dice when `dice` is omitted. The engine defaults to `1`.',
    dice: 'Explicit die definitions. Pass either `dice` or `count` and `sides`, not both.',
    duration: `Roll duration in milliseconds. ${theme('diceRollDuration')}`,
    renderDie: 'Custom die face renderer.',
    sides: 'Faces per die when `dice` is omitted. The engine defaults to `6`.',
    width: 'Width of the dice tray.',
  },
  DiceRef: {
    roll: 'Rolls with the configured result mode. Resolves after the animation.',
    rollTo: 'Rolls to the given values.',
  },
  DieDefinition: {
    id: 'Unique, non-empty die ID.',
    label: 'Visible and announced label.',
    sides: 'Number of faces, at least 2.',
  },
  DiceSelection: {
    values: 'One value per die, from 1 to its `sides`.',
  },
  DiceResult: {
    dice: 'The dice that were rolled.',
    total: 'Sum of `values`.',
    values: 'One value per die.',
  },

  CoinFlipProps: {
    duration: `Flip duration in milliseconds. ${theme('coinFlipDuration')}`,
    faces: 'The two coin faces. Defaults to `DEFAULT_COIN_FACES` (heads and tails).',
    renderFace: 'Custom face renderer.',
    size: 'Coin diameter.',
  },
  CoinFlipRef: {
    flip: 'Flips with the configured result mode. Resolves after the animation.',
    flipTo: 'Flips to the given face.',
  },
  CoinFace: {
    id: 'Unique, non-empty face ID.',
    label: 'Visible and announced label.',
    value: 'Application value returned in the result.',
  },
  CoinFlipSelection: {
    faceId: 'ID of the face that lands up.',
  },
  CoinFlipResult: {
    face: 'The face that landed up.',
    faceId: 'ID of the face that landed up.',
  },

  LuckyBoxProps: {
    boxes: 'The boxes to choose from: IDs, labels, rewards, availability, and metadata.',
    columns: 'Number of grid columns.',
    duration: `Reveal duration in milliseconds. ${theme('luckyBoxRevealDuration')}`,
    faceStyle:
      '`tiles` for compact labeled cards or `gift-boxes` for gift boxes with ribbons and lids.',
    renderBox: 'Custom box renderer.',
    width: 'Grid width.',
    onSelect: 'Called when the player selects a box.',
  },
  LuckyBoxRef: {
    pick: 'Selects a box and reveals it in one call.',
    reveal: 'Reveals the selected box with the configured result mode.',
    revealTo: 'Reveals with the given winning box.',
    select: 'Selects a box without revealing it.',
  },
  LuckyBoxItem: {
    disabled: 'Prevents selecting this box.',
    id: 'Unique, non-empty box ID.',
    label: 'Visible and announced label.',
    reward: 'Reward returned when this box wins.',
  },
  LuckyBoxSelection: {
    boxId: 'ID of the winning box.',
  },
  LuckyBoxResult: {
    reward: 'Reward of the winning box, when it has one.',
    selectedBox: 'The box the player picked.',
    winningBox: 'The box chosen by the result.',
    won: 'Whether the picked box is the winning box.',
  },
  JackpotTheme: {
    animation: 'Animation durations and spin rotations.',
    colors: 'Surface, text, and per-game colors.',
    radii: 'Corner radii.',
    spacing: 'Spacing scale.',
    typography: 'Font family and sizes.',
  },
  JackpotThemeColors: {
    background: 'Page or container background behind the games.',
    bingoFree: 'Bingo free cell.',
    bingoMarked: 'Bingo marked cell.',
    border: 'Borders and dividers.',
    coinBack: 'Coin back face.',
    coinFront: 'Coin front face.',
    diceFace: 'Die face.',
    dicePip: 'Die pips and numbers.',
    luckyBox: 'Lucky Box tile.',
    luckyBoxSelected: 'Selected Lucky Box tile.',
    mutedText: 'Secondary text.',
    onPrimary: 'Text and icons on `primary`.',
    pointer: 'Spin Wheel pointer.',
    primary: 'Primary actions and highlights.',
    scratchAccent: 'Scratch Card accent.',
    scratchCover: 'Scratch Card cover when the cover sets no color.',
    slotAccent: 'Slot Machine accent.',
    slotBackground: 'Slot Machine cabinet background.',
    surface: 'Cards, cells, and controls.',
    text: 'Primary text.',
    wheelPalette: 'Spin Wheel slice colors, used in order for segments without a `color`.',
  },
  JackpotThemeTypography: {
    fontFamily: 'Font family for game text. Platform default when omitted.',
    labelSize: 'Label font size.',
    titleSize: 'Title and result font size.',
  },
  JackpotThemeSpacing: {
    lg: 'Large spacing.',
    md: 'Medium spacing.',
    sm: 'Small spacing.',
    xl: 'Extra-large spacing.',
    xs: 'Extra-small spacing.',
  },
  JackpotThemeRadii: {
    full: 'Pill and circle radius.',
    lg: 'Large radius.',
    md: 'Medium radius.',
    sm: 'Small radius.',
  },
  JackpotThemeAnimation: {
    bingoMarkDuration: 'Bingo mark transition.',
    coinFlipDuration: 'Coin Flip `duration` default.',
    diceRollDuration: 'Dice `duration` default.',
    luckyBoxRevealDuration: 'Lucky Box `duration` default.',
    reducedMotionDuration:
      'Short transition used instead of the full animation when reduced motion is active.',
    revealDuration: 'Scratch Card `revealDuration` default.',
    slotDuration: 'Slot Machine `duration` default.',
    slotReelDelay: 'Slot Machine `reelDelay` default.',
    spinDuration: 'Spin Wheel `duration` default.',
    spinRotations: 'Spin Wheel `rotations` default, in full turns.',
  },
};

/** Fields every `GameResult` has, documented on each result type. */
const gameResultFields: Readonly<Record<string, string>> = {
  data: 'Game-specific result data.',
  game: 'Game identifier.',
  id: 'Result ID.',
  timestamp: 'Time the result was created, in milliseconds.',
};

function pick(text: ApiText, platform: ApiPlatform): string {
  if (typeof text === 'string') return text;
  return platform === 'native' ? text.native : text.web;
}

/** The description for one member of an exported type, or `undefined` when none is kept. */
export function describeMember(typeName: string, member: string, platform: ApiPlatform) {
  const specific = typeDescriptions[typeName]?.[member];
  if (specific !== undefined) return pick(specific, platform);
  if (typeName.endsWith('Result') && member in gameResultFields) return gameResultFields[member];
  const shared = sharedDescriptions[member];
  return shared === undefined ? undefined : pick(shared, platform);
}
