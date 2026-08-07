# Coffee Manager Operational Module v1

## Status and purpose

`Управляющий` is a Coffee-owned, read-only Operational Module registered in the existing
Universal Application. It adds no application, deployable, composition root, global
store or backend. Its five logical screens are `Обзор`, `Контроль закупок`,
`Контроль склада`, `События` and `Предупреждения`.

The module gives an assigned manager a current operational overview. It does not own,
copy or mutate sales, stock, purchasing, delivery or KPI data.

## Ownership and dependency direction

```text
Manager presentation
  -> Manager application read-model service
       -> WarehouseOperationsQueryService (owned by Warehouse)
       -> PurchasingOperationsQueryService (owned by Purchasing)
       -> Manager UI-preference repository

Warehouse  -X-> Manager
Purchasing -X-> Manager
Sales      -X-> Manager
```

Warehouse remains the source of stock balances, stock states, movements and warehouse
issues. Purchasing remains the source of purchase needs, recommendation results,
supplier-order state, delivery variance and overdue classification. Manager never
imports either owner repository, reads another module's localStorage namespace, invokes
another module's internal state or duplicates those calculations.

The owner services expose minimal transport-neutral query contracts from their public
application boundary. They contain only the fields needed for operational control and do
not export internal aggregate structures. The owner modules contain no Manager-specific
dependency or callback, so Manager can be physically removed without changing their
business behavior.

## Read model and refresh behavior

`CoffeeManagerWorkspaceService.load` requests the current Warehouse and Purchasing
public projections on every load or refresh and builds a transient presentation read
model. It may group and count already classified results; it never recreates owner
business rules.

Queries are isolated from each other. If one owner read adapter rejects, Manager marks
that source `unavailable`, renders the other source normally and displays `Недоступно`
for the failed source rather than zero. A compile-time removal of a required contract is
supposed to fail TypeScript; a runtime adapter outage degrades safely without crashing
the workspace.

The local Manager repository stores only:

- selected section;
- visibility preferences;
- presentation filter preferences.

Aggregated records, KPI values, warnings and events are not persisted or cached in
Manager localStorage. Owner service subscriptions trigger a fresh query. A corrected
Warehouse or Purchasing condition therefore removes its warning automatically.

## KPI policy

KPI values are nullable. A numeric zero is displayed only when the authoritative owner
query proves that the value is zero. Sales does not yet publish an approved public read
contract, so revenue, receipt count and average receipt render `Нет данных`. No random,
seeded, placeholder or fabricated value is permitted.

## Dynamic warnings

Warnings are calculated from owner-provided facts, including:

- Warehouse balance classification and unresolved issues;
- Purchasing recommendation without an open order;
- missing preferred supplier configuration;
- overdue supplier order classification;
- actual price variance and confirmed overdelivery.

Manager assigns presentation severity and navigation metadata only. The classification,
need calculation, threshold rule, overdue rule and delivery variance rule stay in the
owner module. Warnings have no repository and no independent lifecycle.

## Navigation and commands

The employee workspace is read-only and cannot post a delivery, alter stock, edit an
order or write any owner document. A warning carries a navigation target, not an owner
command. The current immutable device binding means a logged-in operational employee is
instructed to open the appropriate connected workspace. Manager Platform owner preview
may use the existing workspace-preview route. No second runtime or unsafe workspace
switching mechanism is introduced.

## Access and isolation

The host authenticates the employee and selects the registered Manager renderer. The
Manager application service verifies that the active employee is assigned to the exact
active Manager workspace. Project and Business Environment identifiers scope every query
and UI-preference key but are not displayed to employees.

The Warehouse and Purchasing query services apply their own Project-scoped access and
return fresh data. Future server adapters must enforce equivalent authorization and
tenant isolation at the application and persistence boundaries.

## Public contracts

- `WarehouseOperationsReadModel` publishes physical warehouse labels, owner-classified
  balances, recent immutable movements and unresolved issue facts.
- `PurchasingOperationsReadModel` publishes owner-calculated needs, supplier-order
  summaries, delivery variance facts and configuration warnings.
- `CoffeeManagerWorkspaceService` publishes only the composed read model and UI
  preference operation.

None of these contracts exposes write use cases or another module's repository. The
first two live in their owner modules' `queries.ts` files and are reusable by any future
authorized read consumer; they are not named for or owned by Manager.

## Verification

Automated tests cover manifest read capabilities, public-query aggregation, nullable
Sales KPI, warning recomputation, scope rejection, UI preferences, Russian navigation
and empty states. Architecture validation must continue to prove that owner modules do
not depend on Manager and that Manager imports no owner repository or UI.
