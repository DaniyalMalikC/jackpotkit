// app/_layout.tsx in an Expo Router project. Gesture Handler needs a root view; Scratch Card's
// scratch gesture does not work without it.
import { JackpotKitProvider } from '@jackpotkit/react-native';
import { defaultTheme } from '@jackpotkit/theme';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <JackpotKitProvider theme={defaultTheme}>
        <Stack />
      </JackpotKitProvider>
    </GestureHandlerRootView>
  );
}
