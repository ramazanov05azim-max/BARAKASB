# Coffee Inventory Flow

## Inventory principles

- The stock ledger is authoritative; balance is a projection.
- Every movement has Project, location, warehouse, item, quantity/unit, value policy,
  business time, source document, actor/system authority, and idempotency identity.
- Physical movement, ownership/value recognition, and supplier invoice may occur at
  different times and remain distinct.
- Posted documents are immutable. Reversal and adjustment preserve history.
- Negative stock, unapproved unit conversion, and missing valuation are explicit
  exceptions, never silent corrections.

## Quantity model

```text
on_hand = posted inbound - posted outbound
reserved = quantity committed but not physically consumed
available = on_hand - reserved - blocked/quarantined
```

Units have dimensions such as mass, volume, or count. Conversion between dimensions is
forbidden. Density- or recipe-specific conversions require an explicit approved
conversion, not a global guess.

## Goods receipt

1. Storekeeper selects purchase order or authorized direct-receipt policy.
2. Confirms supplier and destination warehouse.
3. Scans/selects item, unit, received/rejected quantity, lot, expiry, and condition.
4. System compares ordered, previously received, and current receipt.
5. Discrepancies require reason and threshold approval.
6. Review distinguishes physical receipt, purchase price, tax, and invoice reference.
7. Posting creates immutable receipt and stock ledger entries.
8. Procurement and Finance receive versioned receipt/purchase facts.

Duplicate supplier documents or idempotency identities are rejected. A failed post
remains a draft/pending operation; on-hand does not change optimistically.

## Supplier and purchase

Supplier record owns operational terms and approved item relationships. Purchase
lifecycle:

```text
draft -> submitted -> approved -> ordered
-> partially_received -> received -> closed
                         └-> cancelled
```

Purchase price informs valuation according to effective policy but never rewrites older
consumption. Order approval thresholds and separation of duties apply.

## Warehouse transfers

```text
draft -> approved -> dispatched -> in_transit -> received
                                   └-> exception
```

- Dispatch posts outbound from source into an in-transit location.
- Receipt posts inbound to destination.
- Sender and receiver confirm independently when policy requires.
- Shortage/damage creates a variance document; it is not silently assigned to either
  warehouse.
- One-step transfer is allowed only within a controlled physical boundary and policy.

## Inventory counting

1. Create scope: warehouse, zones/items, count time, blind or expected-visible mode.
2. Freeze a ledger cutoff, not necessarily physical operations.
3. Assign count sheets to Storekeepers; one sheet has explicit item scope.
4. Record raw observed quantities without editing system balance.
5. Reconcile movements after cutoff.
6. Calculate variance with quantity and value.
7. Recount or approve according to threshold.
8. Post adjustment entries and retain original counts.

Count cancellation never changes stock. Offline count sheets show snapshot time and
cannot auto-post after reconnect.

## Write-offs and losses

Reason classes:

- expiry/spoilage;
- preparation waste;
- breakage/damage;
- quality rejection;
- theft/suspected loss;
- count variance;
- customer return not reusable;
- equipment/process failure.

Write-off captures item/lot, warehouse, quantity, value, reason, evidence when required,
source operation, requester, and approver. Sensitive loss categories have restricted
visibility. Reversal references the original.

## Recipe consumption

For each fulfilled eligible order line:

1. resolve the captured approved recipe version;
2. expand semi-finished components through an acyclic version graph;
3. convert each ingredient to inventory base unit;
4. choose warehouse/lot using effective policy;
5. create one consumption intent per source line/version;
6. post ledger outbound idempotently;
7. publish actual/theoretical consumption and exception.

Consumption timing is configurable—release, prepared, delivered, or completed—but one
policy version is recorded and only one posting occurs. Cancellation and re-fire have
explicit compensating behavior.

## Production consumption and output

Batch production consumes ingredients and creates a semi-finished or display-case
output:

```text
ingredient outbound + declared process loss -> output inbound
```

Actual yield is recorded. Difference from standard yield becomes production variance,
not a recipe rewrite. Output lot/expiry and downstream consumption retain lineage.

## Returns

### Supplier return

References receipt/lot where possible, posts outbound, records reason and supplier
credit expectation, and emits a Finance adjustment source.

### Customer return

Does not automatically return prepared food/beverage to available stock. Reusable
packaged goods require an explicit inspection policy; otherwise refund and write-off
remain separate linked actions.

### Transfer return

Creates a new reverse transfer; it does not delete the original movement.

## Availability and low stock

Sellability combines published menu, configured recipe, station health, and inventory
availability policy. Low stock may warn or block according to item/Project policy.
Automatic product unavailability is explicit, reversible, and visible to Cashier,
Waiter, and affected stations without exposing quantities/cost.

## Valuation

The initial implementation selects one approved valuation method per item class and
location, such as weighted average or FIFO. Method changes are effective-dated and
require an impact plan. COGS uses the actual posted consumption value; theoretical
recipe cost remains a comparison projection.

## Reconciliation

Daily checks compare:

- order/production consumption intents to posted ledger entries;
- receipts/transfers/documents to ledger entries;
- on-hand projection to ledger rebuild;
- negative/blocked stock;
- missing valuation;
- expired lots/display batches;
- count/write-off approval exceptions.

Analytics receives reconciled facts and freshness; it cannot repair stock.
