# ADR 0006: Use contract-based Solution and Plugin engines

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

Core must remain business-neutral while Projects install business capabilities and
extensions evolve independently.

## Decision

Solutions publish signed versioned manifests and public contracts. Plugins target one
Solution's declared extension contract and the Core Plugin SDK. Applications compose
only deployment-allowlisted packages, and installation is Project-scoped.

## Alternatives considered

- Business conditionals in Core: rejected because it reverses dependency direction and
  prevents independent evolution.
- Undeclared runtime discovery: rejected due to compatibility and supply-chain risk.

## Consequences

Extension points require deliberate design and compatibility tests. Core can manage
lifecycle without knowing business behavior.
