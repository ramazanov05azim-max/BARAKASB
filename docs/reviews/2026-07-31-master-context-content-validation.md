# BARAKASB Master Context content validation

- **Date:** 2026-07-31
- **Master Context version:** 1.0
- **Validation result:** Conflicts found
- **Scope:** Master Context, accepted ADRs, current architecture, governance, product/UX
  documentation, Coffee blueprint and roadmaps, onboarding, and Phase 5 repository
  status

## Executive result

`docs/BARAKASB_MASTER_CONTEXT.md` was read completely. Its core product model is
consistent with the repository on Project isolation, the Core → Solutions → Plugins
dependency direction, Coffee as the reference Solution, employee/admin separation,
least-privilege intent, responsive design, localization, and the approved technology
family.

The document cannot yet become the unqualified mandatory starting document because the
conflicts below include accepted ADRs and current architecture. The Master Context
itself states that officially approved ADR decisions take precedence. No architecture
document or ADR was changed, and the Master Context was not rewritten or expanded.

The architecture checker passes. Repository-wide Prettier validation currently flags the
Master Context itself; it was intentionally left unchanged in accordance with the
instruction not to rewrite or expand it.

## Conflicts

### MVC-001 — Document authority and architecture-change order

- **Conflicting document:** `docs/governance/architecture-governance.md`
- **Conflicting section:** Sources of authority; Decision workflow
- **Master Context section:** 1. Назначение документа; 24. Правила документирования; 31.
  Правило единого источника истины
- **Explanation:** The Master Context identifies itself as the highest-priority source
  and says conceptual changes are entered there first. Architecture governance requires
  cross-cutting decisions to be proposed and accepted through an ADR before architecture
  documentation and implementation are changed. Master Context section 1 recognizes
  accepted ADR precedence, while section 31 can be read as reversing that workflow.
- **Recommended resolution:** Clarify, through an owner-approved Master Context update,
  that it is the mandatory product-context entry point but not a replacement for the ADR
  process. For architecture changes, the accepted or superseding ADR must remain the
  durable decision authority; the Master Context is updated as part of the same approved
  change.

### MVC-002 — Existing documentation entry points

- **Conflicting documents:** `docs/index.md`, `README.md`, `docs/onboarding/README.md`,
  `CONTRIBUTING.md`
- **Conflicting sections:** Documentation index opening statement; README repository
  map; onboarding required reading order; contributing “Before implementation”
- **Master Context sections:** Назначение документа; 31. Правило единого источника
  истины; 32. Инструкция для нового GPT, Codex или разработчика
- **Explanation:** The existing documentation still declares `docs/index.md` canonical,
  sends new developers directly to onboarding, and begins implementation prerequisites
  without the Master Context.
- **Recommended resolution:** After the substantive conflicts in this report are
  resolved, make the Master Context mandatory first reading in all four documents.
  Preserve `docs/index.md` as the documentation catalog and onboarding as the ordered
  learning path that follows the Master Context.

### MVC-003 — Cross-Project business summary

- **Conflicting documents:** `docs/architecture/tenancy-and-isolation.md`,
  `docs/architecture/analytics-and-reporting.md`, `UX_FOUNDATION.md`
- **Conflicting sections:** Cross-project operations; Analytics boundary and governance;
  Project switching
- **Master Context section:** 2. Что такое BARAKASB
- **Explanation:** The Master Context says a user can view a general consolidated
  summary across all their Projects. Current architecture forbids interactive
  cross-Project business queries against operational data. UX permits only approved
  platform metadata and health summaries in My Projects, not combined business records.
  ADR 0036 permits cross-Project reporting only through a governed, audited, eventually
  consistent analytics plane.
- **Recommended resolution:** Define what “общая сводная информация” contains. Either
  restrict it to approved platform metadata/health, or explicitly define a
  capability-gated portfolio analytics product implemented through the ADR 0036
  analytics plane with purpose, privacy, retention, and disclosure controls. Never
  implement it as an operational cross-Project query.

### MVC-004 — Registration and identity model

- **Conflicting documents:** `docs/architecture/authentication.md`,
  `docs/adr/0004-oidc-authentication.md`
- **Conflicting sections:** Protocol; identity semantics; ADR Decision
- **Master Context section:** 8. Модель пользователя
- **Explanation:** The Master Context specifies registration by phone number or email.
  Accepted ADR 0004 requires provider-neutral OIDC, delegates credential handling to the
  identity provider, requires a verified email capability, and states that email is
  contact/recovery metadata rather than identity. A BARAKASB-owned phone-or-email
  credential flow, especially phone-only identity, is not authorized by the ADR.
- **Recommended resolution:** Clarify that phone/email are allowed identity-provider
  sign-in or contact methods while BARAKASB identity remains issuer-plus-subject and
  OIDC-based. If first-party or phone-only authentication is required, create a
  superseding ADR with credential, recovery, MFA, abuse, and operating-cost analysis
  before implementation.

### MVC-005 — Role-only authorization

- **Conflicting documents:** `docs/architecture/authorization.md`,
  `docs/adr/0005-capability-authorization.md`, `COFFEE_ROLES.md`,
  `COFFEE_PERMISSIONS.md`
- **Conflicting sections:** Authorization model; capability naming; role model;
  capability convention and sensitive-action rules
- **Master Context sections:** 16. Модель ролей; 17. Права доступа
- **Explanation:** The Master Context says permissions are assigned exclusively through
  roles and managed by the Project owner. Accepted ADR 0005 makes authorization a
  combination of active membership, role-granted stable capabilities, contextual policy,
  target ownership, lifecycle state, and deny-by-default enforcement. Coffee
  documentation also allows delegated administrators within capability and
  separation-of-duty boundaries. A role name alone is explicitly not authorization
  evidence.
- **Recommended resolution:** Treat Owner, Administrator, Manager, and employee roles as
  Project-owned capability bundles or templates. State that authoritative access also
  requires contextual policy and that delegation cannot exceed the actor's delegation
  boundary. Keep the owner accountable without requiring every assignment to be
  performed personally by the owner.

### MVC-006 — Platform role taxonomy

- **Conflicting documents:** `UX_FOUNDATION.md`, `SCREEN_MAP.md`,
  `docs/architecture/authorization.md`
- **Conflicting sections:** User groups and platform-operator context; Developer
  Console; built-in administrative roles
- **Master Context section:** 16. Модель ролей
- **Explanation:** The Master Context defines only two platform roles: Developer and
  User/Account Owner. Approved UX treats developer/integrator as a Project-scoped,
  capability-controlled persona and defines a separate privileged Platform Operator
  context. Architecture states that a platform operator is not automatically a Project
  member.
- **Recommended resolution:** Do not encode Developer and User as two global
  authorization roles. Document them as personas where appropriate, retain
  Project-scoped developer capabilities, and explicitly recognize the separate
  purpose-bound Platform Operator authority.

### MVC-007 — Project-creation sequence and destination

- **Conflicting documents:** `SCREEN_MAP.md`, `USER_JOURNEYS.md`,
  `docs/architecture/project-management.md`
- **Conflicting sections:** ACC-02 Create Project; J01 Owner creates the first Project;
  Project lifecycle
- **Master Context sections:** 3. Основная идея платформы; 10. Жизненный цикл
  пользователя
- **Explanation:** The Master Context specifies category → Solution → Project name →
  creation → Administration. Approved UX specifies Basics/name and required residency →
  Solution → Plan → Review → observable provisioning → Project Dashboard. Architecture
  requires durable multi-module provisioning and does not consider a Project active
  until all required steps confirm the same operation.
- **Recommended resolution:** Select one canonical UX order and update the subordinate
  documents together. Preserve the durable provisioning state from the architecture and
  use Project Dashboard as the safe default Project route unless a separately approved
  product change replaces it. Administration should remain a capability-gated
  destination, not an automatic landing for every creator.

### MVC-008 — Generic Shared Packages zone

- **Conflicting documents:** `docs/architecture/monorepo.md`,
  `docs/adr/0038-explicit-package-taxonomy.md`
- **Conflicting sections:** Monorepo structure and dependency matrix; ADR Decision
- **Master Context section:** 27. Архитектура репозитория — Shared Packages
- **Explanation:** The Master Context introduces “Shared Packages” used by every layer
  and containing contracts, infrastructure, common libraries, and data types. Accepted
  ADR 0038 explicitly rejected a generic shared zone because its dependency direction
  becomes ambiguous. The repository instead separates Contracts, Infrastructure,
  Frontend, and Toolchain packages with different dependency rules.
- **Recommended resolution:** Replace the generic conceptual bucket in a future
  owner-approved Master Context revision with the accepted explicit package zones. Do
  not create `packages/shared` or allow every zone to import common libraries without
  dependency classification.

### MVC-009 — Plugin effect on Solution behavior

- **Conflicting documents:** `docs/architecture/plugin-engine.md`,
  `docs/architecture/extension-contracts.md`
- **Conflicting sections:** Purpose; Extension contracts; Extension-point execution
- **Master Context sections:** 6. Архитектура платформы; 19. Plugins
- **Explanation:** The Master Context says Plugins do not change Solution business
  logic. Architecture allows Plugins to contribute validators, policies, commands,
  handlers, jobs, events, and UI through explicit versioned extension points. Those
  contributions extend effective business behavior even though they cannot patch or
  deep-import Solution internals.
- **Recommended resolution:** Clarify the intended boundary: Plugins must not modify,
  replace, or bypass internal Solution invariants, but may extend behavior only through
  published contracts with declared side effects, capabilities, ordering, failure
  policy, and compatibility.

### MVC-010 — Program roadmap phase numbering

- **Conflicting documents:** `docs/roadmap.md`, `COFFEE_IMPLEMENTATION_ROADMAP.md`
- **Conflicting sections:** Foundation phases 4–5 and acceptance gate; Coffee phases 1–7
- **Master Context section:** 28. Жизненный цикл разработки
- **Explanation:** Three incompatible phase namespaces use the same labels. The Master
  Context defines Phase 4 as Coffee Blueprint, Phase 5 as Platform Frontend, and Phase 6
  as Coffee Admin Panel. The Foundation roadmap defines Phase 4 as Platform Skeleton and
  Phase 5 as Core Platform, with a mandatory acceptance gate and separate ADR before any
  business Solution. The Coffee roadmap defines its own phases 1–7, where Phase 6 is
  Analytics.
- **Recommended resolution:** Establish explicit namespaced roadmaps, for example
  “Program Phase,” “Foundation Delivery Stage,” and “Coffee Delivery Phase.” Publish one
  mapping table and retain the Foundation acceptance gate and separate Solution
  authorization ADR. Do not begin Coffee business implementation based only on a
  colliding phase number.

### MVC-011 — Current Phase 5 status

- **Conflicting documents:** `README.md`, `apps/web/README.md`,
  `docs/onboarding/README.md`
- **Conflicting sections:** Current status; web application boundary; current repository
  state
- **Master Context sections:** 28. Жизненный цикл разработки; 29. Текущее состояние
  проекта
- **Explanation:** The Master Context says Platform Frontend is in development and UI
  development has only started. The root and web READMEs state that the Phase 5
  mock-data platform frontend is implemented. Conversely, onboarding still says no
  application implementation exists. These three status descriptions cannot all be
  current.
- **Recommended resolution:** The owner should confirm Phase 5 acceptance. If accepted,
  update the Master Context status to completed and correct onboarding. If not accepted,
  define the remaining acceptance criteria and change the READMEs from “implemented” to
  the precise incomplete state.

## Non-conflicting areas

The following Master Context decisions are consistent with current documentation:

- Project is the business isolation boundary.
- Core contains platform capabilities and no industry business logic.
- Solutions own industry logic and Plugins target one Solution through explicit
  extension points.
- Coffee is the first reference Solution.
- Administrative and employee experiences are separated.
- Employee navigation follows least privilege and excludes unauthorized administration.
- Desktop, tablet, and mobile are supported according to workspace needs.
- Russian and English use externalized localization resources, with language stored as a
  user preference across Projects.
- The approved frontend/backend/data/cache/infrastructure technology family is
  compatible with the repository.
- Architecture changes require documentation and ADR governance.

## Required resolution order

1. Resolve MVC-001 so authority and change workflow are unambiguous.
2. Resolve ADR-bound conflicts MVC-004, MVC-005, MVC-006, and MVC-008 without modifying
   accepted ADRs except through formal supersession.
3. Resolve product semantics MVC-003, MVC-007, and MVC-009.
4. Namespace and reconcile the roadmaps in MVC-010.
5. Confirm and synchronize the current status in MVC-011.
6. Repeat full Master Context validation.
7. Only after a clean result, update the entry-point references identified in MVC-002
   and mark the Master Context as mandatory first reading.

Until then, future implementation must follow the Master Context where it is consistent,
and accepted ADRs plus current architecture where an identified conflict exists, which
is also the precedence rule stated in Master Context section 1.
