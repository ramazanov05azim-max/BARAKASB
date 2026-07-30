# BARAKASB Navigation

## Information architecture

```text
Public
├── Home
├── Product
├── Security
├── Pricing
└── Sign in / Create account

Account
├── My Projects
├── Notifications
├── Profile & Security
└── Sign out

Project
├── Dashboard
├── Workspaces
│   └── Installed Solution navigation
├── People
├── Administration
│   ├── Overview
│   ├── Solutions
│   ├── Subscription
│   ├── Billing
│   ├── Developer Console
│   ├── Audit
│   └── Project Settings
└── Help

Platform operator
└── Platform Settings
    ├── Overview
    ├── Catalog
    ├── Policies
    ├── Operations
    └── Audit
```

Items appear only when the current actor has the required read capability. A Solution
may add items only under Workspaces or its declared Administration section. A Plugin may
add items only inside its target Solution.

## Navigation model

### Desktop

- A compact top context bar provides Project switching, search, notifications, help, and
  profile.
- A left rail provides stable destinations for the current context.
- The rail is 240 px expanded and 72 px collapsed. It remembers preference per device,
  not per Project.
- The active destination uses label, weight, and indicator; color alone is insufficient.
- The primary action belongs in the page header, not the navigation rail.

### Tablet

The rail defaults to collapsed icons with accessible labels and expands as an overlay.
Tables and dashboards reduce columns before forcing horizontal scroll.

### Mobile

A bottom bar exposes at most four frequent destinations: Dashboard, Work, Notifications,
and More. Project switching remains in the top context bar. “More” opens the complete
capability-aware menu. Administration never becomes a dense bottom-navigation tree.

## Context switcher

The Project switcher opens with:

1. current Project and status;
2. recent Projects;
3. search across authorized Project names;
4. “All Projects”;
5. “Create Project” when permitted.

Archived and suspended Projects display their state. Inaccessible Projects disappear
without revealing former data. Keyboard users can open the switcher, search, move, and
select without leaving focus context.

## Menu system

- Labels use stable nouns: Dashboard, Workspaces, People, Administration.
- Maximum primary depth is two levels.
- A section with one destination links directly instead of opening a submenu.
- Badges show actionable counts only, never decorative totals.
- New Solution navigation appears only after effective installation completes.
- Disabled menu items are exceptional; hide unavailable destinations unless visibility
  helps explain setup or approval.
- Menu ordering is stable: Core destinations first, installed Solutions by configured
  order, personal/help actions last.

Context menus contain object-local secondary actions. They never hide the only way to
complete a common task.

## Breadcrumb rules

Breadcrumbs appear when the user is deeper than a primary destination:

```text
Administration / Solutions / Solution name
Developer Console / API clients / Client name
```

Rules:

- omit Home and the current Project because both are already visible;
- use labels, not IDs;
- make ancestors links and current page plain text;
- collapse middle ancestors on narrow screens, preserving parent and current item;
- do not use breadcrumbs as browser history;
- do not show breadcrumbs on Dashboard, My Projects, authentication, or simple top-level
  pages.

## Search

### Global search

Global search opens from the context bar and searches only authorized content in the
active context. In account context it searches Projects and global help. In Project
context it searches project navigation, people the actor may see, settings, commands,
and Solution-provided searchable records.

Results are grouped by type and show title, short context, status when useful, and the
destination. Search never returns another Project's business data while a Project is
active.

### Search behavior

- start matching after two characters, with a 200 ms debounce for remote sources;
- prioritize exact, prefix, recent, then fuzzy matches;
- preserve query in the URL on full results pages;
- provide keyboard navigation and announce result counts;
- show recent destinations before typing, not recent sensitive records;
- distinguish “no results” from “search unavailable”;
- provide query suggestions only from authorized metadata;
- never leak hidden object existence through counts, timing, or spelling suggestions.

Solution search providers declare result type, route namespace, permission, latency
budget, and redaction policy. Slow providers render as a separate partial state.

## Global command palette

Open with `⌘K` on macOS, `Ctrl+K` elsewhere, or the Search button. Commands include:

- navigate to an authorized destination;
- switch Project;
- create a Project when permitted;
- invite an employee from People;
- open profile, notifications, help, or keyboard shortcuts;
- run a Solution-declared command that is safe, authorized, and context-specific.

Destructive, billing, ownership, secret, and permission changes cannot execute directly
from the palette. The palette navigates to their reviewed confirmation flow.

Commands use verb + object, show current Project, and explain unavailable prerequisites.
Search and command results remain visually distinct.

## Notifications navigation

The bell shows the count of unread actionable notifications, capped at `99+`. Its panel
shows the five newest items and links to the notification center. Selecting an item:

1. verifies current access;
2. switches Project only after explicit confirmation when necessary;
3. opens the referenced destination;
4. marks read after successful display, not merely on click.

Urgent security notifications may use a persistent banner in addition to the center.
Email, push, and in-product preferences are managed in Profile, while Project-specific
operational subscriptions live in Project administration.

## Route and history rules

- Account routes use `/projects`, `/profile`, and `/notifications`.
- Project routes begin `/projects/{projectId}`.
- Browser Back returns to the previous navigable state and never silently changes a
  Project-scoped write target.
- Filters, sort, tabs, pagination cursor, and selected dashboard period are URL-backed
  when sharing or refresh is useful.
- Modal routes are reserved for short, reversible tasks. Refreshing a destructive
  confirmation opens its full safe page or closes it; it never submits.
- Unauthorized and missing resources use indistinguishable public responses where
  disclosure matters.

## Navigation accessibility

All regions have landmarks and accessible names. Skip links reach main content. Focus
follows route changes to the page heading, returns to the invoking control after closing
overlays, and never becomes trapped behind a collapsed rail. Touch targets are at least
44 by 44 CSS pixels.
