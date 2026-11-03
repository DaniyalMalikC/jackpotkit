import { CoinFlip } from '@jackpotkit/react/coin-flip';

/** An in-app "reduce animations" setting, stored by your application. */
declare function useAppSettings(): { readonly reduceAnimations?: boolean };

export function SettingsAwareCoin() {
  const { reduceAnimations } = useAppSettings();
  // `true` forces the short transition and `false` forces full motion on the web. Leave the prop
  // out to follow the operating system's `prefers-reduced-motion` setting.
  return (
    <CoinFlip {...(reduceAnimations === undefined ? {} : { reduceMotion: reduceAnimations })} />
  );
}
