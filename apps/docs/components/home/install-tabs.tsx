import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

import { CopyButton } from './copy-button';

const managers = [
  { id: 'npm', install: 'npm install' },
  { id: 'pnpm', install: 'pnpm add' },
  { id: 'yarn', install: 'yarn add' },
] as const;

const platforms = [
  {
    id: 'react',
    title: 'React (web)',
    packages: '@jackpotkit/react @jackpotkit/core @jackpotkit/theme react react-dom',
    note: 'SVG, Canvas, and Pointer Events. No native dependencies.',
    href: '/docs/react-web',
  },
  {
    id: 'react-native',
    title: 'React Native',
    packages:
      '@jackpotkit/react-native @jackpotkit/core @jackpotkit/theme react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg',
    note: 'Reanimated, Gesture Handler, and SVG. Expo users can run npx expo install for the native peers.',
    href: '/docs/spin-wheel',
  },
] as const;

export function InstallTabs() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {platforms.map((platform) => (
        <div className="min-w-0 rounded-xl border bg-fd-card p-4" key={platform.id}>
          <h3 className="mb-1 font-semibold">{platform.title}</h3>
          <p className="mb-3 text-sm text-fd-muted-foreground">{platform.note}</p>
          <Tabs items={managers.map((manager) => manager.id)}>
            {managers.map((manager) => {
              const command = `${manager.install} ${platform.packages}`;
              return (
                <Tab key={manager.id} value={manager.id}>
                  <div className="flex items-start gap-2">
                    <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      <code>{command}</code>
                    </pre>
                    <CopyButton text={command} />
                  </div>
                </Tab>
              );
            })}
          </Tabs>
        </div>
      ))}
    </div>
  );
}
