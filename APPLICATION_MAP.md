# BARAKASB Clickable Application Map

## Purpose

This is the route contract for platform frontend implementation. Every product route
maps to an approved screen in [SCREEN_MAP](SCREEN_MAP.md) and a navigation context in
[NAVIGATION](NAVIGATION.md).

Links below open the local prototype at `http://localhost:3000`. Dynamic links use the
mock Project `north-star`. Review-only aliases are not product navigation.

Status:

- **Phase 5** — in the approved frontend-foundation scope;
- **Deferred platform** — approved UX route, intentionally not implemented in Phase 5;
- **Future Solution** — owned by a future Solution implementation, not the platform.

## Primary user journey

```text
Landing
  -> Registration
  -> Login
  -> My Projects
  -> Create Project
  -> Business Category
  -> Solution
  -> Project Name
  -> Confirmation
  -> Empty Project Dashboard
```

The four creation decisions are states of one canonical `/projects/new` route. They are
not separate pages and remain recoverable with Back.

## Public context

| UX ID   | Screen                     | Canonical route                                    | Entry/return relationship                              | Status            |
| ------- | -------------------------- | -------------------------------------------------- | ------------------------------------------------------ | ----------------- |
| PUB-01  | Landing Page               | [Open `/`](http://localhost:3000/)                 | Public header; start of registration journey           | Phase 5           |
| AUTH-01 | Registration               | [Open `/register`](http://localhost:3000/register) | Landing primary CTA → Login after success              | Phase 5           |
| AUTH-02 | Authentication             | [Open `/login`](http://localhost:3000/login)       | Public header or Registration → intended account route | Phase 5           |
| AUTH-03 | Forgot Password / Recovery | [Open `/recover`](http://localhost:3000/recover)   | Login recovery link → Login after completion           | Phase 5           |
| AUTH-04 | Account Security Setup     | `/welcome/security`                                | Registration/Login policy gate → intended destination  | Deferred platform |

Navigation rule: public pages never render Project navigation or Project data.

## Account context

| UX ID  | Screen                      | Canonical route                                                                           | Primary navigation relationship                     | Status            |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------- |
| ACC-01 | My Projects                 | [Open `/projects`](http://localhost:3000/projects)                                        | Account home; Project switcher “All Projects”       | Phase 5           |
| ACC-02 | Create Project              | [Open `/projects/new`](http://localhost:3000/projects/new)                                | My Projects primary action; Project switcher Create | Phase 5           |
| ACC-02 | Create Coffee Project state | [Open preselected flow](http://localhost:3000/projects/new?category=food&solution=coffee) | Solution Catalog → same Create Project wizard       | Phase 5           |
| CAT-01 | Solution Catalog            | [Open `/solutions`](http://localhost:3000/solutions)                                      | Account navigation and Create Project Solution step | Phase 5           |
| ACC-03 | Profile & Security          | [Open `/profile`](http://localhost:3000/profile)                                          | Avatar menu                                         | Phase 5           |
| ACC-04 | Notifications               | `/notifications`                                                                          | Context-bar bell                                    | Deferred platform |

Account navigation contains My Projects, Notifications, and Profile. Solution Catalog is
an authorized discovery destination, not a permanent high-priority mobile tab.

## Project context

All routes begin with `/projects/{projectId}`. The Project ID in the URL is
authoritative and switching it resets scoped data, drafts, subscriptions, and Solution
contributions.

| UX ID  | Screen                   | Canonical route                                                                        | Project navigation relationship    | Status            |
| ------ | ------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------- | ----------------- |
| PRJ-01 | Project Dashboard        | [Open mock Dashboard](http://localhost:3000/projects/north-star)                       | Default Project destination        | Phase 5           |
| PRJ-02 | Employee Workspace host  | `/projects/{projectId}/work`                                                           | Workspaces                         | Future Solution   |
| ADM-01 | Administration Overview  | `/projects/{projectId}/admin`                                                          | Administration                     | Deferred platform |
| ADM-02 | People & Access          | `/projects/{projectId}/admin/people`                                                   | Project People / Administration    | Deferred platform |
| ADM-03 | Installed Solutions      | `/projects/{projectId}/admin/solutions`                                                | Administration → Solutions         | Deferred platform |
| CAT-01 | Project Solution Catalog | `/projects/{projectId}/admin/solutions/catalog`                                        | Installed Solutions primary action | Deferred platform |
| ADM-04 | Project Settings         | `/projects/{projectId}/admin/settings`                                                 | Administration → Project Settings  | Deferred platform |
| COM-01 | Subscription             | [Open mock Subscription](http://localhost:3000/projects/north-star/admin/subscription) | Administration → Subscription      | Phase 5           |
| COM-02 | Billing                  | `/projects/{projectId}/admin/billing`                                                  | Administration → Billing           | Deferred platform |
| DEV-01 | Developer Console        | `/projects/{projectId}/admin/developer`                                                | Administration → Developer Console | Deferred platform |
| —      | Project Audit            | `/projects/{projectId}/admin/audit`                                                    | Administration → Audit             | Deferred platform |

The Phase 5 Dashboard is intentionally empty of Coffee POS, menu, recipe, inventory,
finance, analytics, and employee functionality.

## Platform-operator context

| UX ID  | Screen            | Canonical route                                    | Navigation relationship                                 | Status  |
| ------ | ----------------- | -------------------------------------------------- | ------------------------------------------------------- | ------- |
| OPS-01 | Platform Settings | [Open `/platform`](http://localhost:3000/platform) | Separate operator context; never Project Administration | Phase 5 |

Overview, Catalog, Policies, Operations, and Audit are views within Platform Settings
until their complexity justifies separately approved routes.

## Commercial entry behavior

The approved Subscription screen is Project-scoped. A convenience account URL may route
to Project selection but cannot display or modify mixed commercial data:

| URL                                        | Behavior                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `/subscriptions`                           | Select a Project, or redirect to the only/recent authorized Project subscription |
| `/projects/{projectId}/admin/subscription` | Canonical subscription screen                                                    |

Public pricing remains a Landing Page section and does not reuse an authenticated
subscription route.

## System routing

| UX ID  | Condition                    | Route behavior                                               | Status  |
| ------ | ---------------------------- | ------------------------------------------------------------ | ------- |
| SYS-01 | Unknown route                | Next.js `not-found` UI with safe return to My Projects       | Phase 5 |
| SYS-01 | Missing/inaccessible Project | Disclosure-safe Project state; no hidden metadata            | Phase 5 |
| SYS-01 | Offline/degraded             | Contextual page/region state, not a separate product route   | Phase 5 |
| SYS-01 | Unauthorized                 | Contextual disclosure-safe state; no resource-existence leak | Phase 5 |

## Canonical aliases

Aliases exist only to avoid broken prototype links. They immediately route to the
canonical destination and never appear in navigation, analytics, breadcrumbs, or
documentation:

| Alias                                | Canonical destination                         |
| ------------------------------------ | --------------------------------------------- |
| `/forgot-password`                   | `/recover`                                    |
| `/projects/new/coffee`               | `/projects/new?category=food&solution=coffee` |
| `/projects/{projectId}/subscription` | `/projects/{projectId}/admin/subscription`    |
| `/platform/settings`                 | `/platform`                                   |

## Navigation relationship

```text
Public header
├── Landing
├── Public pricing section
├── Login
└── Registration

Account shell
├── Project switcher
│   ├── My Projects
│   └── Create Project
├── Notifications
├── Profile & Security
├── Global search / command palette
└── Solution Catalog

Project shell
├── Project switcher
├── Dashboard
├── Workspaces                   [Future Solution]
└── Administration              [Deferred platform]
    ├── People & Access
    ├── Solutions / Catalog
    ├── Subscription
    ├── Billing
    ├── Developer Console
    ├── Audit
    └── Project Settings

Platform-operator shell
└── Platform Settings
```

## Route acceptance rules

Before a route is implemented:

1. it has an approved UX ID or is explicitly identified as a non-product alias;
2. it belongs to exactly one Public, Account, Project, or Platform-operator context;
3. the primary navigation relationship is documented;
4. Project routes start with `/projects/{projectId}`;
5. route parameters never substitute for authorization;
6. expected loading, empty, denied, error, offline, and responsive states come from
   `SCREEN_MAP.md`;
7. a Solution route stays under its declared Project workspace/administration namespace;
8. adding a route updates this map in the same change.
