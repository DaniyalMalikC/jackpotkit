---
title: Game development template
sidebar_position: 18
---

# Game development template

Use predictable structure without forcing unrelated games into a universal engine.

```text
packages/core/src/game-name/
├── types.ts
├── engine.ts
├── validation.ts
├── result.ts
├── index.ts
└── __tests__/

packages/react-native/src/game-name/
├── game-name.tsx
├── use-game-name.ts
├── types.ts
├── styles.ts
├── utils.ts
└── index.ts

packages/react/src/game-name/
├── game-name.tsx
├── use-game-name.ts
├── types.ts
└── index.ts
```

Each complete contribution supplies typed configuration, state, and results; pure logic; validation; deterministic tests; controlled and asynchronous modes where meaningful; native and web platform UI; reset and disabled behavior; accessibility; reduced motion; customization; Expo and Vite examples; documentation; exact exports; and a Changeset.

Share only concepts that genuinely apply across games: results, rewards, randomness, providers, lifecycle vocabulary, errors, and small validated utilities. Specialized engines should keep specialized APIs.
