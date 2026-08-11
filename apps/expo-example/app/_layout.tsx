import '@jackpotkit/react-native';
import 'react-native-gesture-handler';

import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#F7F6FB' },
          headerBackButtonDisplayMode: 'minimal',
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F7F6FB' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'JackpotKit' }} />
        <Stack.Screen
          name="spin-wheel"
          options={{ headerLargeTitle: false, title: 'Spin Wheel' }}
        />
        <Stack.Screen
          name="scratch-card"
          options={{ headerLargeTitle: false, title: 'Scratch Card' }}
        />
        <Stack.Screen
          name="slot-machine"
          options={{ headerLargeTitle: false, title: 'Slot Machine' }}
        />
        <Stack.Screen name="+not-found" options={{ headerLargeTitle: false, title: 'Not Found' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
