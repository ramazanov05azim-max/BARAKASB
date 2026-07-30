# BARAKASB Screen Map

## Screen contract

Every screen below has a business purpose and an explicit next action. Routes are
conceptual product contracts, not implementation. Solution-owned screens inherit this
contract but define their business content separately.

## Route inventory

| ID      | Screen                     | Context           | Conceptual route                                                |
| ------- | -------------------------- | ----------------- | --------------------------------------------------------------- |
| PUB-01  | Landing Page               | Public            | `/`                                                             |
| AUTH-01 | Registration               | Public            | `/register`                                                     |
| AUTH-02 | Authentication             | Public            | `/login`                                                        |
| AUTH-03 | Forgot Password / Recovery | Public            | `/recover`                                                      |
| AUTH-04 | Account Security Setup     | Account           | `/welcome/security`                                             |
| ACC-01  | My Projects                | Account           | `/projects`                                                     |
| ACC-02  | Create Project             | Account           | `/projects/new`                                                 |
| ACC-03  | Profile & Security         | Account           | `/profile`                                                      |
| ACC-04  | Notifications              | Account           | `/notifications`                                                |
| CAT-01  | Solution Catalog           | Account/Project   | `/solutions` or `/projects/{projectId}/admin/solutions/catalog` |
| PRJ-01  | Project Dashboard          | Project           | `/projects/{projectId}`                                         |
| PRJ-02  | Employee Workspace         | Project           | `/projects/{projectId}/work`                                    |
| ADM-01  | Administration Overview    | Project           | `/projects/{projectId}/admin`                                   |
| ADM-02  | People & Access            | Project           | `/projects/{projectId}/admin/people`                            |
| ADM-03  | Solutions                  | Project           | `/projects/{projectId}/admin/solutions`                         |
| ADM-04  | Project Settings           | Project           | `/projects/{projectId}/admin/settings`                          |
| COM-01  | Subscription               | Project           | `/projects/{projectId}/admin/subscription`                      |
| COM-02  | Billing                    | Project           | `/projects/{projectId}/admin/billing`                           |
| DEV-01  | Developer Console          | Project           | `/projects/{projectId}/admin/developer`                         |
| OPS-01  | Platform Settings          | Platform operator | `/platform`                                                     |
| SYS-01  | System State Screens       | Any               | contextual                                                      |

## Public and authentication

### PUB-01 — Landing Page

| Aspect               | Specification                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Explain the multi-Project Business OS promise, establish trust, and move a qualified visitor to account creation or sign-in.                                                              |
| Target user          | Prospective owner, invited employee, evaluator.                                                                                                                                           |
| Actions              | Primary: Create account. Secondary: Sign in. Contextual: view product model, security, pricing, and documentation.                                                                        |
| Components           | Concise value statement; three-step flow; capability summary; security/isolation statement; pricing entry; final CTA; footer with legal/status. No fake dashboard or decorative carousel. |
| Navigation           | Public header: Product, Security, Pricing, Documentation, Sign in, Create account. Anchor navigation on compact pages.                                                                    |
| Empty state          | Not applicable. If public catalog/pricing is unavailable, retain core value and offer contact/status.                                                                                     |
| Loading state        | Server-rendered critical content; reserve dimensions for deferred pricing/status; no full-page spinner.                                                                                   |
| Error state          | Keep primary copy and authentication actions available; failed optional regions show a local retry.                                                                                       |
| Permissions          | Public. Authenticated visitors see “Open BARAKASB” instead of registration.                                                                                                               |
| Responsive behaviour | One-column narrative on compact screens; CTA remains visible without sticky obstruction; no horizontal feature grids.                                                                     |

### AUTH-01 — Registration

| Aspect               | Specification                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Create or initiate a verified identity with the minimum required information.                                                                                                                                                |
| Target user          | New owner or employee without an account.                                                                                                                                                                                    |
| Actions              | Primary: Continue/Create account. Secondary: Sign in. Accept legal terms explicitly.                                                                                                                                         |
| Components           | Provider-neutral identity options, email field when supported, password-manager/passkey-compatible controls, terms links, progress only when multiple provider steps exist. Project creation is not mixed into registration. |
| Navigation           | Minimal public shell; logo returns home; sign-in link.                                                                                                                                                                       |
| Empty state          | Not applicable.                                                                                                                                                                                                              |
| Loading state        | Submitted control becomes “Creating account…” while fields remain stable and duplicate submission is prevented.                                                                                                              |
| Error state          | Preserve input; distinguish invalid input, existing account, expired attempt, rate limit, and provider outage without revealing unrelated identities.                                                                        |
| Permissions          | Public; existing authenticated sessions redirect safely to My Projects.                                                                                                                                                      |
| Responsive behaviour | Single 400–480 px column; native mobile inputs; legal text readable without side panels.                                                                                                                                     |

### AUTH-02 — Authentication

| Aspect               | Specification                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Establish a secure session and return the user to the intended authorized destination.                                                                      |
| Target user          | Returning user or invited employee.                                                                                                                         |
| Actions              | Primary: Continue/Sign in. Secondary: use another approved identity method, recover access, create account.                                                 |
| Components           | Identity-provider choices, identifier input where applicable, passkey/MFA step, recovery link, session/security notice.                                     |
| Navigation           | Minimal shell; no Project navigation before authentication completes.                                                                                       |
| Empty state          | Not applicable.                                                                                                                                             |
| Loading state        | Show the current security step; external redirect receives immediate feedback; never simulate success.                                                      |
| Error state          | Safe messages for invalid credentials, locked/rate-limited attempt, expired flow, denied provider, unavailable identity service; provide recovery or retry. |
| Permissions          | Public; authentication alone grants no Project access.                                                                                                      |
| Responsive behaviour | One-column, autofill and password-manager friendly; MFA input supports paste and large touch targets.                                                       |

### AUTH-03 — Forgot Password / Account Recovery

| Aspect               | Specification                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Restore identity access without exposing whether an account exists or altering Project ownership.                                                   |
| Target user          | User unable to authenticate.                                                                                                                        |
| Actions              | Primary: Send recovery instructions or continue provider recovery. Secondary: return to sign in, contact support for a blocked enterprise identity. |
| Components           | Identifier field, neutral confirmation, recovery-code/MFA/provider step, security guidance, new-session notice.                                     |
| Navigation           | Minimal shell with Back to sign in.                                                                                                                 |
| Empty state          | Not applicable.                                                                                                                                     |
| Loading state        | Preserve the entered identifier; show request progress and prevent rapid repeats.                                                                   |
| Error state          | Use account-existence-neutral copy; explain expired token, invalid step, rate limit, or provider outage with a safe restart path.                   |
| Permissions          | Public initiation; sensitive completion requires possession/provider proof and may require step-up checks.                                          |
| Responsive behaviour | Single column; links and codes wrap safely; no countdown that creates unnecessary urgency.                                                          |

### AUTH-04 — Account Security Setup

| Aspect               | Specification                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Purpose              | Complete required verification, MFA/passkey, recovery, and notification setup before sensitive use.               |
| Target user          | Newly registered user or user subject to a new security policy.                                                   |
| Actions              | Primary: Complete current security step. Secondary: use another allowed method; sign out.                         |
| Components           | Stepper, device/passkey name, recovery method, confirmation summary, policy explanation.                          |
| Navigation           | Focused setup shell; return destination shown but blocked only when policy requires completion.                   |
| Empty state          | If no setup is required, redirect to the intended account destination.                                            |
| Loading state        | Each verified step confirms authoritatively; external device approval remains backgroundable where possible.      |
| Error state          | Preserve completed steps; offer retry or alternative approved method; expired enrollment restarts only that step. |
| Permissions          | Authenticated user; recent authentication required.                                                               |
| Responsive behaviour | Full-width compact stepper labels; QR and cross-device instructions have text alternatives.                       |

## Account context

### ACC-01 — My Projects

| Aspect               | Specification                                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Let a user find, understand, enter, or create an authorized Project without mixing business data.                                                                                                          |
| Target user          | Every authenticated user with zero or more memberships.                                                                                                                                                    |
| Actions              | Primary: Open the most relevant Project or Create Project when none exists. Secondary: search, filter by status, accept invitation.                                                                        |
| Components           | Page header, Project search, status filters, recent/list toggle, Project cards or table, pending invitations, create action. Cards show name, status, role, approved attention summary, and last activity. |
| Navigation           | Account context; global header shows “All Projects.” Selecting a Project changes security context.                                                                                                         |
| Empty state          | Explain Projects in one sentence. Primary: Create Project. If creation is unavailable, show pending invitation/help path.                                                                                  |
| Loading state        | Stable card/list skeleton; invitations and list may load independently.                                                                                                                                    |
| Error state          | Preserve available Projects; failed list region offers retry. Never imply inaccessible Projects.                                                                                                           |
| Permissions          | Lists only active/allowed memberships and lifecycle-visible Projects. Create action requires account/platform eligibility.                                                                                 |
| Responsive behaviour | Cards stack on compact; search and filter move into a sheet; primary action stays near title.                                                                                                              |

### ACC-02 — Create Project

| Aspect               | Specification                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Create an isolated Project and select its initial Solution with minimal decisions.                                                                                                                |
| Target user          | Eligible owner creating a first or additional Project.                                                                                                                                            |
| Actions              | Primary by step: Continue, Choose Solution, Review, Create Project. Secondary: Back, Save/exit only if safe.                                                                                      |
| Components           | Four-step flow: Basics, Solution, Plan, Review. Basics requests only Project name and required region/residency choices. Review states owner, isolation, selected Solution, price, and next step. |
| Navigation           | Focused flow entered from My Projects or switcher. Cancel returns without creating a Project.                                                                                                     |
| Empty state          | Solution step may offer “Start without a Solution” only if the platform supports a useful Core-only Project; otherwise explain catalog unavailability.                                            |
| Loading state        | Creation becomes an observable provisioning screen with stages and safe “Go to My Projects.”                                                                                                      |
| Error state          | Preserve draft; field errors stay local; provisioning failure explains whether nothing was created or recovery is in progress and offers retry/support.                                           |
| Permissions          | Requires Project creation eligibility and any plan/region policy. Creator becomes initial owner only after authoritative provisioning.                                                            |
| Responsive behaviour | One-column steps; summary becomes a final page rather than a side panel; no horizontal stepper overflow.                                                                                          |

### ACC-03 — Profile & Security

| Aspect               | Specification                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Manage personal identity metadata, preferences, security methods, sessions, and notification channels.                                            |
| Target user          | Authenticated account holder.                                                                                                                     |
| Actions              | Edit profile, change locale/theme, add/remove security method, revoke session, manage notification preferences, sign out all devices.             |
| Components           | Profile, Preferences, Security, Sessions, Notifications tabs; verified-contact status; session list with device/activity; recent security events. |
| Navigation           | Account context from avatar menu. Breadcrumb omitted.                                                                                             |
| Empty state          | No secondary sessions/security methods: explain and offer Add method. Required recovery channel cannot be empty.                                  |
| Loading state        | Sections load independently; security controls remain unavailable until current state is verified.                                                |
| Error state          | Never remove the existing method visually until confirmed; explain partial save and allow section retry.                                          |
| Permissions          | Self only; sensitive changes require recent step-up authentication. Project administrators cannot edit another person's profile.                  |
| Responsive behaviour | Tabs become anchored sections or selector; session rows become labeled cards; destructive actions remain explicit.                                |

### ACC-04 — Notifications

| Aspect               | Specification                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose              | Provide one prioritized inbox for actionable account and authorized Project events.                                                        |
| Target user          | Authenticated user.                                                                                                                        |
| Actions              | Open item, mark read/unread, mark visible items read, filter by Project/category/status, manage preferences.                               |
| Components           | Filter/search bar, grouped notification list, Project label, severity/category, timestamp, primary destination, read state.                |
| Navigation           | Account context; selecting a different-Project notification asks before context switch.                                                    |
| Empty state          | “You're up to date” plus link to preferences. Filtered empty state offers Clear filters.                                                   |
| Loading state        | List skeleton; background refresh preserves current items and scroll.                                                                      |
| Error state          | Cached/available items remain; failed refresh shows freshness and retry. Expired or unauthorized destination explains that access changed. |
| Permissions          | Only notifications addressed to the actor and currently disclosable metadata. Marking read is personal state.                              |
| Responsive behaviour | Filters use a sheet; rows stack; bulk action operates on the visible filtered set and confirms scope.                                      |

## Catalog and Project context

### CAT-01 — Solution Catalog

| Aspect               | Specification                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Help an owner choose an approved Solution based on business outcome, trust, compatibility, and cost.                                                                                    |
| Target user          | Project creator, owner, or administrator with Solution-management access.                                                                                                               |
| Actions              | Search/filter, compare limited candidates, view details, select during creation, install into an existing Project.                                                                      |
| Components           | Outcome categories, search, Solution cards, publisher/trust, supported capabilities, compatibility, pricing, data/permission summary, details page, install CTA. No popularity theater. |
| Navigation           | Global catalog during creation; Project Administration catalog during installation. Returning preserves the originating flow.                                                           |
| Empty state          | No matching Solution: clear filters and explain availability constraints. Catalog unavailable: installation blocked safely with status link.                                            |
| Loading state        | Card skeletons and stable filters; details load without losing results position.                                                                                                        |
| Error state          | Partial catalog remains browsable; compatibility or price uncertainty disables installation and explains why.                                                                           |
| Permissions          | Browsing may be public/account-scoped by policy; installation requires Project capability and effective compatibility.                                                                  |
| Responsive behaviour | One-column cards; filter sheet; comparison becomes vertically grouped attributes, not a wide table.                                                                                     |

### PRJ-01 — Project Dashboard

| Aspect               | Specification                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose              | Summarize Project health, priority work, and the safest next action.                                                                                                                                   |
| Target user          | Any active Project member; content varies by capability.                                                                                                                                               |
| Actions              | Complete highest-priority item, open workspace, continue setup, review an allowed alert.                                                                                                               |
| Components           | Project identity/status, attention queue first, setup progress when incomplete, role-aware KPI/health widgets, assigned work, recent activity, up to four quick actions.                               |
| Navigation           | Project context; Dashboard is the default Project route. Solution widgets link only to their owned routes.                                                                                             |
| Empty state          | New Project shows a short setup sequence: confirm Solution, invite people, configure required settings, enter workspace. Employee with no visible data sees available workspace/help, not admin setup. |
| Loading state        | Independent widget skeletons; attention and lifecycle state load first; one widget never blocks others.                                                                                                |
| Error state          | Failed widget is isolated with retry and freshness; Project suspension/degradation uses a persistent truthful banner.                                                                                  |
| Permissions          | Widget registration and data are capability-filtered. Hidden metrics do not leave gaps or reveal counts.                                                                                               |
| Responsive behaviour | Single priority column on mobile; widgets reorder by urgency; charts simplify while exact values remain.                                                                                               |

### PRJ-02 — Employee Workspace

| Aspect               | Specification                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Give employees a focused entry to assigned work and permitted Solution workflows without administrative complexity.                                                                   |
| Target user          | Non-administrative Project member and operational specialist.                                                                                                                         |
| Actions              | Open assigned/available work, continue recent task, search authorized records, view relevant notifications.                                                                           |
| Components           | Workspace header, “Next work” queue, recent items, Solution navigation, compact status/help. Content is declared by installed Solutions; Core provides shell and state patterns only. |
| Navigation           | Project Workspaces section. Administration is absent unless independently permitted.                                                                                                  |
| Empty state          | No assigned work: state that nothing requires attention and show available workspace destinations. No installed accessible Solution: contact administrator/help.                      |
| Loading state        | Shell and Project identity render first; Solution regions load independently with budgets.                                                                                            |
| Error state          | A failing Solution region cannot break shell or another Solution; offer retry/status and safe Dashboard return.                                                                       |
| Permissions          | Only effective Solution installations and actor capabilities. No impersonation or cross-Project workspace aggregation.                                                                |
| Responsive behaviour | Task-first single column; frequent actions reachable with one hand; dense desktop controls become labeled mobile actions.                                                             |

## Project administration

### ADM-01 — Administration Overview

| Aspect               | Specification                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Show Project administrators configuration health and the next governance action.                                                                                |
| Target user          | Owner or administrator.                                                                                                                                         |
| Actions              | Resolve setup/security/billing issue, invite employee, manage Solution, review Project settings.                                                                |
| Components           | Administration health checklist, people summary, Solution status, subscription/billing status, integration health, recent administrative activity, quick links. |
| Navigation           | Project → Administration. Child sections remain in the administration rail/group.                                                                               |
| Empty state          | New Project shows ordered setup tasks, not blank metrics.                                                                                                       |
| Loading state        | Checklist/lifecycle loads first; summaries independently.                                                                                                       |
| Error state          | Partial summaries remain; security/billing uncertainty is prominent and prevents unsafe related changes.                                                        |
| Permissions          | Requires at least one administration read capability; each card/action is independently capability-gated.                                                       |
| Responsive behaviour | Checklist before summaries; cards stack; secondary administration navigation becomes selector.                                                                  |

### ADM-02 — People & Access

| Aspect               | Specification                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose              | Invite people and maintain Project membership and role assignments safely.                                                           |
| Target user          | Owner or administrator with membership capabilities.                                                                                 |
| Actions              | Invite, resend/revoke invitation, change roles, suspend/remove membership, transfer ownership through its dedicated flow.            |
| Components           | Member table, invitation list, role summaries, search/filter, invite dialog/page, permission-impact preview, last-owner warning.     |
| Navigation           | Project → People; member detail uses breadcrumb.                                                                                     |
| Empty state          | Only owner exists: explain roles and primary Invite employee action. Filtered empty clears filters.                                  |
| Loading state        | Table skeleton; mutations keep existing state and show row-level progress.                                                           |
| Error state          | Conflict/stale revision reloads affected member; failed invitation preserves input; never expose an identity from another Project.   |
| Permissions          | Read and manage are separate. Users may see their own effective roles. Last owner and step-up invariants are enforced and explained. |
| Responsive behaviour | Member rows become cards; bulk actions are desktop-only unless safe selection remains clear; invite flow is full screen.             |

### ADM-03 — Solutions

| Aspect               | Specification                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | See installed Solution health and safely install, configure, upgrade, disable, or recover one.                                                                             |
| Target user          | Owner or Solution administrator.                                                                                                                                           |
| Actions              | Browse catalog, open installation, change allowed configuration, upgrade, retry, disable, uninstall through reviewed lifecycle flow.                                       |
| Components           | Installed list, desired/effective version, health, compatibility, operation progress, capability/data impact, Plugins grouped under target Solution, kill/recovery status. |
| Navigation           | Project → Administration → Solutions → Solution detail.                                                                                                                    |
| Empty state          | Explain that Solutions provide business workspaces; primary Browse catalog.                                                                                                |
| Loading state        | Installed-state skeleton; long lifecycle operations use persistent background operation cards.                                                                             |
| Error state          | Distinguish degraded, failed install, compatibility blocked, revoked artifact, and unavailable catalog; show what remains active and next recovery.                        |
| Permissions          | Read, install, configure, upgrade, disable, and uninstall capabilities may differ. Price/billing changes require corresponding access.                                     |
| Responsive behaviour | List becomes status cards; lifecycle detail and impact review use full pages, not cramped dialogs.                                                                         |

### ADM-04 — Project Settings

| Aspect               | Specification                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose              | Maintain Core Project identity, allowed preferences, lifecycle, and ownership controls.                                                                      |
| Target user          | Owner or administrator; destructive sections are owner-only by default.                                                                                      |
| Actions              | Rename Project, update approved locale/time settings, archive/restore, transfer ownership, initiate deletion.                                                |
| Components           | General settings, lifecycle status, ownership, data/residency readout, danger zone, audit links. Business profile fields are absent and belong to Solutions. |
| Navigation           | Project → Administration → Project Settings.                                                                                                                 |
| Empty state          | Not applicable; unavailable optional setting explains policy ownership.                                                                                      |
| Loading state        | Read-only identity renders before editable policy state; submit remains unavailable until current revision loads.                                            |
| Error state          | Preserve edits; stale revision requests review; lifecycle failure shows authoritative stage and recovery path.                                               |
| Permissions          | Section-level capabilities; ownership transfer and destructive lifecycle require recent authentication and invariant checks.                                 |
| Responsive behaviour | Single-column sections; danger zone separated by heading and spacing, not alarming decoration; confirmation becomes full-screen on mobile.                   |

## Commercial

### COM-01 — Subscription

| Aspect               | Specification                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Explain the Project's plan, included limits, current usage, renewal, and available plan changes.                                         |
| Target user          | Owner, billing administrator, authorized viewer.                                                                                         |
| Actions              | Review usage, compare plans, change plan, cancel/reactivate under transparent terms.                                                     |
| Components           | Current plan, price/currency/interval, renewal date, usage against limits, plan comparison, change-impact summary, billing contact link. |
| Navigation           | Project → Administration → Subscription. Billing is a separate sibling.                                                                  |
| Empty state          | No paid subscription/trial: explain current access and one Choose plan action.                                                           |
| Loading state        | Do not show zero price or usage while loading; skeleton preserves summary layout.                                                        |
| Error state          | Existing confirmed plan remains visible with freshness; changes are disabled if current commercial state is uncertain.                   |
| Permissions          | View and manage subscription are separate; price visibility follows organization policy.                                                 |
| Responsive behaviour | Plan comparison becomes vertically grouped; sticky confirmation summary never obscures content.                                          |

### COM-02 — Billing

| Aspect               | Specification                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Manage payment method, billing identity, invoices, and payment problems for one Project.                                                        |
| Target user          | Owner or billing administrator.                                                                                                                 |
| Actions              | Update billing details/payment method, download invoice, retry/resolve payment, manage billing contacts.                                        |
| Components           | Payment status, next charge, billing entity, payment method summary, invoice table, tax information, billing contacts, secure provider handoff. |
| Navigation           | Project → Administration → Billing.                                                                                                             |
| Empty state          | No invoices: state when the first invoice will appear. No payment method: primary Add payment method when required.                             |
| Loading state        | Masked placeholders never resemble real card data; invoices load separately.                                                                    |
| Error state          | Distinguish provider unavailable, payment failed, action required, and invoice unavailable; never duplicate a charge on retry.                  |
| Permissions          | Billing capabilities only; sensitive payment data is never shown beyond approved masked metadata.                                               |
| Responsive behaviour | Invoice table becomes labeled list; provider challenge is mobile-safe; totals and currency remain adjacent.                                     |

## Developer and platform operations

### DEV-01 — Developer Console

| Aspect               | Specification                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Configure and observe approved machine access and integrations for the active Project.                                                                                                                          |
| Target user          | Project developer/integrator with explicit capabilities.                                                                                                                                                        |
| Actions              | Create/revoke API client, rotate secret, configure webhook, inspect delivery metadata, view scopes and API documentation.                                                                                       |
| Components           | Overview, API clients, credentials one-time reveal, scopes, webhook endpoints/deliveries, usage/rate limits, audit links, documentation. Raw sensitive payload display is off by default and policy-controlled. |
| Navigation           | Project → Administration → Developer Console; detail breadcrumbs.                                                                                                                                               |
| Empty state          | Explain machine access and security responsibility; primary Create API client or Add webhook depending on tab.                                                                                                  |
| Loading state        | Existing credentials are never reconstructed; lists skeleton independently; creation blocks repeat submission.                                                                                                  |
| Error state          | Secret creation failure reveals nothing; delivery errors show safe provider response metadata, retry policy, and correlation reference.                                                                         |
| Permissions          | Separate read/manage/secret-reveal/delivery capabilities; recent authentication for secret creation; all access project-scoped and audited.                                                                     |
| Responsive behaviour | Tables become lists; scopes wrap as tokens with text; secret reveal uses a full-width secure panel with copy feedback.                                                                                          |

### OPS-01 — Platform Settings

| Aspect               | Specification                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Operate global platform policy, catalogs, cells, feature availability, and security controls without treating operators as Project members.                                   |
| Target user          | Authorized platform operator under privileged-access policy.                                                                                                                  |
| Actions              | Review platform health, manage approved catalog/policy state, inspect rollout/cell status, initiate controlled operational workflow, access immutable audit references.       |
| Components           | Environment banner, privilege/time remaining, global health, cells, catalog, policy versions, rollout operations, incident link, audit. No unrestricted Project-data browser. |
| Navigation           | Separate operator context with persistent environment and privilege indicator; never mixed into Project Administration.                                                       |
| Empty state          | No active incidents/operations states “No action required.” Missing privilege offers request-access path, not partial controls.                                               |
| Loading state        | Privilege and environment verify before controls render; health regions load independently with freshness.                                                                    |
| Error state          | Uncertain policy/placement state fails changes closed; show last confirmed data, affected scope, and approved runbook/escalation.                                             |
| Permissions          | JIT, purpose-bound operator capabilities; sensitive actions may require dual approval and step-up. Project data access is not implicit.                                       |
| Responsive behaviour | Read-only status supports tablet; high-risk operations require a sufficiently large review layout or explicit mobile-safe design, never compressed confirmation.              |

### SYS-01 — System State Screens

| Aspect               | Specification                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Recover safely from denied, missing, offline, maintenance, degraded, or unexpected states.                                                          |
| Target user          | Any user encountering a system boundary.                                                                                                            |
| Actions              | Retry, return to safe parent/Dashboard/My Projects, sign in, request access, view service status, contact support with safe reference.              |
| Components           | Plain status title, one-sentence explanation, safe reference, primary recovery, optional status/help. No mascot or decorative error art.            |
| Navigation           | Preserve known safe context; do not render unauthorized Project navigation.                                                                         |
| Empty state          | Not applicable.                                                                                                                                     |
| Loading state        | A route-verification state does not briefly reveal protected content.                                                                               |
| Error state          | 403 and 404 are disclosure-safe; offline distinguishes unavailable writes; degraded state states stale time; unexpected errors expose no internals. |
| Permissions          | Error content itself is capability- and disclosure-aware.                                                                                           |
| Responsive behaviour | Centered readable block, not vertically stranded; actions stack on compact screens.                                                                 |

## Screen-level acceptance

Every implementation-ready screen specification must additionally provide:

- analytics events tied to task outcomes, with privacy classification;
- content strings and localization notes;
- capability identifiers and disclosure behavior;
- data freshness and authoritative-source rules;
- keyboard focus order and screen-reader announcements;
- performance budget and extension-slot budget;
- test cases for two Projects and two permission levels where applicable.
