// Scratch Card is the only game that loads Skia, so it has no root export.
import { ScratchCard } from '@jackpotkit/react-native/scratch-card';
import { Text } from 'react-native';

interface Prize {
  readonly label: string;
}

export function WelcomeCard({ prize }: { readonly prize: Prize }) {
  return (
    <ScratchCard<Prize> width={320} height={180} result={{ prize }}>
      {(result) => <Text>{result?.prize?.label ?? ''}</Text>}
    </ScratchCard>
  );
}
