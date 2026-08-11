import { ScrollView } from 'react-native';

import { LuckyBoxPlayground } from '@/components/phase-six-playgrounds';

export default function LuckyBoxScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: 20,
        maxWidth: 820,
        padding: 20,
        width: '100%',
      }}
    >
      <LuckyBoxPlayground />
    </ScrollView>
  );
}
