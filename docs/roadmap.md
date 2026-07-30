# Foundation roadmap

This roadmap defines gates, not delivery dates.

## Phase 1 — Architecture and documentation

- Monorepo and module boundaries documented
- Core/Solution/Plugin dependency model decided
- Authentication, authorization, and Project isolation designed
- API, event, persistence, observability, security, and operations standards set
- ADR process established
- Enterprise architecture review completed with control/data-plane, cache-isolation,
  extension-trust, and data-lifecycle corrections

## Phase 2 — Architecture validation and hardening

- Challenge every ADR and documentation area
- Separate control, data, realtime, and extension deployment planes
- Replace ambiguous shared packages with explicit Contracts and Infrastructure zones
- Establish compatibility, privileged-access, analytics, integration, and extension
  isolation decisions
- Produce the Architecture Validation Report and enforce repository checks

## Phase 3 — Product architecture and UX foundation

- Define product contexts, personas, and experience principles
- Specify every Core platform screen and state
- Define navigation, search, command palette, and notification behavior
- Establish design tokens, responsive rules, accessibility, and dark mode
- Specify reusable components and end-to-end user journeys
- Produce documentation only; no UI or business implementation

## Phase 4 — Platform skeleton

- Scaffold web, control-plane, data-plane, realtime, and extension-runner applications
- Implement validated configuration and observability bootstrap
- Establish PostgreSQL, Redis, object-storage, and OIDC development dependencies
- Enforce Nx/ESLint package boundaries
- Implement structural architecture checks in CI
- Establish CI quality and security gates

## Phase 5 — Core platform

- Identity integration and session lifecycle
- Project lifecycle and membership
- Project placement, home-region routing, and fencing epochs
- Project-scoped persistence with forced RLS
- Capability authorization and audit
- Outbox/inbox and worker runtime
- Solution and Plugin manifest registries

## Foundation acceptance gate

Before any business Solution is created:

- two-Project isolation tests pass at API, database, cache, object, job, event,
  frontend, and WebSocket layers;
- authentication/session and authorization threat cases pass;
- migrations and backup restore are proven;
- observability and incident runbooks cover Core;
- extension manifests, compatibility, lifecycle, and kill-switch behavior are
  implemented and tested;
- authenticated cache-bleed, connection-pool RLS leakage, stale policy-revision, and
  stale placement-epoch tests pass;
- extension artifact provenance, digest binding, revocation, desired-state
  reconciliation, and fleet migration controls are proven;
- production-readiness review includes capacity, noisy-neighbor, cell failure, data
  classification, residency, retention, and selective recovery evidence;
- CI enforces boundaries, contracts, supply-chain controls, and quality gates.

Only after this gate may a separate ADR authorize the first Solution.
