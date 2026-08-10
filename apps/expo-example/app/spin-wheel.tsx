import { ScrollView } from 'react-native';

import { SpinWheelPlayground } from '@/components/spin-wheel-playground';

export default function SpinWheelScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: 20,
        maxWidth: 760,
        padding: 20,
        width: '100%',
      }}
    >
      <SpinWheelPlayground />
    </ScrollView>
  );
}
