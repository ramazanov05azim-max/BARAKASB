# Coffee Solution Conceptual Data Model

## Modeling rules

This is a conceptual ownership model, not a database schema. Each aggregate owns its
state and references other modules by stable ID and versioned snapshot. Every entity is
Project-scoped and, where operationally relevant, location-scoped.

Amounts use explicit currency and decimal precision. Quantities use decimal value, unit,
and dimension. Posted documents are immutable; corrections create linked reversals or
adjustments.

## Shared value concepts

| Concept          | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| Money            | decimal amount + ISO currency + rounding policy version               |
| Quantity         | decimal value + unit ID + dimension                                   |
| BusinessTime     | UTC instant + location timezone + business date                       |
| DocumentIdentity | stable ID + number + version + lifecycle state                        |
| ActorSnapshot    | actor ID + display label + effective assignment reference             |
| SourceReference  | source type + source ID + correlation/idempotency identity            |
| Approval         | requester + approver + reason + threshold/policy version + timestamps |

## Core references

Coffee records reference but do not own:

- Project ID and lifecycle;
- location identity when introduced;
- Actor ID, membership revision, and capabilities;
- audit correlation ID;
- Solution installation/configuration revision;
- object references managed through Core storage contracts.

## Catalog model

```text
Menu
└── MenuVersion
    └── CategoryPlacement
        └── ProductOffer
            ├── Product
            ├── Variant
            ├── ModifierGroup
            ├── Price/Tax Snapshot
            └── RecipeVersion Reference
```

`Product` is stable identity; a published `MenuVersion` captures commercial
presentation. Product archival prevents new sale but retains historical references.
Availability is an operational projection, not a destructive menu edit.

## Recipe model

```text
Recipe
└── RecipeVersion
    ├── Output: quantity + unit + yield
    ├── IngredientLine[]
    │   ├── InventoryItem
    │   ├── gross quantity
    │   ├── preparation waste
    │   └── net consumption
    ├── ProcessStep[]
    ├── CostSnapshot
    └── status: draft / approved / retired
```

An ingredient may reference a purchased item or approved semi-finished output. The
dependency graph must be acyclic for one effective version. Yield and waste are explicit
and cannot be encoded by silently inflating quantity.

## Service-area model

```text
ServiceArea
└── FloorPlanVersion
    ├── Zone[]
    └── Table[]
        ├── stable table ID
        ├── display label
        ├── capacity
        └── coordinates in version
```

Occupancy is derived from active table orders. Moving a table in a new layout version
does not alter historical orders.

## Order model

```text
Order
├── channel + business date + guest count
├── table/service reference or takeaway reference
├── OrderLine[]
│   ├── ProductOfferSnapshot
│   ├── quantity
│   ├── ModifierSnapshot[]
│   ├── Price/Tax/Discount Snapshot
│   ├── RecipeVersion Snapshot/Reference
│   └── commercial + fulfillment state
├── Charge[]
├── PaymentAllocation[]
├── Revision[]
└── lifecycle references
```

An order line is never retroactively changed after production/financial posting.
Corrections create a new revision, cancellation, void, refund, or compensating line
according to state.

## Payment model

```text
Payment
├── order ID
├── tender type
├── requested/authorized/captured/refunded amounts
├── provider/payment-device reference
├── idempotency identity
├── lifecycle
└── Allocation[] -> order charge
```

No raw card data is owned. Cash payments reference a CashSession.

## Production model

```text
PreparationTicket
├── order/revision reference
├── StationTicket[]
│   ├── station
│   ├── preparation lines
│   ├── priority/course/hold
│   └── accepted/preparing/ready/failed timestamps
└── fulfillment status
```

Tickets capture safe preparation instructions. Commercially sensitive fields are not
copied.

## Display-case model

```text
PreparedBatch
├── product/recipe version
├── produced quantity
├── available/reserved/sold/wasted quantity
├── produced/expires time
└── display-case location
```

Every quantity transition has a source document and cannot exceed the prior available
quantity except through an explicit adjustment.

## Inventory model

```text
InventoryItem
├── base unit + allowed conversions
├── valuation policy
└── classification

Warehouse
└── StockLedgerEntry[]
    ├── item + optional lot/expiry
    ├── quantity in/out
    ├── value in/out
    ├── source/destination
    └── source document

InventoryDocument
├── Receipt
├── Transfer
├── Count
├── Adjustment/WriteOff
├── SupplierReturn
├── RecipeConsumption
└── ProductionOutput/Consumption
```

On-hand and available are projections of posted movements. Reservation is separate from
physical quantity. Valuation policy is effective-dated.

## Procurement model

```text
Supplier
├── contacts/terms
└── approved item references

PurchaseOrder
├── supplier + destination warehouse
├── ordered lines
├── approval
└── status

GoodsReceipt
├── purchase-order reference (optional under policy)
├── received/rejected lines
├── price/tax/document reference
└── discrepancy
```

Purchase order, physical receipt, and supplier invoice evidence remain separate even
when entered in one guided workflow.

## People and cash model

```text
OperationalAssignment
├── Core membership reference
├── workspace role
├── location/station/warehouse scope
└── effective interval

Shift
├── actor + assignment
└── start/end

CashSession
├── cashier + device/drawer
├── opening float
├── tender movements
├── expected/actual close
└── variance + approval
```

Coffee Solution does not own credentials, identity profiles, or payroll.

## Finance model

```text
PostingBatch
├── source event/document
├── business date
├── PostingLine[] (balanced)
└── posting status

Expense
├── category + amount/currency
├── counterparty/evidence
├── approval
└── posting reference

DailyClose
├── location + business date
├── order/payment/cash summaries
├── stock/operation exceptions
├── reconciliations
└── approval/lock
```

Finance is a management subledger. Full statutory accounting and tax filing require
future adapters or Solutions.

## Analytics dimensions

Facts reference stable dimensions:

- business date/time interval;
- location;
- channel;
- service area/table class;
- product/category/menu version;
- station;
- employee operational assignment;
- tender type;
- supplier;
- warehouse/item;
- order and source-document drill-through IDs.

Personal data is minimized. Staff performance reports show operational attribution only
to authorized roles and never infer compensation or disciplinary conclusions.

## Principal events

- MenuPublished, ProductAvailabilityChanged
- RecipeVersionApproved
- OrderCreated, OrderConfirmed, OrderRevised, OrderCancelled, OrderCompleted
- PaymentAuthorized, PaymentCaptured, PaymentFailed, PaymentRefunded
- PreparationAccepted, PreparationStarted, ItemReady, OrderDelivered
- GoodsReceived, StockTransferred, InventoryCountPosted, StockWrittenOff
- RecipeConsumed, PreparedBatchProduced, SupplierReturnPosted
- ExpensePosted, PostingBatchCreated, DailyCloseCompleted

Events carry IDs, versions, Project/location, business time, actor/system authority,
placement epoch, correlation, causation, and idempotency identity.

## Retention and privacy

Operational, fiscal, audit, and personal data use distinct retention classes. Deleting
or anonymizing a person preserves required transaction attribution through a lawful
minimal pseudonymous reference. Exports, receipts, supplier documents, and attachments
follow Core object quarantine, authorization, residency, and deletion policy.
