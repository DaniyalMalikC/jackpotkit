---
title: Server-authoritative results
sidebar_position: 3
---

# Server-authoritative results

Client-side outcomes can be inspected or manipulated. Applications must not trust client randomness for valuable, security-sensitive, or eligibility-controlled rewards.

The intended data flow is:

```text
UI requests play
    ↓
Backend validates eligibility
    ↓
Backend calculates and persists the result
    ↓
Backend returns the result
    ↓
JackpotKit validates and renders that result
```

Networking does not belong inside JackpotKit. A consumer supplies a result provider, while the component handles requesting, validation, lifecycle state, and animation toward the supplied destination.

Built-in random sources are intended for demonstrations, ordinary gamification, reproducible testing, and debugging. They are not represented as cryptographically secure, certified, regulator-approved, or inherently fair.
