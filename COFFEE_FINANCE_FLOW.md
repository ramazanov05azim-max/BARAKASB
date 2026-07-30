# Coffee Finance Flow

## Scope

Coffee Finance is an operational management subledger. It provides revenue, expense,
purchase, cost of goods, profit, cash-flow, and daily-closing truth for the Solution. It
is not a statutory general ledger, payroll system, tax-filing system, or bank
reconciliation product.

## Accounting principles

- Operational events create balanced posting batches through versioned rules.
- Captured payment is not the same concept as revenue; timing follows declared policy.
- Purchase order, goods receipt, supplier invoice, payment, and expense are distinct.
- Closed periods are never edited. Corrections post into an allowed period and reference
  the original.
- All amounts declare currency, tax/service treatment, business date, source, and rule
  version.
- Analytics and dashboard figures reconcile to postings but are not authoritative.

## Revenue

Revenue originates from completed/recognized order lines:

```text
gross sales
- line/order discounts
- voids/refunds attributable to sales
= net sales before/after tax presentation policy
```

Service charges, tips, taxes, discounts, gift instruments, and other liabilities are
separate components. The report definition states whether tax is included.

## Expenses

Expense lifecycle:

```text
draft -> submitted -> approved -> posted -> reversed/adjusted
```

An expense captures category, counterparty, amount/currency, tax treatment, business
date, payment/cash-flow classification, evidence, and approval. Duplicate supplier
document detection and thresholds apply.

Inventory purchases normally affect inventory value/payable source first; they become
COGS when inventory is consumed, not immediately as operating expense.

## Purchases

Procurement publishes approved order and posted receipt facts. Finance records:

- received inventory value;
- supplier payable/settlement source where enabled;
- tax/fees according to configured classification;
- return/credit adjustments;
- discrepancy awaiting resolution.

Purchase price changes affect new valuation according to policy and never restate old
consumption without an explicit authorized revaluation process.

## Cost of goods sold

```text
COGS = value of posted recipe/production/display-case consumption
     + attributable approved loss policy
     - reversible recoveries/returns
```

Theoretical cost uses recipe quantities and selected purchase cost. Actual COGS uses
posted ledger valuation. The difference is reported as mix, yield, waste, price, or
unresolved variance where data supports attribution.

## Profit

```text
Net Revenue = recognized sales - discounts - sales reversals
Gross Profit = Net Revenue - COGS
Operating Profit = Gross Profit - posted operating expenses
```

Taxes collected, tips payable, capital expenditure, owner withdrawals, financing, and
unclassified cash movements do not silently enter operating profit. Every dashboard
metric links to its definition.

## Cash flow

Cash flow groups actual tender/cash movements:

- customer receipts;
- customer refunds;
- supplier payments where tracked;
- operating-expense payments;
- cash drawer deposits/withdrawals;
- bank/card settlement differences;
- owner/financing movements where future policy permits.

Non-cash revenue/expense and timing differences are disclosed. Cash flow does not equal
profit.

## Payment posting examples

| Source                  | Debit-like operational side     | Credit-like operational side      |
| ----------------------- | ------------------------------- | --------------------------------- |
| Captured cash/card sale | tender clearing/cash            | customer/order settlement         |
| Revenue recognition     | customer/order settlement       | revenue + tax/service liabilities |
| Inventory consumption   | COGS                            | inventory value                   |
| Refund                  | sales reversal/tax adjustment   | cash/tender clearing              |
| Expense payment         | expense/tax asset as classified | cash/tender/payable               |

Names are conceptual and may map to an external accounting system through a future
adapter.

## Daily closing

### Preconditions

- expected trading sessions are ended or explicitly carried;
- payments have no unresolved ambiguous captures;
- cash sessions submit actual counts;
- order completion/void/refund exceptions are resolved;
- required inventory and finance postings are present;
- approval thresholds are satisfied.

### Closing workflow

1. Select location and business date.
2. Snapshot order, payment, cash, refund/void, expense, and posting completeness.
3. Reconcile tender totals with provider/device/cash sessions.
4. Record expected versus actual cash and reason/approval for variance.
5. Review unresolved stock and posting exceptions.
6. Manager prepares close; authorized approver confirms.
7. Create immutable DailyClose and lock the period under policy.
8. Publish close completion and reporting snapshot reference.

Late provider settlement or correction posts as a traceable adjustment. Reopening is
exceptional, capability-controlled, reasoned, and audited; ordinary correction does not
rewrite the close.

## Controls

- idempotent posting by source event/document;
- balanced batch validation;
- immutable rule/version snapshot;
- requester/approver separation above thresholds;
- duplicate receipt/invoice/expense detection;
- sequential document numbering where required by local policy;
- explicit unclassified suspense/exception, never dropped value;
- reconciliation between orders, payments, inventory, finance, and reports;
- finance read, cost/profit read, post, approve, close, reopen, and export as separate
  capabilities.

## Failure behavior

Order service is not blocked by analytics lag. It may be blocked by payment uncertainty
or a policy-critical posting dependency only where explicitly required. Finance posting
failure remains retryable and visible; it cannot generate a second batch. Daily close
cannot present success while required postings or payment reconciliation are uncertain.

## Future extension points

- fiscal receipt/fiscalization adapters;
- jurisdiction-specific tax rules;
- statutory accounting export;
- accounts payable and supplier settlement;
- bank/card settlement import;
- payroll/labor-cost import;
- multi-currency location reporting;
- budget and forecast.
