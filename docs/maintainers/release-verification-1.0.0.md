---
title: Release verification 1.0.0
sidebar_position: 24
---

# Release verification 1.0.0

This is the post-publication verification record for the five public `1.0.0` packages. It records
failures and untested human gates explicitly; it is not a claim that the entire accessibility matrix
passed.

## Scope

| Item                                | Verified value                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Date                                | 2026-08-13                                                                     |
| Package release commit              | `8187664`                                                                      |
| Documentation commit at audit start | `77c7a81`                                                                      |
| Packages                            | `@jackpotkit/core`, `react`, `react-native`, `testing`, and `theme` at `1.0.0` |
| Host                                | macOS 26.5.2, Apple Silicon, Node.js 24.19.0, pnpm 11.21.0                     |
| Web engines                         | Chrome 151.0.7922.109, Playwright Firefox, and Playwright WebKit               |
| Native target                       | Expo 57, React Native 0.86.2, iOS 26.5 iPhone 17 Pro simulator                 |

Two clean consumer applications were created outside the monorepo so workspace linking could not
hide package or peer-dependency defects. Both applications install packages from the public npm
registry using an exact frozen lockfile.

## Automated and runtime results

| Check                                          | Result   | Evidence summary                                                                                                                                                      |
| ---------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five public npm packages resolve as ESM        | Pass     | Root and exact React game subpaths imported from `1.0.0` packages.                                                                                                    |
| Clean frozen web install                       | Pass     | A missing application peer, `@react-native/metro-config@0.86.2`, was declared by the consumer and the frozen reinstall passed.                                        |
| TypeScript and Vite production build           | Pass     | The consumer rendered all seven games using public package APIs only.                                                                                                 |
| Chrome, Firefox, and WebKit render smoke tests | Pass     | 15 cross-engine tests covered rendering, keyboard reachability, accessible actions, reduced motion, and an effective 200% viewport.                                   |
| Default-theme axe WCAG 2 A/AA scan             | Pass     | One scan passed in each of the three engines.                                                                                                                         |
| Neon-theme axe WCAG 2 A/AA scan                | **Fail** | Coin Flip's `Heads` label uses cyan `#00E5FF` on yellow `#FFE66D`, measured at 1.22:1 instead of the required 3:1 for its large bold text.                            |
| Expo Doctor                                    | Pass     | 20 of 20 checks passed in the clean native consumer.                                                                                                                  |
| iOS and Android production JavaScript exports  | Pass     | Both platform bundles exported from the clean consumer.                                                                                                               |
| iOS Release build, install, and launch         | Pass     | Xcode 26.6 built and launched the app on an iOS 26.5 iPhone 17 Pro simulator without a JavaScript crash.                                                              |
| iOS automated game interactions                | **Fail** | A follow-up auto-play run reproduced a `SIGABRT` in Hermes/Worklets when Dice completed its animation; Coin Flip and Lucky Box used the same unsafe callback pattern. |
| iOS largest accessibility text size            | **Fail** | Slot Machine symbols are clipped inside their fixed-size cells at `accessibility-extra-extra-extra-large`.                                                            |
| Android runtime and TalkBack                   | Not run  | No connected Android device, AVD, or installed Android system image was available.                                                                                    |

The web checks also verified that every default accessible game action can complete without pointer
gestures. This includes the Scratch Card Reveal alternative.

## Release findings

The failures below affect the published `1.0.0` components and should be fixed in a patch release:

1. Replace locally defined Reanimated `runOnJS` closures in Dice, Coin Flip, and Lucky Box with
   stable callbacks created on the React Native JavaScript thread.
2. Give the neon Coin Flip face label a color that meets WCAG contrast against the coin background.
3. Prevent decorative Slot Machine symbols from scaling beyond their fixed visual cells while
   preserving a fully scalable accessible label and result announcement.

## Human gates still required

Automation did not complete these release gates:

- keyboard and 200% zoom review in the installed Safari and Firefox applications;
- VoiceOver review on macOS and iOS, including focus order and result announcements;
- Android runtime review with TalkBack, large text, and Reduce Motion;
- touch exploration on physical iOS and Android devices;
- visual review of both themes with actual system accessibility settings enabled.

WebKit automation provides useful Safari-engine coverage but is not recorded as an installed Safari
manual pass. Similarly, setting a simulator content-size category is evidence for large-text layout,
not a substitute for VoiceOver review.

## Reproduction

The clean web consumer used `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm test`. The clean
native consumer used the same frozen install followed by `pnpm typecheck`, `pnpm expo-doctor`, Expo
production exports for iOS and Android, and an iOS Release simulator build.

Until the defects are patched and the remaining human matrix is recorded, this audit remains
open even though `1.0.0` is already publicly available.
