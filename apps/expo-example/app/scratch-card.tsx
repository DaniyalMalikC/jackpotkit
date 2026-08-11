import { ScrollView } from 'react-native';

import ScratchCardRouteContent from '@/components/scratch-card-route-content';

export default function ScratchCardScreen() {
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
      <ScratchCardRouteContent />
    </ScrollView>
  );
}
