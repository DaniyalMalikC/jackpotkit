# Security Policy

## Reporting a vulnerability

Use the repository's private GitHub Security Advisory interface to report a suspected vulnerability. Do not open a public issue containing exploit details, credentials, customer data, or unpublished security findings.

Include affected versions or commits, reproduction steps, impact, and any suggested mitigation. The maintainer will acknowledge the report, investigate it, and coordinate disclosure when a fix is available.

## Supported versions

The latest published release line receives security fixes. After `1.0.0`, the latest stable major is
supported; fixes for older majors are best effort unless a release notice says otherwise. Unreleased
commits, prereleases, and internal entrypoints may change while a report is investigated.

## Security boundary

JackpotKit provides game mechanics and presentation. It does not provide authentication, authorization, payments, wallets, KYC, settlement, licensing, reward fulfilment, or fraud controls.

Client-side results can be inspected or manipulated. Valuable or security-sensitive rewards should use a backend that validates eligibility, calculates and persists the result, and returns that result for JackpotKit to render. Built-in random sources must not be treated as cryptographically secure, certified, regulator-approved, or sufficient for regulated gambling.

## Telemetry and privacy

JackpotKit has no backend and sends no telemetry, identifiers, device data, usage data, or game results by default.
