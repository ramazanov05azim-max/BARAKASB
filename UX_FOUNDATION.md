# BARAKASB UX Foundation

## Experience objective

BARAKASB gives an owner one place to understand and operate multiple independent
Projects, while giving employees focused workspaces containing only the work and
controls relevant to them.

The interface optimizes for:

1. orientation — “Where am I and which Project is active?”
2. priority — “What needs attention now?”
3. action — “What is the safest next step?”
4. confidence — “Did it happen, and what happens next?”

## User groups

| User                  | Primary need                                                | Default landing           |
| --------------------- | ----------------------------------------------------------- | ------------------------- |
| Visitor               | Understand value and trust quickly                          | Landing page              |
| New owner             | Create the first operational Project                        | Guided Project creation   |
| Portfolio owner       | Compare and enter multiple Projects                         | My Projects               |
| Project administrator | Configure people, Solutions, billing, and policy            | Administration overview   |
| Employee              | Complete assigned work with minimal navigation              | Employee workspace        |
| Developer/integrator  | Configure approved API clients and integrations             | Project Developer Console |
| Platform operator     | Operate platform controls without becoming a Project member | Platform Settings         |

A person may have different roles in different Projects. The experience derives actions
from current capabilities, never from a global persona assumption.

## Product contexts

### Public context

Marketing, sign-up, authentication, recovery, legal, security, and service status. No
Project data appears.

### Account context

My Projects, personal profile/security, global notifications, and account preferences.
The account context cannot modify a Project without entering it explicitly.

### Project context

Dashboard, Solution workspaces, employees, administration, subscription, billing, and
Developer Console. Routes begin with `/projects/{projectId}` and the Project identity
remains visible.

### Platform-operator context

Platform Settings and operational controls. This is visually and permission-wise
distinct from Project administration. Platform operators do not receive Project data
access implicitly.

## Canonical page anatomy

1. **Context bar** — product mark, Project switcher or “Account,” global search,
   notifications, help, profile.
2. **Primary navigation** — only destinations available in the current context.
3. **Page header** — breadcrumb when needed, concise title, status/supporting sentence,
   one primary action.
4. **Decision area** — priority items, content, or task; never an ornamental hero.
5. **Secondary area** — filters, related information, or progressive disclosure.
6. **System feedback** — inline validation, banners, toasts, background-operation
   center.

On narrow screens, the context bar and page title stay visible; navigation collapses
without hiding current Project identity.

## “Next action” framework

The next action is selected in this order:

1. unblock security or data safety;
2. resolve a failed or degraded operation;
3. complete the current setup;
4. respond to assigned or time-sensitive work;
5. continue the most recent workflow;
6. start the screen's normal primary task.

There is never more than one primary action in a page header. If no action is needed,
the interface says so and offers a useful destination rather than manufacturing work.

## State model

Every data-bearing surface supports:

| State              | UX requirement                                                            |
| ------------------ | ------------------------------------------------------------------------- |
| Initial loading    | Stable skeleton matching final layout; no false values                    |
| Background refresh | Existing content stays usable; subtle “Updating” state                    |
| Empty-first-use    | Explain value, prerequisite, and one setup action                         |
| Empty-filtered     | Explain that filters caused the result and provide “Clear filters”        |
| Partial            | Render available regions; identify only the failed region and retry it    |
| Offline            | Preserve safe reading where possible; disable writes and explain recovery |
| Unauthorized       | Explain required access without revealing hidden resources                |
| Not found          | Offer safe navigation; do not confirm inaccessible resource existence     |
| Validation error   | Place message beside field, preserve input, focus first error             |
| Operation pending  | Show stage, safe navigation, and where progress can be found              |
| Failure            | State what failed, what remains unchanged, and the next recovery action   |
| Success            | Confirm the outcome briefly and advance to the next meaningful state      |

Skeletons are used only when content structure is known. Indeterminate spinners are
reserved for compact controls or transitions under approximately two seconds.

## Speed and perceived performance

- Navigation acknowledges input within 100 ms.
- Local disclosure and selection respond within one animation frame.
- A visible loading state starts within 200 ms.
- At one second, explain the operation; at ten seconds, make it backgroundable.
- Optimistic UI is allowed only for reversible, low-risk changes with reliable
  reconciliation.
- Security, billing, permission, lifecycle, and extension state are confirmed by the
  authoritative response before success is shown.

These are experience budgets, not backend guarantees.

## Content design

- Use sentence case and concrete nouns.
- Button labels begin with a verb and describe the result.
- Titles avoid “Manage” when a specific noun works.
- Error copy follows: outcome, reason if safe, recovery.
- Dates use the user's locale and show timezone for scheduled or audited events.
- Money always shows currency; totals and renewal dates are explicit.
- Destructive language names the object: “Delete Project,” not “Continue.”
- Never blame the user or expose stack traces, correlation internals, tokens, or
  inaccessible object names.

## Permissions experience

Navigation removes destinations for which the user has no read capability. Controls
needed for understanding may remain visible but disabled with a concise reason and a
safe request-access path when one exists.

Capability changes update the shell promptly. If access is revoked during a workflow,
unsaved local input is protected where safe, the write is stopped, and the user returns
to an authorized destination.

Employee workspaces suppress administrative structure. Project administrators can
preview effective access but cannot impersonate an employee.

## Project switching

The switcher shows Project name, lifecycle status, optional short identifier, and recent
Projects. Search is local to authorized Projects. Selecting a Project:

1. announces the context change;
2. clears project-scoped views, drafts, caches, subscriptions, and extension UI;
3. loads the target shell;
4. restores only target-scoped navigation and preferences.

No cross-Project compare view displays business data in the core product. My Projects
may show approved platform metadata and health summaries without combining business
records.

## Localization and formats

All visible strings are externalized. Layout supports text expansion, plural rules,
right-to-left mirroring, locale-aware names, numbers, dates, currency, and timezones.
Identifiers, audit timestamps, and exported machine formats remain unambiguous.

## UX measurement

Measure task completion, time to first Project, setup abandonment, error recovery,
search success, accessibility defects, and repeated navigation. Do not optimize for
engagement duration. Telemetry is minimized, classified, project-scoped where
applicable, and never records sensitive field contents.

## Documentation relationships

- Screen inventory: `SCREEN_MAP.md`
- Navigation and discovery: `NAVIGATION.md`
- Visual language: `DESIGN_SYSTEM.md`
- Interaction patterns: `COMPONENT_LIBRARY.md`
- Product principles: `DESIGN_PRINCIPLES.md`
- End-to-end flows: `USER_JOURNEYS.md`
