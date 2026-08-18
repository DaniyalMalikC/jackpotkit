---
title: Accessibility review
sidebar_position: 12
---

# Accessibility review

Accessibility is part of the public component contract, not an optional visual enhancement.

## Implemented baseline

- Every game has a visible, keyboard or screen-reader-operable primary action.
- Busy and disabled states are exposed while results or animations are pending.
- Results remain visible text and are announced through platform live-region APIs.
- Bingo uses semantic buttons and prevents activation of uncalled cells.
- Scratch Card includes an explicit Reveal action so pointer gestures are never the only path.
- Default content does not rely on color alone for selected, winning, unavailable, or completed state.
- Components honor the platform reduced-motion preference and support an explicit override.
- Custom renderers receive state needed to preserve labels, contrast, and non-color-only meaning.

React web renderers run automated WCAG 2 A/AA checks with axe-core. React Native component tests
cover roles, labels, states, result announcements, reduced motion, and reset behavior. These checks
catch structural regressions but do not replace device review.

## Stable-release manual matrix

Before a stable release, verify the current examples with:

- keyboard-only navigation in current Chrome, Firefox, and Safari;
- VoiceOver on iOS and macOS;
- TalkBack on Android;
- 200% browser zoom and large system text;
- Reduce Motion enabled on web, iOS, and Android;
- light and neon themes with a contrast tool;
- touch exploration and the Scratch Card non-gesture Reveal path.

Record the tested OS, browser or device, assistive technology, package commit, and any accepted
limitations in the release pull request. A serious regression blocks stable publication.

The [1.0.0 post-publication verification record](./release-verification-1.0.0.md) preserves the first
stable audit results without treating automated engine coverage as a completed manual review.

## Consumer responsibility

Custom labels, renderers, images, themes, and result copy can change accessibility. Consumers must
preserve semantic controls, meaningful names, focus visibility, readable contrast, and equivalent
non-gesture operation when replacing defaults.
