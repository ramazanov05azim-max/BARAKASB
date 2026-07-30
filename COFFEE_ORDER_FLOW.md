# Coffee Order Flow

## Canonical outcome

```text
Customer
-> Table or Takeaway
-> Order Created
-> Payment Eligibility Resolved
-> Kitchen / Bar Queue
-> Preparation
-> Ready
-> Delivered
-> Completed
-> Inventory Consumption Posted
-> Financial Posting Created
-> Analytics Updated
```

“Payment eligibility resolved” means captured prepayment, authorized tender, or an
explicit pay-later/open-check policy for table service. It does not report revenue or
cash before authoritative capture.

## Orthogonal state machines

### Commercial order

```text
draft -> confirmed -> in_service -> completed
   └------> cancelled
```

### Payment

```text
not_required_yet -> pending -> authorized -> captured
                         └-> failed
captured -> partially_refunded -> refunded
```

### Fulfillment

```text
not_released -> queued -> preparing -> partially_ready -> ready
-> partially_delivered -> delivered
```

### Inventory

```text
not_applicable -> consumption_pending -> posted
                                      └-> exception
```

### Finance

```text
not_postable -> posting_pending -> posted -> reversed/adjusted
```

An order summary derives a user-facing status from these dimensions without destroying
their detail.

## Main flow

| Step                      | Owner                           | Rules and outputs                                                                                                              | Failure/recovery                                                                                 |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 1. Start                  | Cashier/Waiter                  | Select Project/location/workspace, active menu, channel, business date, table or takeaway. Create idempotent draft.            | Invalid table/location blocks creation without reserving hidden state.                           |
| 2. Build order            | Orders                          | Add product-offer snapshots, variants, modifiers, quantities, guest count, safe notes. Calculate amount from published policy. | Stale menu/price returns reviewable differences; input is preserved.                             |
| 3. Confirm                | Orders                          | Validate product availability, table ownership, permissions, discount/approval, and revision. Freeze confirmed revision.       | Unavailable line offers remove/replace only through approved choices; no automatic substitution. |
| 4. Resolve payment policy | Payments/Orders                 | Takeaway normally captures/authorizes before release. Table service may create an approved open check. Record tender state.    | Timeout remains pending until provider reconciliation; retry uses same idempotency identity.     |
| 5. Release tickets        | Orders/Production               | Route eligible lines by effective station configuration and publish tickets atomically with order fact via outbox.             | Unmapped line blocks release and alerts administrator; no silently lost ticket.                  |
| 6. Accept/prepare         | Production                      | Station accepts, starts, holds, or reports issue. Version and cancellation are checked.                                        | Reject/unavailable/re-fire creates explicit exception; manager/customer decision revises order.  |
| 7. Ready                  | Production                      | Required station lines reach ready; order readiness projection updates.                                                        | Partial readiness remains explicit; timeout/escalation does not fake ready.                      |
| 8. Deliver                | Waiter/Cashier/Barista by grant | Record handoff/served state with actor and time.                                                                               | Wrong/stale order version is rejected; disputed delivery uses manager workflow.                  |
| 9. Settle and complete    | Orders/Payments                 | Verify payment policy, delivery, unresolved lines, and approvals. Capture remaining table payment, then complete.              | Provider ambiguity keeps order open/pending; no double capture or premature completion.          |
| 10. Consume inventory     | Inventory                       | Apply approved recipe/order snapshots once using source-line identity; post movements.                                         | Insufficient/negative policy creates visible exception without duplicating consumption.          |
| 11. Post finance          | Finance                         | Create balanced revenue/tax/tender/COGS posting sets from authoritative facts.                                                 | Posting retries idempotently; daily close sees unresolved exception.                             |
| 12. Update analytics      | Analytics                       | Consume versioned facts and update projections with freshness.                                                                 | Lag never blocks order; dashboard shows freshness and reconciliation status.                     |

## Order revision rules

- Draft lines may be edited freely within current permissions.
- Confirmed but unreleased lines create a new revision.
- Released/preparing lines require cancellation acknowledgment or re-fire policy.
- Ready/delivered lines cannot disappear; correction is void/refund/compensating stock
  and finance flow.
- Price override, discount, comp, void, and refund record reason, approver, original
  amount, resulting amount, and policy version.
- Split/merge is a future extension; initial contracts preserve allocation identities so
  it can be added compatibly.

## Table service

- A table can have an active service session with one or more order revisions.
- Occupancy is derived and never manually toggled without an exception reason.
- Waiter transfer changes assignment, not historical actor attribution.
- Moving tables preserves the order and records from/to table and authorization.
- Pay-later is an explicit Project policy; amount due remains visible until capture.

## Takeaway

- Uses customer-facing order number that does not expose internal sequence volume.
- Preparation release normally requires captured/authorized payment.
- Customer identity is optional unless required for notification/receipt and is
  minimized.
- Handoff requires order-number verification or approved equivalent.

## Kitchen and bar routing

One order revision can generate multiple station tickets. Each line carries:

- public item name and permitted customer note;
- modifiers and allergen warning as configured;
- quantity, course, priority, promise/handoff identity;
- order/revision/line identity;
- safe recipe/preparation version;
- cancellation and re-fire state.

Stations never receive price, tender, profit, supplier terms, or unnecessary customer
identity.

## Cancellation, void, refund, and re-fire

| Action  | Meaning                                  | Required effects                                                                     |
| ------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Cancel  | Stop an unpaid/unfulfilled order or line | cancel ticket, release reservation, record reason                                    |
| Void    | Reverse a commercial line under policy   | preserve original, approval, stock/finance correction if posted                      |
| Refund  | Return captured money                    | provider/cash reference, allocation, financial reversal                              |
| Re-fire | Produce a replacement after failure      | new preparation identity, waste/consumption reason, no duplicate sale unless charged |

These terms are not interchangeable.

## Idempotency and concurrency

- Order creation, payment, ticket release, readiness, delivery, consumption, posting,
  and completion each have stable command identities.
- Mutations compare expected order/document version.
- Payment reconciliation may confirm a prior timeout without a second charge.
- One source line can produce each intended stock/finance posting only once.
- Realtime is notification only; reconnect reloads authoritative order state.

## Offline behavior

Local unsent drafts may be allowed for menu browsing and data entry. Authoritative order
confirmation, price/availability acceptance, payment, production release, delivery
completion, inventory posting, and finance posting require connectivity.

Reconnect submits the original idempotency identity and expected version. Conflicts are
shown for deliberate resolution; last-write-wins is forbidden.

## Audit and observability

Trace order, payment, tickets, inventory entries, posting batches, and analytics
projection through correlation/causation IDs. Monitor confirmation latency, payment
ambiguity, routing failure, queue age, preparation time, unserved-ready time,
consumption/posting lag, and duplicate-rejection rate.
