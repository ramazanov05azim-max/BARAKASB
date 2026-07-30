# BARAKASB Component Library Specification

## Component policy

The library defines behavior and composition rules, not implementation. Components are
accepted only when they solve a repeated interaction problem. A domain-specific concept
belongs to its Solution, composed from platform primitives.

## Foundations and controls

| Component       | Purpose                       | Required states and behavior                                              |
| --------------- | ----------------------------- | ------------------------------------------------------------------------- |
| Text            | Consistent readable hierarchy | Semantic element selectable independently from visual style               |
| Icon            | Reinforce meaning or action   | Decorative icons hidden from assistive technology; meaningful icons named |
| Avatar          | Recognize person or Project   | Text fallback, stable color, no identity inferred from image              |
| Badge           | Compact status or count       | Text/icon meaning; never color alone; no decorative badge                 |
| Button          | Trigger an action             | Primary, secondary, quiet, destructive; focus, disabled, loading          |
| Icon button     | Compact familiar action       | Required accessible name and tooltip; 44 px target                        |
| Link            | Navigate                      | Visually distinguishable without relying only on color                    |
| Text field      | Short text input              | Label, help, error, prefix/suffix, readonly, disabled                     |
| Text area       | Longer bounded input          | Character guidance when a hard limit exists                               |
| Select          | Choose one from a short list  | Native behavior preferred; searchable combobox for long lists             |
| Combobox        | Search and choose             | Keyboard listbox behavior, async/empty/error states                       |
| Checkbox        | Independent options           | Clear group label and mixed state where relevant                          |
| Radio group     | One visible choice            | All options and consequence visible                                       |
| Switch          | Immediate reversible setting  | State label; never used for a submit-dependent form                       |
| Date/time input | Choose localized time         | Timezone shown when outcome depends on it                                 |
| File input      | Select upload                 | Allowed type/size, scan state, replace/remove                             |

## Navigation components

| Component         | Purpose                                | Rules                                                              |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------ |
| Context bar       | Persistent account/Project orientation | Always identifies context; contains search, notifications, profile |
| Project switcher  | Explicit security-context change       | Search authorized Projects; reset scoped state on selection        |
| Navigation rail   | Primary destinations                   | Capability-aware, stable order, one active item                    |
| Mobile navigation | Frequent compact destinations          | Maximum four plus More                                             |
| Breadcrumb        | Hierarchical location                  | Use only below primary destination; never represent history        |
| Tabs              | Peer views of one resource             | URL-backed when shareable; not used as workflow steps              |
| Stepper           | Ordered finite workflow                | Current/completed/upcoming; supports safe return                   |
| Pagination        | Navigate large sets                    | Cursor-friendly labels; preserve filters and sort                  |
| Command palette   | Fast navigation and safe commands      | Destructive actions route to confirmation flow                     |

## Feedback components

| Component            | Purpose                               | Rules                                                            |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| Inline message       | Explain local state                   | Located beside related control/content                           |
| Banner               | Persistent page-wide condition        | Security, outage, billing, suspension, or setup blocker          |
| Toast                | Confirm non-critical completed action | Short-lived, non-modal, never sole evidence of failure           |
| Progress indicator   | Show determinate work                 | Stage and percentage only when trustworthy                       |
| Skeleton             | Preserve loading layout               | Matches expected content; no animation under reduced motion      |
| Empty state          | Explain absence and next action       | Title, one sentence, one primary action; optional secondary link |
| Error state          | Recover from failed region/page       | Safe explanation, retry, alternate path, support reference       |
| Status indicator     | Communicate lifecycle/health          | Label plus icon/color, shared vocabulary                         |
| Background operation | Track long workflow                   | Stage, start time, owner, safe cancellation when supported       |

## Overlays and dialogs

### Popover and menu

Use for short contextual choices. Focus moves into the overlay and returns to the
invoker. Clicking outside may close only when no entered data is lost.

### Drawer

Use for supplementary details or a short task that benefits from retaining page context.
On mobile it becomes a full-screen sheet. It is not used for complex configuration,
multi-step flows, or destructive review.

### Dialog

Use only when the user must decide before continuing. Dialogs contain one decision and
at most one primary and one secondary action. Escape/cancel is always available unless
the system is communicating an unavoidable security condition.

### Destructive confirmation

State object, scope, immediate effect, retained data, reversibility, and required
authentication. Use typed confirmation only for rare high-impact operations such as
deleting a Project—not routine removal. The primary button names the destructive
outcome.

Dialogs never launch automatically for marketing, never nest, and never contain
scrolling tables or full settings pages.

## Forms

### Layout

- one column by default;
- fields ordered by the user's mental model;
- related fields grouped under a concise heading;
- primary submit at the end and optionally in a sticky footer for long forms;
- autosave only for reversible preference changes with visible save state;
- explicit submit for permissions, billing, security, lifecycle, and integration
  changes.

### Validation

Preserve all user input. On failure, show a summary linked to invalid fields and focus
the summary. Use concrete recovery copy. Server validation remains authoritative;
duplicate, stale, or permission errors are mapped to the affected field or form state.

### Multi-step flows

Use a stepper only when steps have different questions or prerequisites. Show progress,
allow backward navigation without loss, summarize before commitment, and make long
asynchronous completion backgroundable.

## Tables and collections

### Data table

Supports accessible caption, column headers, sorting, filters, selection, pagination,
loading rows, empty-first-use, empty-filtered, partial error, and row actions. Bulk
actions appear only after selection and always state selected count and scope.

### List

Use when scanning identity and one or two attributes matters more than column
comparison. Notifications, recent activity, and search results use lists.

### Cards

Cards group one object or decision. A card has optional status, title, concise metadata,
and one obvious click/action region. Cards never duplicate an entire table row or exist
only to add a border.

Project cards show Project name, lifecycle status, role, relevant health/attention, and
last activity. Solution cards show business purpose, publisher/trust, compatibility,
price state, and install action. Metric cards include label, value, unit, period,
comparison, and data freshness.

## Dashboard widgets

| Widget          | Question answered                         | Constraints                                             |
| --------------- | ----------------------------------------- | ------------------------------------------------------- |
| Attention queue | What needs action now?                    | Ordered by severity/time; each item has one next action |
| Setup progress  | What remains before useful operation?     | Disappears when complete; no gamification               |
| KPI value       | What is the current state?                | Unit, period, freshness, optional comparison            |
| Trend           | How is a measure changing?                | Accessible chart and exact values                       |
| Work queue      | What is assigned to me?                   | Ownership, due/status, direct destination               |
| Activity        | What changed recently?                    | Authorized, concise, linked to audit/detail             |
| Health          | Is a Solution or integration functioning? | Healthy/degraded/failed with recovery path              |
| Quick actions   | What common action can I start?           | Maximum four, role- and context-aware                   |

Dashboard layout follows information priority, not arbitrary customization. Optional
reordering is allowed only after sensible defaults exist. A widget failure is isolated
and cannot block the page.

## Notifications

Notification anatomy:

- severity and category;
- outcome-focused title;
- short explanation;
- Project identity when applicable;
- timestamp and read state;
- one destination or action;
- preference category and expiry.

Categories are security, billing, access, operation, Solution, and work. Security and
billing delivery requirements cannot be disabled when legally or operationally required.
Deduplicate repeated events and aggregate noisy progress. A notification is not an audit
log or task database.

## Permissions presentation

`PermissionGate` is a behavior contract, not a security mechanism:

- hide irrelevant creation/navigation;
- disable explanatory actions when requesting access is possible;
- show read-only status for permitted resources;
- re-check after context, membership, or policy changes;
- never reveal hidden object names, counts, or actions through tooltips or errors.

## Extension slots

Core exposes reviewed slots for navigation, dashboard widgets, command palette, resource
pages, and Administration sections. Each slot defines allowed component categories,
density, loading budget, error boundary, capability, responsive contract, telemetry, and
conflict priority.

Extensions cannot replace the context bar, Project switcher, global security feedback,
authentication, billing truth, or Core destructive confirmations.

## Component acceptance checklist

- repeated cross-product purpose;
- every state specified;
- keyboard and screen-reader contract;
- 200% zoom and narrow-width behavior;
- localization/text expansion;
- light, dark, high-contrast, and reduced-motion behavior;
- permission and data-disclosure review;
- content examples without business-demo logic;
- no duplicate existing primitive or pattern.
