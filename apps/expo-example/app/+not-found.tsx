import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ alignItems: 'center', gap: 16, padding: 32 }}
    >
      <Text selectable style={{ color: '#17142B', fontSize: 24, fontWeight: '700' }}>
        This gallery page does not exist.
      </Text>
      <Link href="/" style={{ color: '#6746D9', fontSize: 16, fontWeight: '700' }}>
        Return to the game gallery
      </Link>
    </ScrollView>
  );
}
