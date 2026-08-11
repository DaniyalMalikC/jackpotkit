import { ScrollView } from 'react-native';

import { DicePlayground } from '@/components/phase-six-playgrounds';

export default function DiceScreen() {
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
      <DicePlayground />
    </ScrollView>
  );
}
