# Coffee Administrative Panel

## Experience contract

The panel is available only through Project Administration to authorized Owner,
Administrator, and Manager roles. Navigation is capability-aware. Financial cost,
people, role, audit, export, and destructive controls are independently protected.

Each page includes purpose, next action, loading/empty/error states, responsive rules,
and an audit path for sensitive changes. Employee workspaces never expose this
navigation.

## Information architecture

```text
Coffee Administration
├── Overview
├── Sales Setup
│   ├── Floor Plan
│   ├── Menu
│   ├── Categories
│   ├── Products
│   └── Display Case
├── Production
│   ├── Recipes
│   ├── Kitchen Configuration
│   └── Bar Configuration
├── Supply
│   ├── Warehouses
│   ├── Suppliers
│   ├── Purchases
│   └── Inventory
├── Team
│   ├── Employees
│   ├── Roles
│   └── Permissions
├── Finance
│   ├── Overview
│   ├── Income
│   ├── Expenses
│   └── Daily Closing
├── Reports
├── Analytics
├── Coffee Settings
└── Audit Log
```

## Screen specifications

| Screen                | Purpose and primary action                                                                                                         | Core components                                                                                                   | Empty/loading/error                                                                                                   | Permissions and responsive behavior                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Overview Dashboard    | Show current health and highest-priority exception. Primary action resolves the first blocker.                                     | Attention queue, today's sales snapshot, open orders, stock risk, station health, closing status, setup progress. | New Project shows ordered setup. Widgets load/fail independently and show freshness.                                  | Capability-filtered. Mobile orders attention before metrics; no hidden-value gaps.                                                   |
| Floor Plan            | Publish service areas, zones, tables, labels, capacity, and layout version. Primary: Publish layout.                               | Versioned canvas/list, table inspector, active-order impact preview, draft/published state.                       | Empty offers Create first area. Loading preserves layout bounds. Conflict reloads affected version.                   | Configure capability. Touch layout uses list/inspector; precision editing is desktop-first with accessible numeric alternative.      |
| Menu                  | Compose and publish a versioned menu. Primary: Publish changes.                                                                    | Draft/published comparison, category ordering, product availability, schedule/channel filters.                    | Empty leads to Categories then Products. Failed publish retains draft and explains incompatible items.                | Menu manage/publish separated. Mobile supports review and basic ordering, not dense drag-only control.                               |
| Categories            | Organize product discovery. Primary: Add category.                                                                                 | List/order, name/localization, availability, archive, product count.                                              | Empty explains categories. Errors are row-local; archived dependencies remain visible.                                | Catalog manage. Reordering has keyboard buttons and numeric alternative.                                                             |
| Products              | Define stable products, offers, variants, modifiers, price/tax, recipe link, and availability. Primary: Add product.               | Search/filter, product table, detail form, publication/compatibility status, history.                             | Empty links to Add product. Partial list stays usable. Invalid recipe/price blocks publication, not draft save.       | Read/manage/price/publish may differ. Compact rows become cards.                                                                     |
| Recipes (Tech Cards)  | Create, cost, approve, and version production specifications. Primary: Create or approve recipe.                                   | Output/yield, ingredient lines, units, waste, steps, cost, version diff/history, approval.                        | No recipe explains link from product. Cost unavailable is explicit. Unit/cycle errors preserve draft.                 | Recipe read, cost read, edit, approve separate. Ingredient table becomes labeled line editor.                                        |
| Kitchen Configuration | Map products/lines to kitchen stations and rules. Primary: Publish routing.                                                        | Stations, printers/displays, routing rules, priority/course policy, health test.                                  | Empty offers Add station. Device unavailable does not erase config. Overlap/unrouted validation blocks publish.       | Configure production. Diagnostics capability separate. Mobile read/status first.                                                     |
| Bar Configuration     | Map beverage preparation to bar stations. Primary: Publish routing.                                                                | Bar stations, product routing, queue policy, device/display health, fallback.                                     | Same state contract as Kitchen; unmapped sellable drinks are a blocking warning.                                      | Configure production. Bar employees cannot access config.                                                                            |
| Display Case          | Configure case locations, prepared batches, freshness, and FEFO/FIFO policy. Primary: Resolve expired/low batch or configure case. | Case layout/list, batches, quantity, produced/expires, reservation, waste action.                                 | Empty distinguishes no case from no stock. Refresh failures show last confirmed time.                                 | Read/manage/waste capabilities separate. Mobile uses scannable batch cards.                                                          |
| Warehouse             | Define storage locations and view authorized stock. Primary: Resolve stock exception or create document.                           | Warehouse list, item balances, availability, lots/expiry, movements, thresholds.                                  | Empty requires first warehouse before receiving. Projection lag shown, never false zero.                              | Warehouse-scoped read/manage/value permissions. Wide table becomes item detail list.                                                 |
| Suppliers             | Maintain approved suppliers and terms. Primary: Add supplier.                                                                      | Supplier list/detail, contacts, status, items, terms, purchase history summary.                                   | Empty offers Add supplier. Duplicate/archived state is recoverable.                                                   | Supplier read/manage; sensitive terms separate. Mobile list/detail.                                                                  |
| Purchases             | Plan, approve, receive, and return purchases. Primary depends on state: Create, Approve, Receive, Resolve discrepancy.             | Purchase documents, supplier, destination, lines, totals, approval, receipt progress, discrepancy.                | Empty shows Create purchase. Long lists skeleton; posting failures retain immutable draft/operation status.           | Create/approve/receive/post separated by threshold. Complex review uses full page on mobile.                                         |
| Inventory             | Run counts, transfers, write-offs, returns, and movement review. Primary: Start appropriate stock document.                        | Document tabs, count sheets, transfer, variance, write-off reasons, ledger drill-through.                         | Empty stock explains receipt prerequisite. Offline drafts clearly unposted. Projection error shows freshness.         | Warehouse/action/threshold scoped. Posting and approval separated.                                                                   |
| Employees             | Map Core members to Coffee roles, locations, stations, and shifts. Primary: Assign workspace.                                      | Member list, operational assignments, effective dates, status, current shift.                                     | No employees links to Core People invitation. Membership failure does not create local identity.                      | Assignment manage; identity and invitation stay Core-owned. Mobile rows become cards.                                                |
| Roles                 | Review default/custom Coffee role bundles. Primary: Create custom role if delegated.                                               | Role list, capability summary, assignment count, template difference, version.                                    | Defaults always exist. Deleted custom role requires reassignment.                                                     | Role read/manage/delegate boundaries. No employee access.                                                                            |
| Permissions           | Inspect capability matrix and contextual constraints. Primary: Save reviewed role revision.                                        | Module/action matrix, location/station/threshold constraints, risk labels, effective preview.                     | No ad hoc blank state. Stale policy requires reload/review.                                                           | Owner or delegated security administrator; step-up for sensitive grants. Desktop-first matrix with accessible grouped mobile editor. |
| Financial Accounting  | Show revenue, COGS, gross profit, operating expense/profit, cash, and reconciliation. Primary: Resolve exception or close day.     | Period summary, posting completeness, tender reconciliation, COGS, expense status, drill-through.                 | No posted day explains prerequisites. Projection lag/failure shows authoritative source links.                        | Finance read; cost/profit/reconciliation separated. Mobile summary then drill-down.                                                  |
| Expenses              | Capture, approve, post, reverse, and categorize operating expenses. Primary: Add or approve expense.                               | Expense list/form, category, amount/tax, counterparty, attachment, approval, posting.                             | Empty offers Add expense. Upload/scan/policy errors preserve draft.                                                   | Create/approve/post/export separated; thresholds apply.                                                                              |
| Income                | Explain operational income postings and permitted non-order income. Primary: investigate mismatch or add approved non-sale income. | Revenue sources, tender/channel, adjustments, posting reference, period filters.                                  | Empty states no activity. Missing posting is an exception, not zero revenue.                                          | Finance read/post-adjustment. Sales revenue is event-derived and not manually edited.                                                |
| Daily Closing         | Reconcile business date and lock an operational period. Primary: Complete next unresolved check.                                   | Checklist, orders, payments, cash sessions, refunds/voids, stock exceptions, expected/actual, approvals.          | Nothing to close explains business date. Pending events block close with source links.                                | Close prepare/approve/reopen-adjust separately. Mobile supports review but not unreadable reconciliation grids.                      |
| Reports               | Generate reproducible period documents. Primary: Run selected report.                                                              | Report catalog, parameters, saved views, generation status, snapshots, export.                                    | Empty filtered catalog clears filters. Generation runs in background. Export failure does not lose snapshot.          | Report-specific read/export; personal/financial classification applies.                                                              |
| Analytics             | Support owner/manager decisions using derived metrics. Primary: investigate the highest-impact change.                             | KPI scorecard, trend, product mix, food/beverage cost, inventory value, staff operations, freshness/definitions.  | Insufficient data explains minimum period. Partial metrics are labeled; no invented zero.                             | Metric/domain capabilities; staff data tightly scoped. Responsive priority stack.                                                    |
| Project Settings      | Link to Core Project Settings and manage Coffee-specific policies only. Primary: save reviewed policy revision.                    | Business day, units, rounding, order/payment, variance, station, numbering, receipt settings.                     | Defaults are explicit. Invalid cross-policy combinations block activation.                                            | Coffee settings capability; Core ownership/lifecycle remains on Core page.                                                           |
| Audit Log             | Investigate Coffee security and business-sensitive actions. Primary: filter and inspect an event.                                  | Actor, action, object, Project/location, before/after summary, result, time, correlation, export policy.          | No matching events clears filters. Audit unavailability is prominent and cannot be “retried” into a fake empty state. | Audit read/export separately; sensitive values redacted. Mobile event detail replaces wide table.                                    |

## Administrative interaction rules

- Draft configuration may autosave only when reversible; publish/post/approve is
  explicit.
- Every publish shows validation, affected locations/workspaces, effective time, and
  compatibility.
- Every posted document receives stable number, timestamp, actor, and audit reference.
- Bulk operations state selection scope and never silently include filtered-out rows.
- Delete is normally archive/retire; historical products, recipes, suppliers, roles, and
  stations remain resolvable.
- Cross-module status is a projection with freshness, never a direct cross-repository
  join.
