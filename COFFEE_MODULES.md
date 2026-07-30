# Coffee Solution Modules

## Dependency rule

Modules own their business state and expose versioned application contracts and events.
No module reads or writes another module's repository. Cross-owner workflows use
idempotent commands, process managers, and outbox events.

## 1. Catalog

- **Purpose:** Define what can be sold and how it appears in channels.
- **Responsibilities:** Menus, categories, products, variants, modifiers, availability,
  tax/service classification, price schedules, display order.
- **Inputs:** Administrator commands, effective configuration, recipe references,
  availability facts.
- **Outputs:** Versioned sellable-item snapshot, menu publication, product availability
  events.
- **Dependencies:** Core capabilities; public Recipe availability/cost query; no stock
  repository access.
- **Business Rules:** Published menu versions are immutable; an order captures its
  effective version; archived products remain readable in history.
- **Future Extension Points:** channel pricing, loyalty labels, allergen provider,
  digital menu, delivery marketplace mapping.

## 2. Recipes

- **Purpose:** Define controlled conversion of ingredients into sellable or intermediate
  products.
- **Responsibilities:** Technical cards, ingredients, units, yield, preparation loss,
  portion loss, version approval, theoretical cost.
- **Inputs:** Ingredient catalog, unit conversions, approved purchase-cost policy,
  authorized recipe commands.
- **Outputs:** Immutable approved recipe version, consumption specification,
  theoretical-cost projection.
- **Dependencies:** Inventory item/unit public contracts; Catalog product identity.
- **Business Rules:** Only approved effective versions drive consumption; historical
  orders retain their recipe snapshot; unit conversion must be dimension-compatible.
- **Future Extension Points:** variants, semi-finished goods, batch production,
  nutrition/allergen calculation, substitute policies.

## 3. Service Area

- **Purpose:** Model halls, zones, tables, seats, and takeaway service points.
- **Responsibilities:** Floor plan, table identity/capacity/state, reservation-ready
  extension slots, waiter sections.
- **Inputs:** Administrative layout changes, order/table facts.
- **Outputs:** Published floor-plan version and table-occupancy projection.
- **Dependencies:** Orders public status; Core Project/location.
- **Business Rules:** Layout changes do not rewrite historical table references; active
  tables cannot be removed without safe reassignment.
- **Future Extension Points:** reservations, queue/waitlist, QR ordering, multiple
  halls.

## 4. Orders

- **Purpose:** Own the commercial intent and item lifecycle of a customer order.
- **Responsibilities:** Order creation, items/modifiers, pricing snapshot, discounts,
  taxes, guests, channel, holds, void/cancel, completion coordination.
- **Inputs:** Catalog snapshots, actor/device/table context, payment and fulfillment
  facts.
- **Outputs:** Order events, preparation tickets, inventory-consumption intent,
  financial-posting intent.
- **Dependencies:** Catalog public contract, Service Area, Payment, Production,
  configuration policy.
- **Business Rules:** Confirmed lines are versioned; price/quantity changes create
  traceable revisions; completion requires policy-satisfied payment and fulfillment.
- **Future Extension Points:** split/merge bills, deposits, reservations, delivery,
  loyalty, external ordering.

## 5. Payments

- **Purpose:** Track tender intent, authorization, capture, refund, and reconciliation
  references.
- **Responsibilities:** Cash/card/approved tenders, split payment, tips/service charge,
  refunds, payment-device/provider status, cash drawer association.
- **Inputs:** Amount due, tender selection, provider/cash confirmation.
- **Outputs:** Authorized/captured/failed/refunded facts and settlement references.
- **Dependencies:** Orders amount-due contract; external payment adapter; Finance event
  contract.
- **Business Rules:** Idempotency is mandatory; provider success is authoritative;
  payment data is minimized; refunds reference original capture.
- **Future Extension Points:** gift balance, QR pay, account credit, deposits, new
  providers.

## 6. Production Routing

- **Purpose:** Convert eligible order lines into station-specific preparation work.
- **Responsibilities:** Kitchen/bar routing, ticket sequencing, priorities, holds,
  preparation status, readiness, re-fire/waste reason.
- **Inputs:** Preparation ticket, station/menu routing configuration, availability.
- **Outputs:** Accepted/preparing/ready/failed line facts and consumption trigger.
- **Dependencies:** Orders contract, Kitchen/Bar configuration, Recipes consumption
  specification.
- **Business Rules:** One line may route to one or more stations; queue acknowledgment
  is idempotent; stations see no commercial or personnel-sensitive data.
- **Future Extension Points:** kitchen display devices, printers, course firing,
  production batching, prep-time prediction.

## 7. Display Case

- **Purpose:** Track ready-to-sell prepared quantities with freshness and loss.
- **Responsibilities:** Batches, placement, available quantity, expiry, reservation for
  order, sale, return, and waste.
- **Inputs:** Production batch, stock transfer, sale/reservation, expiry policy.
- **Outputs:** Availability facts, consumption/release, expiry/write-off intent.
- **Dependencies:** Inventory, Recipes, Orders.
- **Business Rules:** Quantity cannot become negative without explicit controlled
  variance policy; expired batches are unavailable; FIFO/FEFO policy is versioned.
- **Future Extension Points:** smart labels, visual count, dynamic markdown.

## 8. Inventory

- **Purpose:** Provide authoritative quantity and value movements per warehouse.
- **Responsibilities:** Items, units, warehouses, lots, receipts, transfers, counts,
  write-offs, returns, recipe/production consumption, valuation.
- **Inputs:** Posted inventory documents and approved consumption intents.
- **Outputs:** Immutable ledger entries, on-hand/available projections, variance and
  replenishment events.
- **Dependencies:** Core Project/location; Recipes specification; Procurement documents.
- **Business Rules:** No direct balance edits; every movement is balanced by source and
  destination/reason; negative stock is policy-controlled and visible.
- **Future Extension Points:** lot/expiry, barcode, demand planning, central warehouse,
  supplier EDI.

## 9. Procurement

- **Purpose:** Control supplier, purchase, receipt, return, and payable-source
  documents.
- **Responsibilities:** Suppliers, purchase orders, expected delivery, goods receipt,
  discrepancy, supplier return, purchase-price facts.
- **Inputs:** Replenishment need, supplier terms, ordered and received quantities,
  invoice reference.
- **Outputs:** Approved order, receipt/return intent, purchase-cost and payable-source
  facts.
- **Dependencies:** Inventory item/warehouse contract; Finance posting contract.
- **Business Rules:** Order, receipt, and invoice are distinct; posting is immutable;
  discrepancies require reason and approval threshold.
- **Future Extension Points:** approval workflows, tendering, EDI, automated reorder,
  central procurement.

## 10. People and Operations

- **Purpose:** Map Core memberships to coffee-shop operational assignments.
- **Responsibilities:** Workspace assignment, location/station eligibility, shifts,
  cashier drawer assignment, waiter section, operational performance attribution.
- **Inputs:** Core actor/membership facts and authorized operational assignments.
- **Outputs:** Effective workspace/station context and labor-performance facts.
- **Dependencies:** Core Access Control and Project membership.
- **Business Rules:** It does not own identity, password, platform role, payroll, or
  authentication; expired/suspended memberships remove workspace access.
- **Future Extension Points:** scheduling, time clock, payroll export, certification.

## 11. Finance

- **Purpose:** Produce traceable management-finance postings from operational events.
- **Responsibilities:** Revenue, tax/service liability, tender movement, purchases,
  expense documents, COGS, gross/operating profit projections, cash flow, daily close.
- **Inputs:** Captured/refunded payments, completed/voided orders, inventory valuation,
  receipts, expenses, cash counts.
- **Outputs:** Immutable subledger postings, daily-close document, management statements
  and reconciliation exceptions.
- **Dependencies:** Orders, Payments, Inventory, Procurement; no direct repository
  access.
- **Business Rules:** Balanced posting sets, one currency per posting, closed periods
  adjust through later entries, no silent edit.
- **Future Extension Points:** fiscalization, tax jurisdiction adapters, accounting
  export, bank feed, payroll cost.

## 12. Analytics

- **Purpose:** Deliver eventually consistent decision projections without becoming
  operational truth.
- **Responsibilities:** KPI definitions, dimensional projections, freshness/quality,
  authorized owner and manager dashboards.
- **Inputs:** Versioned events from operational modules.
- **Outputs:** Aggregated metrics, trends, anomalies, drill-through references.
- **Dependencies:** Published contracts only; governed analytics boundary.
- **Business Rules:** Every metric declares formula, timezone, business date,
  exclusions, currency, grain, and freshness.
- **Future Extension Points:** forecasting, anomaly detection, benchmarks, cohort and
  multi-location views.

## 13. Reports

- **Purpose:** Produce reproducible operational and management documents for a declared
  period and filter set.
- **Responsibilities:** Report catalog, generation requests, snapshots, export policy,
  retention, access.
- **Inputs:** Authorized ledger/projection contracts and report parameters.
- **Outputs:** Versioned report snapshot/export with generation metadata.
- **Dependencies:** Finance, Inventory, Orders, People, Analytics public contracts.
- **Business Rules:** Report definition/version and filters are recorded; sensitive
  exports are audited; regenerated reports disclose changed source state.
- **Future Extension Points:** scheduled delivery, accounting formats, regulator/fiscal
  adapters.

## 14. Coffee Configuration

- **Purpose:** Own versioned Solution policies and routing configuration.
- **Responsibilities:** Business-day boundary, units, rounding, order/payment policies,
  station routing, stock/variance thresholds, approval levels.
- **Inputs:** Authorized administration commands.
- **Outputs:** Effective configuration snapshot and change events.
- **Dependencies:** Core Project lifecycle and Audit.
- **Business Rules:** Changes are effective-dated; critical changes require impact
  preview and cannot rewrite posted history.
- **Future Extension Points:** configuration templates, multi-location inheritance,
  policy approval workflow.

## Module acceptance template

Every future Solution module must document the same seven fields: Purpose,
Responsibilities, Inputs, Outputs, Dependencies, Business Rules, and Future Extension
Points. It must additionally publish capability ownership, data classification, contract
versions, failure behavior, observability, and migration strategy before implementation.
