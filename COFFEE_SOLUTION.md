# BARAKASB Coffee Solution

## Status and purpose

Coffee Solution is the first official BARAKASB business Solution and the reference
blueprint for future Restaurant, Bakery, Store, Warehouse, Production, Hotel, Beauty,
Service, and Delivery Solutions.

This document defines product boundaries and contracts only. It contains no UI, backend,
database, or integration implementation.

## Product outcome

Coffee Solution gives one Project a complete operating model for a coffee shop or small
food-service venue:

- administrative control of menu, recipes, service areas, purchasing, stock, people,
  finance, reports, and configuration;
- focused workspaces for Cashier, Barista, Chef, Waiter, and Storekeeper;
- traceable progression from order intent to payment, preparation, delivery, inventory
  consumption, financial posting, and analytics.

Every screen must identify the current Project, show only authorized information, and
answer “What should the user do next?”

## Solution boundary

Coffee Solution owns business meaning for:

- menu and sellable products;
- recipes and production yields;
- tables, service areas, and order fulfillment;
- preparation stations and queues;
- coffee-specific stock operations and procurement;
- operational revenue, expenses, cost of goods, closing, and management reporting;
- coffee-shop analytical projections.

Platform Core continues to own identity, Projects, membership, capabilities, audit
transport, Solution lifecycle, placement, tenancy, notifications infrastructure, and
object/security services. Coffee Solution never reimplements these concerns.

## Two independent experiences

### Administrative Panel

For Owner, Administrator, and Manager. It supports governance, configuration, exception
handling, financial visibility, and business decisions. Access is capability-driven; the
title “administrator” never bypasses Project isolation or sensitive-action policy.

### Employee Workspaces

For Cashier, Barista, Chef, Waiter, and Storekeeper. Each workspace is task-first,
station-aware, and free of administrative navigation. An employee with multiple roles
may switch between explicitly assigned workspaces; permissions are the union of active
assignments constrained by current shift, location, and policy.

## Reference Solution rules

Every future BARAKASB Solution must adopt:

1. a signed versioned Solution manifest and exact deployment compatibility lock;
2. Core-owned Project, identity, membership, authorization, and audit contracts;
3. explicit module ownership and public contracts;
4. one Project on every business record, event, job, cache key, object, and realtime
   topic;
5. capability checks at UI contribution and authoritative use-case boundaries;
6. desired/effective lifecycle state for installation and configuration;
7. idempotent commands, optimistic concurrency, outbox events, and replay-safe
   projections;
8. separate administrative and employee navigation;
9. independently loading UI regions with error boundaries and performance budgets;
10. accessibility, responsive behavior, localization, and complete UI state contracts;
11. immutable historical documents for commercial, stock, recipe, and accounting truth;
12. correction through explicit reversal/adjustment, never silent historical rewrite.

## Product invariants

- A sale belongs to exactly one Project and operating location.
- An order has separate commercial, payment, fulfillment, inventory, and accounting
  states; one status cannot represent all five.
- Money is stored and calculated in an explicit currency using decimal-safe amounts.
- Quantity uses a declared unit and conversion rule; floating-point arithmetic is not
  accepted for stock or money.
- A sold item captures the product, price, tax, modifier, and recipe/version snapshots
  required to reproduce the transaction.
- Posted stock and finance documents are immutable. Corrections reference and reverse
  the original.
- Inventory cannot be changed by editing an on-hand number. Every change is a document
  or ledger movement.
- Preparation cannot expose prices, costs, employee pay, supplier terms, or finance.
- Employee workspaces cannot link to or render administrative functions.
- Analytics is derived and eventually consistent; operational ledgers remain
  authoritative.

## Operating dimensions

All relevant records explicitly identify:

- Project;
- operating location;
- business date and timezone;
- order channel: table, takeaway, or future declared channel;
- service area/table where applicable;
- fulfillment station;
- warehouse/storage location;
- responsible actor and workstation/device;
- source document and correlation identity.

One Project may contain multiple locations in a future compatible version. The initial
release may support one active location, but contracts must not assume that Project and
location are identical.

## Canonical business time

Calendar date, business date, and timestamp are distinct:

- timestamp records the actual instant in UTC;
- local time is derived from the location timezone;
- business date groups a trading day and may close after midnight;
- reporting uses the recorded business-date policy version.

Changing timezone or closing boundary never rewrites posted history.

## Navigation contribution

Coffee Solution contributes:

- one Project Dashboard widget set;
- `Coffee` under Project Workspaces;
- role-specific employee workspace destinations;
- `Coffee Administration` under Project Administration;
- approved global search result types and safe commands;
- notification categories for operational exceptions.

It cannot replace Core Project switching, authentication, profile, billing truth,
security feedback, or Project lifecycle controls.

## Module map

```text
Catalog ───────> Recipes ───────> Inventory
   │                 │                ▲
   ▼                 ▼                │
Orders ───────> Production ───────────┘
   │                 │
   ▼                 ▼
Payments          Fulfillment
   │                 │
   └────────┬────────┘
            ▼
         Finance ───────> Analytics / Reports

Procurement ─────> Inventory ─────> Finance
People/Stations ─> Orders and Production
Configuration ───> all modules through versioned policy
```

Arrows are public contracts or events, never direct access to another module's
persistence.

## Experience quality bar

- common employee action reachable within two navigation decisions;
- active order acknowledgment within 100 ms and explicit pending state thereafter;
- no full-page reload required to progress a queue;
- touch targets at least 44 px;
- all critical workflows usable by keyboard;
- color never carries queue/status meaning alone;
- high-risk actions state scope, financial/stock effect, and reversibility;
- offline mode never invents payment, stock, or completion truth.

## Explicit non-goals

- hotel, delivery-fleet, manufacturing, or beauty-domain behavior;
- payroll, general ledger, tax filing, or bank reconciliation;
- unrestricted custom scripting;
- cross-Project operational dashboards;
- automatic substitution of ingredients without approved policy;
- using analytics projections as the accounting or stock source of truth.

## Document set

- `COFFEE_MODULES.md` — bounded modules and contracts
- `COFFEE_ADMIN_PANEL.md` — administrative information architecture
- `COFFEE_EMPLOYEE_WORKSPACES.md` — task-focused employee experiences
- `COFFEE_ROLES.md` and `COFFEE_PERMISSIONS.md` — least-privilege model
- `COFFEE_DATA_MODEL.md` — conceptual entities and invariants
- `COFFEE_ORDER_FLOW.md` — order, payment, production, and fulfillment lifecycle
- `COFFEE_INVENTORY_FLOW.md` — stock ledger and operational flows
- `COFFEE_FINANCE_FLOW.md` — management-finance model and closing
- `COFFEE_ANALYTICS.md` and `COFFEE_REPORTS.md` — derived decision support
- `COFFEE_IMPLEMENTATION_ROADMAP.md` — gated delivery sequence
