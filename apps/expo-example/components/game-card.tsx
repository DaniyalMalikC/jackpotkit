import { Text, View } from 'react-native';

import type { GalleryGame } from '@/constants/game-catalog';

interface GameCardProps {
  readonly game: GalleryGame;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <View
      accessibilityLabel={`${game.name}. Planned for ${game.milestone}.`}
      accessibilityState={{ disabled: true }}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderCurve: 'continuous',
        borderRadius: 20,
        borderWidth: 1,
        boxShadow: '0 8px 24px rgba(20, 24, 40, 0.06)',
        gap: 14,
        opacity: 0.88,
        padding: 18,
      }}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 14 }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#F2EDFF',
            borderCurve: 'continuous',
            borderRadius: 16,
            height: 52,
            justifyContent: 'center',
            width: 52,
          }}
        >
          <Text accessibilityElementsHidden style={{ fontSize: 27 }}>
            {game.emoji}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text selectable style={{ color: '#17142B', fontSize: 18, fontWeight: '700' }}>
            {game.name}
          </Text>
          <Text
            selectable
            style={{ color: '#7358D8', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}
          >
            PLANNED · {game.milestone.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text selectable style={{ color: '#68647A', fontSize: 14, lineHeight: 20 }}>
        {game.description}
      </Text>
    </View>
  );
}
