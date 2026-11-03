import { expect, type Page } from '@playwright/test';

/**
 * Accessible contract of each game's embed route (`/embed/<slug>`) in the Expo web export: the
 * `@jackpotkit/react-native` playgrounds of `apps/expo-example`, rendered through
 * react-native-web.
 *
 * Control names come from `packages/react-native/src/<game>/` (or the playground in
 * `apps/expo-example/components/` where it overrides them). Result text is the playground's or
 * renderer's polite live region once a round completes.
 */
export interface NativeGameContract {
  readonly slug: string;
  readonly title: string;
  /** Accessible name of the control that starts or completes a round. */
  readonly control: RegExp;
  /** Text of a polite live region once the round completes. */
  readonly completed: RegExp;
  /** Plays one round with the keyboard. */
  readonly play: (page: Page) => Promise<void>;
  /**
   * A genuine `@jackpotkit/react-native` accessibility defect that axe reports through
   * react-native-web. The axe check is marked `test.fail()` with this description, so it reports
   * "unexpectedly passed" once the defect is fixed and the marker must be removed.
   */
  readonly axeDefect?: string;
}

async function press(page: Page, name: RegExp): Promise<void> {
  const control = page.getByRole('button', { name });
  await expect(control).toBeEnabled();
  await control.focus();
  await expect(control).toBeFocused();
  await control.press('Enter');
}

async function playBingo(page: Page): Promise<void> {
  const result = completedRegion(page, /^Bingo! Completed /);
  // A 3 x 3 board draws from 1-30, so a pattern completes after at most 30 calls.
  await page.getByRole('button', { name: 'Board size: 3 × 3' }).click();
  for (let call = 0; call < 30; call += 1) {
    if ((await result.count()) > 0) return;
    await press(page, /^(Call next number|Last call: \d+)$/);
    for (const cell of await page.getByRole('button', { name: /^Number \d+, called$/ }).all()) {
      await cell.focus();
      await cell.press('Enter');
    }
  }
}

export const nativeGames: readonly NativeGameContract[] = [
  {
    slug: 'spin-wheel',
    title: 'Spin Wheel',
    control: /^Spin the example wheel$/,
    completed: /^Result ID: \w+$/,
    play: (page) => press(page, /^Spin the example wheel$/),
  },
  {
    slug: 'scratch-card',
    title: 'Scratch Card',
    control: /^Reveal$/,
    completed: /^Result ID: points$/,
    play: (page) => press(page, /^Reveal$/),
  },
  {
    slug: 'slot-machine',
    title: 'Slot Machine',
    control: /^Pull to spin$/,
    completed: /^Result slot-machine-\d+: \d+ match(es)?$/,
    play: (page) => press(page, /^Pull to spin$/),
  },
  {
    slug: 'bingo',
    title: 'Bingo',
    control: /^Call next number$/,
    completed: /^Bingo! Completed .+\.$/,
    play: playBingo,
  },
  {
    slug: 'dice',
    title: 'Dice',
    control: /^Roll dice$/,
    completed: /^Total: \d+$/,
    play: (page) => press(page, /^Roll dice$/),
  },
  {
    slug: 'coin-flip',
    title: 'Coin Flip',
    control: /^Flip coin$/,
    completed: /^Result: (Heads|Tails)$/,
    play: (page) => press(page, /^Flip coin$/),
  },
  {
    slug: 'lucky-box',
    title: 'Lucky Box',
    control: /^Reveal selection$/,
    completed: /^(You found the winning box!|Winning box: .+)$/,
    play: async (page) => {
      await press(page, /^Golden gift$/);
      await press(page, /^Reveal selection$/);
    },
  },
];

export function nativeGame(slug: string): NativeGameContract {
  const game = nativeGames.find((candidate) => candidate.slug === slug);
  if (game === undefined) throw new Error(`Unknown native game: ${slug}`);
  return game;
}

/** A polite live region whose text matches `text`. */
export function completedRegion(page: Page, text: RegExp) {
  return page.locator('[aria-live="polite"]').filter({ hasText: text });
}

/** Collects uncaught page errors and failed same-origin requests (except the favicon). */
export function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (response.status() >= 400 && url.pathname !== '/favicon.ico') {
      errors.push(`${response.status()} ${url.pathname}`);
    }
  });
  return errors;
}

export async function openEmbed(page: Page, game: NativeGameContract): Promise<void> {
  await page.goto(`/embed/${game.slug}`);
  await expect(page).toHaveTitle(`${game.title} · JackpotKit React Native preview`);
  await expect(page.getByRole('button', { name: game.control })).toBeVisible({ timeout: 20_000 });
}
