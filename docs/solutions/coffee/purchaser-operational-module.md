# Coffee Purchaser Operational Module v1

## Status and boundary

Purchaser is a Coffee-owned Operational Module registered through
`OperationalModuleManifest` in the existing Universal Application. It adds no browser
application, deployable, composition root, backend or global route. The employee route
remains `/app/workspace`; the manifest owns the logical screens `needs`, `orders`,
`deliveries`, `suppliers` and `history`.

Purchaser owns its domain records, application service, local repository adapter,
navigation and UI. It does not reuse Warehouse or Bar UI. Stock is read and changed only
through the public Warehouse application interface.

## Access and owner configuration

The Solution Constructor activates the Purchaser workspace, assigns employees and one or
more physical destination warehouses, and manages its immutable Workspace Code. The
Universal Application renders the module only for an authenticated active employee who
is assigned to that workspace. Owner preview uses the same registered renderer without
creating a device binding.

Project and Business Environment identifiers scope every repository operation but are
never displayed to the employee. A workspace cannot read supplier orders, deliveries or
price history belonging to another scope.

## Purchase need calculation

The `Потребность` screen is a read model over the authoritative Warehouse ledger. For
each active ingredient or package in each assigned physical warehouse it displays the
current ledger balance, configured threshold, recommended quantity, preferred supplier
and last actual price.

The only v1 recommendation rule is:

```text
recommended quantity = max(0, threshold − warehouse balance)
```

If no threshold exists, the UI explicitly reports that it is not configured and makes no
recommendation. Negative, zero and below-minimum balances remain visible. Product names,
barcodes and configured supplier assortment are searched as data; labels are not
interpreted as business rules.

## Supplier directory and assortment

Suppliers remain Coffee master data. Purchaser adds a scoped assortment relation between
a supplier and an ingredient or package. The relation stores supplier nomenclature,
supplier SKU, purchase unit, package conversion, last known price and preferred status.
Only one active preferred supplier is retained per resource. Deactivation preserves
history; deletion is rejected when assortment or documents reference the supplier.

Existing exact supplier references on ingredients are migrated idempotently into the
assortment store. Ambiguous or unknown legacy references produce a visible configuration
warning and are never guessed.

## Supplier orders

A supplier order contains one supplier, one destination warehouse and one or more lines.
Each line freezes the resource name, type, purchase unit, package size, ordered
quantity, expected unit price and total. Draft orders are editable. Sending freezes the
document; cancel requires a reason. Status transitions are:

```text
DRAFT → SENT → PARTIALLY_DELIVERED → DELIVERED
  └──────────────→ CANCELLED
```

Inactive resources and supplier changes cannot rewrite a sent historical document.

## Delivery and Warehouse integration

A delivery is created only against a sent or partially delivered supplier order. The
employee records the supplier document, date, actual quantities and actual prices.
Partial delivery is supported; subsequent deliveries complete the same order. Quantity
above the remaining order is rejected unless the employee explicitly confirms the
overdelivery.

Posting calls the Warehouse receipt application service with one idempotent batch. Only
after Warehouse accepts the receipt does Purchaser persist the immutable posted
delivery, the new order status, actual price history and updated assortment price. If
Warehouse rejects the operation, the delivery remains a draft and no Purchaser history
changes. On retry, Warehouse idempotency prevents duplicate movements and Purchaser
completes its own commit. A future server adapter must implement the same workflow with
transactional outbox coordination.

Every posted delivery preserves destination warehouse, supplier, resource and employee
snapshots. The history screen supports document, supplier, warehouse, resource,
employee, status, date and full-text filters.

## Local persistence and synchronization

The replaceable adapter stores schema-versioned data under a dedicated namespace per
Project and Business Environment. React components never access `localStorage`. The
adapter emits same-tab notifications and handles browser `storage` events, so changes
survive refresh and propagate between tabs. Warehouse balances remain in the Warehouse
store; Purchaser never maintains a second balance.

## Known v1 limits

- Persistence and atomic coordination are browser-local; no backend or online sync is
  introduced.
- Thresholds use the existing resource minimum-stock compatibility field until a
  warehouse-specific threshold adapter is approved.
- Purchase payments, finance postings, supplier analytics and automatic ordering are
  outside this module.
- The local adapter cannot provide distributed transactions. Its Warehouse-first,
  idempotent retry sequence is deliberately replaceable by the future server contract.
