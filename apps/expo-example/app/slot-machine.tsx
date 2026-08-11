import { ScrollView } from 'react-native';

import SlotMachinePlayground from '@/components/slot-machine-playground';

export default function SlotMachineScreen() {
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
      <SlotMachinePlayground />
    </ScrollView>
  );
}
