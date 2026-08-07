# Coffee Kitchen Operational Module v1

## Scope

Kitchen is a Solution-owned Operational Module rendered by the existing Universal
Application at `/app/workspace`. It adds no browser application, deployable, composition
root or global route. The owner preview uses the existing Manager route:

`/projects/<projectId>/admin/solutions/coffee/workspaces/<workspaceId>/open`

The Solution Constructor activates `Кухня`, assigns employees, an operational location,
an explicit source warehouse and optional delay thresholds, then issues the immutable
Workspace Code used for device binding.

## Ownership and dependencies

```text
Kitchen KDS
  -> PreparationQueueQueryService / PreparationCommandService
    -> authoritative Coffee order store

Kitchen KDS
  -> RecipeInstructionQueryService
    -> Recipe Engine projection

terminal customer-order completion
  -> Warehouse consumption service
    -> explicit Bar and Kitchen source warehouses
```

Kitchen owns presentation and transient view state only. It has no repository and never
stores orders, positions, status copies or history. The order/preparation domain owns
the order, route, status, cancellation and completion facts. Warehouse owns the movement
ledger; Recipe Engine owns expansion, losses, modifier effects and package requirements.

The public order/preparation contracts expose only Kitchen-display projections and four
commands. They do not expose the internal repository, localStorage adapter, full order
aggregate or Bar presentation state. Bar, Warehouse, Purchasing and Manager do not
depend on Kitchen UI or a Kitchen repository.

## Queue and lifecycle

Only submitted, non-cancelled positions with the configured route `KITCHEN` enter the
queue. Bar and immediate positions are excluded. Tickets are grouped by authoritative
order and oldest unfinished ticket is first.

The exact position lifecycle is:

```text
Новый -> Принять -> Готовится -> Готов -> Готов
```

There is no separate accepted state. `Принять всё` changes every new Kitchen position in
one authoritative save and preserves positions already preparing or ready. `Всё готово`
is enabled only when every active Kitchen position is ready and records one idempotent
`READY_ALL` audit fact; it never completes the customer order.

Every write records Project, Business Environment, Workspace, employee, order, affected
position identifiers, timestamp and one of `ACCEPT_POSITION`, `READY_POSITION`,
`ACCEPT_ALL` or `READY_ALL`.

## Synchronization and mixed orders

The local adapter publishes the existing same-tab custom event and browser `storage`
event. Bar and Kitchen therefore reload the same order facts without manual refresh. The
customer order becomes ready only when every routed part is ready. Kitchen cannot issue,
pay, cancel or complete the full order.

## Recipe and stock behavior

Kitchen reads optional preparation instructions through `RecipeInstructionQueryService`;
it cannot edit recipes or calculate consumption. Terminal order completion sends the
frozen line snapshot to Warehouse. Bar and immediate lines use the Bar source warehouse;
Kitchen lines use the explicit Kitchen source warehouse. Idempotency keys include order,
route and resource.

If the Kitchen source warehouse is missing or inactive, preparation and customer-order
validity are preserved, no warehouse is guessed, and Warehouse records a visible
`WAREHOUSE_NOT_ASSIGNED` issue. Missing or cyclic recipes likewise create owner-owned
Warehouse issues rather than copied Kitchen facts.

## Read models and safe degradation

Views are `Новые`, `Готовятся`, `Готовые` and `История`. History is derived from order
status timestamps and audit facts. Waiting time is calculated in the browser and never
persisted. Delay colors are applied only when the owner configured delayed and critical
thresholds; no SLA is fabricated.

An unavailable preparation query shows a readable error instead of crashing. Missing
recipes are marked `Рецептура недоступна`. Missing warehouse configuration is shown as
`Склад кухни не настроен`. Owner preview is read-only so it cannot bypass employee
audit.

## Persistence

Kitchen v1 defines no localStorage key. On refresh it rebuilds the complete queue from
`PreparationQueueQueryService`. Removing the Kitchen presentation and manifest does not
change Bar, Warehouse, Purchasing or Manager business behavior.
