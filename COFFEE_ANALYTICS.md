# Coffee Analytics

## Purpose

Coffee Analytics helps Owner and authorized Manager decide what requires attention. It
consumes versioned events into eventually consistent projections and never becomes the
source of operational, stock, payment, or finance truth.

## Dashboard hierarchy

1. data freshness and unresolved reconciliation;
2. actionable exceptions;
3. today's core scorecard;
4. trend and comparison;
5. product/cost/inventory drivers;
6. staff operational performance;
7. drill-through to authorized source/report.

Charts are included only when they answer a named question. Every metric exposes
definition, period, timezone/business date, currency, filters, exclusions, source
version, and last update.

## Required owner metrics

### Today's Revenue

- **Question:** How much net revenue has been recognized for the current business date?
- **Formula:** recognized gross sales minus discounts and sales reversals, presented
  with tax inclusion explicitly labeled.
- **Dimensions:** hour, channel, category, product, location.
- **Cautions:** pending payment/order and analytics lag are separate; zero is shown only
  after confirmed completeness.
- **Action:** inspect variance from comparable period or unresolved posting.

### Orders

- **Question:** How many qualified orders were completed?
- **Formula:** distinct completed order IDs, excluding test/cancelled orders and
  identifying fully refunded orders according to the published metric policy.
- **Dimensions:** channel, hour, table/takeaway, location.
- **Action:** inspect demand and completion/failure rate.

### Average Receipt

- **Question:** What is recognized net revenue per qualified completed order?
- **Formula:** net recognized revenue / qualified completed orders.
- **Cautions:** denominator, refunds, taxes, and service charges are defined and stable.
- **Action:** compare channel/product mix, not individual employee blame.

### Guests

- **Question:** How many guests were served?
- **Formula:** sum of confirmed guest count for table orders plus declared takeaway
  guest policy.
- **Quality:** missing/implausible guest counts are reported separately.
- **Action:** evaluate revenue per guest and staffing demand.

### Top Products

- **Question:** Which products drive quantity, revenue, gross profit, or growth?
- **Measures:** units, net revenue, actual COGS, gross profit, mix share.
- **Rule:** “Top” always names the selected measure; quantity and profit are not
  conflated.
- **Action:** inspect availability, menu placement, price, or recipe—not automatic
  recommendation.

### Food Cost

- **Question:** What share of food revenue is consumed by actual food ingredient COGS?
- **Formula:** posted food-class COGS / corresponding net food revenue.
- **Comparison:** theoretical recipe cost and variance are separate.
- **Action:** drill to product, ingredient price, yield, waste, and unresolved stock.

### Beverage Cost

- **Question:** What share of beverage revenue is consumed by actual beverage COGS?
- **Formula:** posted beverage-class COGS / corresponding net beverage revenue.
- **Rule:** ingredient/product classification is versioned.
- **Action:** inspect coffee/milk/syrup mix, yield, waste, and purchase price.

### Profit

- **Question:** What gross and operating profit is supported by posted data?
- **Formula:** net revenue minus COGS; operating profit further subtracts posted
  operating expenses.
- **Cautions:** tax, tips, unclassified postings, missing labor/imported costs, and
  incomplete period are disclosed.
- **Action:** open Profit report or unresolved finance exceptions.

### Inventory Value

- **Question:** What is the current posted value of on-hand inventory?
- **Formula:** ledger on-hand quantity valued by effective item/location policy.
- **Dimensions:** warehouse, category, item, lot/expiry.
- **Cautions:** missing valuation, negative stock, in-transit stock, and projection
  freshness are explicit.
- **Action:** resolve high-value slow/expiring stock or reconciliation exceptions.

### Staff Performance

- **Question:** How is operational workload and service flow performing by assignment?
- **Measures:** assigned/completed items, median and percentile preparation/service
  times, re-fire/void/approval rates, attendance/shift coverage only if separately
  enabled.
- **Rules:** compare like role/station/shift; show sample size; no opaque score or
  automated disciplinary conclusion.
- **Privacy:** restricted capability, retention, minimum group size where appropriate,
  and person-level access auditing.
- **Action:** investigate process, staffing, training, equipment, or routing context.

## Supporting metrics

- revenue/orders by hour and channel;
- open-order age and ready-not-delivered age;
- payment failure/ambiguity and refund/void/discount rate;
- preparation time by station and percentile;
- product availability and stockout duration;
- theoretical versus actual recipe consumption;
- waste and inventory variance;
- purchase price trend;
- daily-close timeliness and reconciliation variance;
- event/projection lag and data-quality exceptions.

## Filters and comparison

Common filters: business period, location, channel, category/product, station,
warehouse, and shift/role where authorized. Default comparison is the most meaningful
equivalent period, clearly stated. Partial current periods compare to the same elapsed
portion, not a full prior day.

Filters remain URL-backed and currency/timezone visible. Cross-Project business
analytics is forbidden in Coffee Solution.

## Drill-through

A metric drills into an authorized analytical breakdown, then to a report or source
document reference. It never bypasses module permissions. Cost/profit drill-through is
not granted merely because a user can see sales count.

## Freshness and quality

Each widget has:

- source watermark and last processed time;
- expected freshness objective;
- completeness/reconciliation status;
- partial/late source indicator;
- metric-definition version.

If data is unavailable, show “Unavailable” or “Incomplete,” not zero. Backfill/replay
updates the projection while preserving definition/version lineage.

## Alerts

Alerts require an owner, threshold/policy, cooldown, scope, destination, and recovery
action. Initial candidates:

- payment or finance posting backlog;
- stockout/negative stock;
- preparation or ready-handoff delay;
- food/beverage cost variance;
- unusual waste/refund/void rate;
- overdue daily close;
- stale analytics projection.

Alerts suggest investigation and never make autonomous disciplinary or financial
decisions.

## Accessibility and responsive behavior

Dashboard starts with an accessible text scorecard and attention list. Charts include
tables or exact-value alternatives, do not depend on color, and retain units. On mobile,
priority metrics stack; complex analysis moves to a dedicated report rather than
shrinking unreadably.

## Future extension points

- forecasting with confidence/assumptions;
- anomaly detection with explainable contributing dimensions;
- multi-location rollup within one Project;
- approved pseudonymized benchmarks;
- staffing and purchase recommendations requiring human confirmation.
