# Coffee Reports

## Report contract

A report is a reproducible, permission-scoped snapshot. Every generated report records:

- report ID and definition version;
- Project/location and authorized scope;
- business period, timezone, currency, filters, grouping, and sort;
- source watermark, freshness, completeness, and reconciliation;
- requester, generation time, export event, and retention class.

Regeneration creates a new snapshot and discloses source/definition differences. Export
permission is separate from on-screen read permission.

## Sales and orders

| Report                       | Business purpose                         | Key content                                                                       | Default access                                  |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| Sales Summary                | Understand recognized sales for a period | gross/net sales, tax/service, discounts, refunds, orders, average receipt, guests | Owner, finance-authorized Administrator/Manager |
| Sales by Product/Category    | Evaluate product mix                     | units, net revenue, COGS, gross profit, mix                                       | Cost/profit fields capability-filtered          |
| Sales by Channel/Hour        | Plan service capacity                    | orders, guests, revenue, average receipt by channel/hour                          | Owner, Manager                                  |
| Order Register               | Investigate order lifecycle              | order number, channel/table, times, state dimensions, totals, actor references    | Authorized operations/finance                   |
| Discounts, Voids and Refunds | Review exceptions and controls           | original/result amounts, reason, requester, approver, payment reference           | Owner, Manager, audit/finance grant             |
| Preparation and Fulfillment  | Improve throughput                       | queue, preparation, ready-to-delivery percentiles and exceptions                  | Manager, station-authorized admin               |

## Inventory and procurement

| Report                      | Business purpose                  | Key content                                                        | Default access                      |
| --------------------------- | --------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| Stock on Hand               | Know quantity and value at cutoff | item/lot, warehouse, on-hand, available, value, expiry             | Value hidden without cost grant     |
| Stock Movement              | Trace every quantity/value change | source document, in/out, balance projection, actor/system          | Storekeeper scope; value restricted |
| Inventory Count Variance    | Control physical accuracy         | expected, observed, reconciled movement, variance, approval        | Manager, inventory admin            |
| Write-offs and Losses       | Understand controlled loss        | reason, item, quantity/value, source, requester/approver           | Sensitive reasons restricted        |
| Recipe Consumption Variance | Compare actual and theoretical    | product/recipe version, theoretical/actual, yield/waste variance   | Recipe/cost-authorized roles        |
| Expiry and Slow Stock       | Reduce avoidable loss             | lot expiry, age, quantity/value, last movement                     | Inventory manager/storekeeper scope |
| Purchase Register           | Review procurement                | supplier, order/receipt, quantity, price, discrepancy, status      | Procurement/finance grant           |
| Supplier Performance        | Evaluate operational reliability  | delivery timeliness, fill rate, rejection/discrepancy, price trend | Owner, procurement manager          |
| Transfers in Transit        | Resolve warehouse handoff         | source/destination, dispatched/received, age, variance             | Assigned warehouses and manager     |

## Finance

| Report                | Business purpose                   | Key content                                                          | Default access                  |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------- | ------------------------------- |
| Revenue Statement     | Reconcile recognized income        | revenue components, tax/service liability, reversals, source posting | Finance read                    |
| COGS and Gross Profit | Understand product economics       | net revenue, actual COGS, gross profit/margin, theoretical variance  | Owner and explicit profit grant |
| Operating Profit      | Assess management profitability    | gross profit, posted expenses, operating profit, exclusions          | Owner and explicit profit grant |
| Expense Register      | Control operating spend            | category, counterparty, amount/tax, approval, evidence, posting      | Finance/expense roles           |
| Cash Flow             | Understand tender/cash movement    | receipts, refunds, supplier/expense payments, drawer movements       | Owner/finance                   |
| Tender Reconciliation | Match POS and settlement           | expected, provider/device/cash actual, pending, variance             | Finance/close roles             |
| Daily Closing         | Preserve day-end evidence          | business date checklist, totals, exceptions, counts, approvals       | Owner, Manager, finance         |
| Posting Exceptions    | Resolve missing/unbalanced sources | source, expected posting, reason, age, retry/escalation              | Finance administrator           |

## People and operations

| Report                        | Business purpose              | Key content                                                       | Default access                       |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| Shift Operations              | Review coverage and workload  | assignment/shift, orders/tickets/tasks, hours if enabled          | Manager; personal data restricted    |
| Station Performance           | Improve process               | volume, median/p90 times, holds, re-fires, unavailable events     | Manager, station administrator       |
| Staff Operational Performance | Support coaching and planning | like-for-like throughput, service timing, exceptions, sample size | Explicit people-performance grant    |
| Cash Session                  | Reconcile assigned drawer     | opening, payments, withdrawals, expected/actual, variance, close  | Cashier own; Manager/finance broader |

Staff reports cannot infer wage, rank, misconduct, or automated disciplinary action.
Context, sample size, equipment, station, and demand must accompany person-level data.

## Catalog and recipe

- Published Menu Versions — effective period, products, prices, tax, availability.
- Product Change History — authorized changes and publication impact.
- Recipe Version and Cost — ingredients, yield/waste, theoretical cost and history.
- Unmapped/Invalid Configuration — products without valid recipe/station/unit/policy.

## Report UX

The Reports page offers:

1. purpose-based catalog;
2. recent and saved parameter sets;
3. parameter form with timezone/currency;
4. background generation with progress;
5. accessible on-screen view;
6. authorized export and immutable generation metadata.

Empty results distinguish genuine zero activity from missing/incomplete source data.
Large reports paginate/stream safely and do not block the page. Mobile provides summary
and filters; dense analysis remains downloadable only when export is authorized and
accessible on-screen alternatives exist.

## Export controls

- CSV for tabular machine-readable data, locale-independent columns and ISO timestamps;
- PDF only for fixed human-readable statements where required;
- spreadsheet export when structure/formatting materially helps;
- filename includes report, Project-safe label, period, and generation time;
- exports are generated server-side, encrypted in transit/at rest, expire, and are
  audited;
- formulas or cells beginning with dangerous spreadsheet prefixes are neutralized;
- personal, supplier, finance, and audit exports use classification-specific controls.

## Scheduled reports

Future scheduled delivery requires explicit recipients, capability revalidation at
generation and delivery, secure channel, expiry, timezone, failure notification, and
owner. A role change cancels unauthorized schedules.

## Reconciliation

Financial reports reconcile to posting batches, stock reports to ledger entries, and
order reports to authoritative order state. Every total supports drill-through or a
reconciliation explanation. Analytics projections may accelerate reports only when their
watermark and reconciliation meet the report contract.
