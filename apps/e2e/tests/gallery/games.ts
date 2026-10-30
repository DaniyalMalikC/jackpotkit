import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Accessible contract of each game as rendered by `@jackpotkit/react` in the gallery.
 *
 * Roles, names, and result text come from the renderer sources in `packages/react/src/<game>/`.
 * If a renderer changes its visible copy, update the matching entry here.
 */
export interface GameContract {
  /** Gallery card heading (`<h3>`). */
  readonly title: string;
  /** Accessible name of the control that starts or completes a round. */
  readonly control: RegExp;
  /** Accessible name of the first keyboard-focusable control in the initial state. */
  readonly focusable: RegExp;
  /** Text the `role="status"` live region shows once the round completes. */
  readonly completed: RegExp;
  /** Plays one round using only the keyboard. */
  readonly play: (page: Page, card: Locator) => Promise<void>;
}

export function gameCard(page: Page, title: string): Locator {
  return page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { level: 3, name: title, exact: true }) });
}

export function resultRegion(card: Locator): Locator {
  return card.getByRole('status');
}

async function pressControl(card: Locator, name: RegExp): Promise<void> {
  const control = card.getByRole('button', { name });
  await expect(control).toBeEnabled();
  await control.focus();
  await expect(control).toBeFocused();
  await control.press('Enter');
}

async function playBingo(_page: Page, card: Locator): Promise<void> {
  const status = resultRegion(card);
  const caller = card.getByRole('button', { name: /^(Call next number|Last call: \d+)$/ });
  // A 3x3 board drawn from 1-30 completes after at most 30 calls.
  for (let call = 0; call < 30; call += 1) {
    if (((await status.textContent()) ?? '').startsWith('Bingo!')) return;
    await expect(caller).toBeEnabled();
    await caller.focus();
    await caller.press('Enter');
    const called = card.getByRole('button', { name: /^Number \d+, called$/ });
    for (const cell of await called.all()) {
      await cell.focus();
      await cell.press('Space');
    }
  }
  await expect(status).toHaveText(/^Bingo!/);
}

export const games: readonly GameContract[] = [
  {
    title: 'Spin Wheel',
    control: /^Spin$/,
    focusable: /^Spin$/,
    completed: /^Selected: (100 points|Badge|Bonus)$/,
    play: (_page, card) => pressControl(card, /^Spin$/),
  },
  {
    title: 'Dice',
    control: /^Roll dice$/,
    focusable: /^Roll dice$/,
    completed: /^Total: ([2-9]|1[0-2])$/,
    play: (_page, card) => pressControl(card, /^Roll dice$/),
  },
  {
    title: 'Coin Flip',
    control: /^Flip coin$/,
    focusable: /^Flip coin$/,
    completed: /^Result: (Heads|Tails)$/,
    play: (_page, card) => pressControl(card, /^Flip coin$/),
  },
  {
    title: 'Lucky Box',
    control: /^Reveal selection$/,
    focusable: /(Violet|Gold|Mint)/,
    completed: /^(You found the winning box!|Winning box: (Violet|Gold|Mint))$/,
    play: async (_page, card) => {
      const box = card.getByRole('button', { name: /Gold/ });
      await box.focus();
      await box.press('Enter');
      await expect(box).toHaveAttribute('aria-pressed', 'true');
      await pressControl(card, /^Reveal selection$/);
    },
  },
  {
    title: 'Slot Machine',
    control: /^Spin reels$/,
    focusable: /^Spin reels$/,
    completed: /^\d+ winning paylines?$/,
    play: (_page, card) => pressControl(card, /^Spin reels$/),
  },
  {
    title: 'Scratch Card',
    control: /^Reveal card$/,
    focusable: /^Reveal card$/,
    completed: /^Prize revealed$/,
    play: (_page, card) => pressControl(card, /^Reveal card$/),
  },
  {
    title: 'Bingo',
    control: /^(Call next number|Last call: \d+)$/,
    focusable: /^(Call next number|Last call: \d+)$/,
    completed: /^Bingo! Completed .+\.$/,
    play: playBingo,
  },
];

export async function openGallery(page: Page): Promise<void> {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 2, name: 'React renderer gallery' }),
  ).toBeVisible();
}
