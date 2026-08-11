import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { Text } from 'react-native';

const fallback = <Text selectable>Loading the Scratch Card renderer…</Text>;

export default function ScratchCardRouteContent() {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return (
    <WithSkiaWeb fallback={fallback} getComponent={() => import('./scratch-card-playground')} />
  );
}
