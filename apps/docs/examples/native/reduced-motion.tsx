import { CoinFlip } from '@jackpotkit/react-native/coin-flip';

/** An in-app "reduce animations" setting, stored by your application. */
declare function useAppSettings(): { readonly reduceAnimations?: boolean };

export function SettingsAwareCoin() {
  const { reduceAnimations } = useAppSettings();
  // On React Native, `true` forces the short transition. `false` or `undefined` still honours the
  // system Reduce Motion setting, so users who need less motion always get it.
  return <CoinFlip reduceMotion={reduceAnimations === true} />;
}
