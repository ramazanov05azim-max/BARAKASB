# Master Context conflict summary

- **Conflict #:** MVC-001
- **File:** `docs/governance/architecture-governance.md`
- **Section:** Sources of authority; Decision workflow
- **One-sentence explanation:** Master Context section 31 can be read as requiring
  Master Context changes before ADR approval, while governance requires an accepted ADR
  before cross-cutting architecture changes.
- **Recommended action:** Clarify that Master Context is the mandatory product-context
  entry point but accepted or superseding ADRs remain authoritative for architecture
  decisions.

- **Conflict #:** MVC-002
- **File:** `docs/index.md`; `README.md`; `docs/onboarding/README.md`; `CONTRIBUTING.md`
- **Section:** Index opening; Repository map; Required reading order; Before
  implementation
- **One-sentence explanation:** Existing entry points direct developers to the
  documentation index or onboarding without requiring Master Context first.
- **Recommended action:** After substantive conflicts are resolved, make Master Context
  mandatory first reading while retaining the index as the documentation catalog.

- **Conflict #:** MVC-003
- **File:** `docs/architecture/tenancy-and-isolation.md`;
  `docs/architecture/analytics-and-reporting.md`; `UX_FOUNDATION.md`
- **Section:** Cross-project operations; Analytics boundary and governance; Project
  switching
- **One-sentence explanation:** Master Context permits a consolidated multi-Project
  summary while architecture and UX prohibit interactive aggregation of operational
  business data.
- **Recommended action:** Restrict the summary to platform metadata or define a
  capability-gated portfolio analytics product through the ADR 0036 governed analytics
  plane.

- **Conflict #:** MVC-004
- **File:** `docs/architecture/authentication.md`;
  `docs/adr/0004-oidc-authentication.md`
- **Section:** Protocol; Identity semantics; ADR Decision
- **One-sentence explanation:** Master Context specifies phone-or-email registration
  while ADR 0004 requires provider-neutral OIDC identity and treats email as contact
  metadata.
- **Recommended action:** Define phone and email as identity-provider methods, or
  approve a superseding ADR before implementing first-party or phone-only
  authentication.

- **Conflict #:** MVC-005
- **File:** `docs/architecture/authorization.md`;
  `docs/adr/0005-capability-authorization.md`; `COFFEE_ROLES.md`;
  `COFFEE_PERMISSIONS.md`
- **Section:** Authorization model; Capability naming; Role model; Capability rules
- **One-sentence explanation:** Master Context describes role-only, owner-managed
  permissions while accepted architecture also requires capabilities, contextual policy,
  resource ownership, lifecycle checks, and delegated boundaries.
- **Recommended action:** Treat roles as Project-owned capability bundles and retain
  authoritative contextual policy and bounded delegation.

- **Conflict #:** MVC-006
- **File:** `UX_FOUNDATION.md`; `SCREEN_MAP.md`; `docs/architecture/authorization.md`
- **Section:** User groups; Platform-operator context; Developer Console; Administrative
  roles
- **One-sentence explanation:** Master Context defines Developer and User as global
  platform roles while approved UX defines Project-scoped developer capabilities and a
  separate Platform Operator authority.
- **Recommended action:** Model Developer and User as personas, retain Project-scoped
  developer permissions, and document Platform Operator as a separate privileged
  authority.

- **Conflict #:** MVC-007
- **File:** `SCREEN_MAP.md`; `USER_JOURNEYS.md`;
  `docs/architecture/project-management.md`
- **Section:** ACC-02 Create Project; J01 first Project; Project lifecycle
- **One-sentence explanation:** Master Context sends category → Solution → name →
  Administration while approved UX includes basics, plan, review, durable provisioning,
  and a Dashboard destination.
- **Recommended action:** Select one canonical sequence, preserve durable provisioning,
  and keep Project Dashboard as the default route unless an approved product decision
  changes it.

- **Conflict #:** MVC-008
- **File:** `docs/architecture/monorepo.md`;
  `docs/adr/0038-explicit-package-taxonomy.md`
- **Section:** Monorepo structure and dependency matrix; ADR Decision
- **One-sentence explanation:** Master Context introduces generic Shared Packages while
  ADR 0038 explicitly replaces that zone with Contracts, Infrastructure, Frontend, and
  Toolchain packages.
- **Recommended action:** Replace the generic Shared Packages concept with the accepted
  explicit package taxonomy and do not create `packages/shared`.

- **Conflict #:** MVC-009
- **File:** `docs/architecture/plugin-engine.md`;
  `docs/architecture/extension-contracts.md`
- **Section:** Purpose; Extension contracts; Extension-point execution
- **One-sentence explanation:** Master Context says Plugins do not change Solution
  business logic while architecture permits controlled behavior extensions through
  validators, policies, commands, handlers, jobs, events, and UI slots.
- **Recommended action:** Clarify that Plugins cannot patch or bypass Solution internals
  but may extend behavior through published contracts.

- **Conflict #:** MVC-010
- **File:** `docs/roadmap.md`; `COFFEE_IMPLEMENTATION_ROADMAP.md`
- **Section:** Foundation phases 4–5 and acceptance gate; Coffee phases 1–7
- **One-sentence explanation:** Master, Foundation, and Coffee roadmaps assign different
  meanings to identical phase numbers.
- **Recommended action:** Namespace the roadmaps, publish a mapping table, and retain
  the Foundation acceptance gate and separate ADR before Coffee implementation.

- **Conflict #:** MVC-011
- **File:** `README.md`; `apps/web/README.md`; `docs/onboarding/README.md`
- **Section:** Current status; Web application boundary; Current repository state
- **One-sentence explanation:** Master Context says Phase 5 is in development, the
  READMEs say the frontend is implemented, and onboarding says no application
  implementation exists.
- **Recommended action:** Confirm Phase 5 acceptance and synchronize Master Context,
  README, web README, and onboarding to one factual status.
