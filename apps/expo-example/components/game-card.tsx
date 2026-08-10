import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { GalleryGame } from '@/constants/game-catalog';

interface GameCardProps {
  readonly game: GalleryGame;
}

export function GameCard({ game }: GameCardProps) {
  const content = (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderCurve: 'continuous',
        borderRadius: 20,
        borderWidth: 1,
        boxShadow: '0 8px 24px rgba(20, 24, 40, 0.06)',
        gap: 14,
        opacity: game.href === undefined ? 0.76 : 1,
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
            {game.href === undefined ? 'PLANNED' : 'PLAYABLE'} · {game.milestone.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text selectable style={{ color: '#68647A', fontSize: 14, lineHeight: 20 }}>
        {game.description}
      </Text>
    </View>
  );

  if (game.href === undefined) {
    return (
      <View
        accessibilityLabel={`${game.name}. Planned for ${game.milestone}.`}
        accessibilityState={{ disabled: true }}
      >
        {content}
      </View>
    );
  }

  return (
    <Link href={game.href} asChild>
      <Pressable
        accessibilityHint={`Opens the ${game.name} playground.`}
        accessibilityLabel={game.name}
        accessibilityRole="link"
        style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
      >
        {content}
      </Pressable>
    </Link>
  );
}
