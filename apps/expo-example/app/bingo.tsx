import { ScrollView } from 'react-native';

import BingoPlayground from '@/components/bingo-playground';

export default function BingoScreen() {
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
      <BingoPlayground />
    </ScrollView>
  );
}
