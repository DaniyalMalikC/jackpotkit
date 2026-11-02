import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { ScrollView, Text } from 'react-native';

import {
  embedBackground,
  gamePlaygrounds,
  gameSlugs,
  isGameSlug,
} from '@/components/game-playgrounds';

/** Pre-renders `/embed/<game>` for every game in the static web export. */
export function generateStaticParams(): { game: string }[] {
  return gameSlugs.map((game) => ({ game }));
}

/**
 * Chrome-free playground for embedding in an iframe, such as the documentation site's React
 * Native preview. It renders the same playground as the gallery route, at the full frame width.
 */
export default function EmbeddedGameScreen() {
  const { game } = useLocalSearchParams<{ game: string }>();

  if (!isGameSlug(game)) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Head>
          <title>Unknown game · JackpotKit React Native preview</title>
        </Head>
        <Text selectable style={{ color: '#17142B', fontSize: 18, fontWeight: '700' }}>
          This game does not exist.
        </Text>
      </ScrollView>
    );
  }

  const { Playground, title } = gamePlaygrounds[game];

  return (
    <ScrollView
      style={{ backgroundColor: embedBackground }}
      contentContainerStyle={{ gap: 20, padding: 16, width: '100%' }}
    >
      <Head>
        <title>{`${title} · JackpotKit React Native preview`}</title>
      </Head>
      <Playground />
    </ScrollView>
  );
}
