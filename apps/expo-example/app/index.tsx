import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { GameCard } from '@/components/game-card';
import { galleryGames } from '@/constants/game-catalog';

export default function GalleryScreen() {
  const { width } = useWindowDimensions();
  const wideLayout = width >= 760;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: 24,
        maxWidth: 1040,
        padding: 20,
        width: '100%',
      }}
    >
      <View
        style={{
          backgroundColor: '#221A47',
          borderCurve: 'continuous',
          borderRadius: 28,
          gap: 12,
          overflow: 'hidden',
          padding: wideLayout ? 34 : 24,
        }}
      >
        <Text
          selectable
          style={{ color: '#B7A6FF', fontSize: 13, fontWeight: '800', letterSpacing: 1.2 }}
        >
          PHASE 4 · RESULT-DRIVEN REELS
        </Text>
        <Text
          selectable
          style={{ color: '#FFFFFF', fontSize: wideLayout ? 34 : 29, fontWeight: '800' }}
        >
          Game Gallery
        </Text>
        <Text selectable style={{ color: '#D7D0F3', fontSize: 16, lineHeight: 23, maxWidth: 680 }}>
          Spin Wheel, Scratch Card, and Slot Machine are playable reference implementations. The
          remaining games stay visibly scoped to their future milestones.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {galleryGames.map((game) => (
          <View key={game.name} style={{ flexBasis: wideLayout ? '47%' : '100%', flexGrow: 1 }}>
            <GameCard game={game} />
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: '#EDE9FF',
          borderCurve: 'continuous',
          borderRadius: 18,
          gap: 6,
          padding: 18,
        }}
      >
        <Text selectable style={{ color: '#302361', fontSize: 15, fontWeight: '700' }}>
          Milestone boundary
        </Text>
        <Text selectable style={{ color: '#5E557A', fontSize: 14, lineHeight: 20 }}>
          Each playable game ships its engine, renderer, accessibility, controlled/server modes,
          tests, and documentation together. Other cards remain disabled until their own definition
          of done passes.
        </Text>
      </View>
    </ScrollView>
  );
}
