# Coffee Warehouse Operational Module v1

## Status and boundary

Warehouse is a Coffee-owned Operational Module registered through
`OperationalModuleManifest` in the existing Universal Application composition. It adds
no browser application, deployable, composition root, backend or global route. The
public employee route remains `/app/workspace`; the manifest owns six logical screens:
`balances`, `receipt`, `write-off`, `transfer`, `inventory` and `history`.

Warehouse owns its UI, application service, domain records, repository port and local
adapter. It never imports Bar UI. Bar communicates successful terminal order completion
through a typed application port only.

## Access and owner configuration

The Solution Constructor activates the Warehouse workspace, assigns employees, assigns
one or more physical warehouses and manages its immutable Workspace Code. The same
configuration explicitly assigns a source warehouse to Bar. An employee sees only the
physical warehouses assigned to the connected Warehouse workspace. Owner preview uses
the registered renderer without creating a device binding or employee shift.

No source warehouse is inferred. Missing configuration produces an unresolved stock
consumption issue.

## Ledger and balance invariant

Every stock change is an immutable `WarehouseMovement` containing Project, Business
Environment, warehouse, resource, resource type, signed base-unit delta, source
document, actor, Workspace, time, comment and idempotency key. Supported movement types
are opening balance, receipt, write-off, transfer out/in, inventory surplus/shortage,
sale consumption and reversal.

The only balance rule is:

```text
balance(warehouse, resource) = sum(quantityDeltaBase of matching ledger rows)
```

No independently editable balance exists. Transfer and consumption batches append
atomically. Duplicate idempotency keys return the already persisted result. Historical
rows are never edited or deleted; a future return/refund adapter must use the published
reversal port and append opposite `REVERSAL` rows.

Internal units are gram, millilitre and piece. UI formatting may convert 1,250 g to 1.25
kg or 1,750 ml to 1.75 l without changing stored precision.

## Documents

- Opening balance creates one explicit `OPENING_BALANCE` row.
- Manual receipt records physical arrival only; supplier orders, prices, payments and
  financial postings remain outside Warehouse.
- Write-off requires a reason. A negative result requires explicit confirmation.
- Transfer requires two distinct accessible warehouses and appends paired movements with
  the same transfer document identifier.
- Inventory loads all active resources, freezes system quantity in a draft, records
  actual quantity and appends only surplus/shortage differences. Posted documents are
  immutable.

## Recipe consumption

Warehouse consumes the shared Coffee Recipe Engine expansion result. The engine expands
ingredients, preparations, semi-finished products and packages recursively, applies
output ratios and component loss once, aggregates final base-unit requirements, applies
manager-owned modifier effects and detects cycles or missing active recipes.

When a Bar item is configured, its per-item expansion is frozen on the order line. A
later recipe or modifier edit therefore cannot rewrite the physical requirements of an
existing order. Legacy locally persisted orders without a snapshot are expanded once at
completion for migration compatibility; every newly created or edited draft line stores
the snapshot.

Only a successfully completed Bar order triggers consumption. Created, sent, ready,
cancelled or failed orders do not. Kitchen-routed items are skipped until the Kitchen
integration owns a reliable source context. Bar and immediate items use the explicitly
assigned Bar source warehouse. The order ID is the source document and part of every
idempotency key, so retry and refresh cannot duplicate consumption.

Local sales are not blocked by insufficient stock. The signed movement is appended, the
balance becomes negative and the Warehouse UI exposes the warning. Missing warehouse or
recipe configuration records an unresolved issue while preserving the completed order.

## Local persistence and migration

The replaceable adapter stores one schema-versioned store per Project and Business
Environment, emits same-tab and browser `storage` events and survives refresh. React
components never access `localStorage`.

Existing explicit `openingStockBalances` documents are migrated idempotently into
`OPENING_BALANCE` ledger movements. Ingredient `minimumStock`, supplier references,
reference cost and other resource-card fields never fabricate movements. Existing Coffee
resources, orders, employees and Workspace assignments are preserved; no seed reset is
performed.

## Known v1 limits

- Purchasing, supplier pricing, finance, refunds, production and Kitchen UI are not
  implemented.
- Minimum-stock thresholds remain read-only compatibility data until the threshold
  provider receives a real matrix adapter.
- Modifier stock effects are applied only when the manager configuration contains typed
  effects; labels are never interpreted as business rules.
- Local storage provides prototype atomicity in one browser. The future server adapter
  must enforce the same repository contract transactionally.
