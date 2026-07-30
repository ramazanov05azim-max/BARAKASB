# Coffee Solution Roles

## Role model

Roles are Project-owned bundles of stable capabilities. They provide safe defaults, not
hard-coded authorization. Custom roles may be created from capabilities but cannot
bypass separation of duties, Project isolation, or Core policy.

Operational assignment is separate from platform membership. A user may be a Manager and
also work a Barista shift, but enters each workspace explicitly.

## Owner

- Accountable for the Project, subscription, financial visibility, sensitive policy,
  ownership, and lifecycle.
- Receives full Coffee administrative capabilities except platform-operator functions.
- High-risk actions require recent authentication and may require dual confirmation.
- The last owner cannot be removed or surrender ownership without transfer/deletion.

## Administrator

- Maintains configuration, users, menu, recipes, stations, suppliers, inventory, and
  integrations according to delegated capabilities.
- Does not receive ownership transfer, Project deletion, unrestricted finance, or
  billing-secret access by default.
- Cannot grant a capability they are not allowed to delegate.

## Manager

- Runs daily operations, availability, shifts, exceptions, purchases, counts,
  write-offs, expenses, and daily closing within thresholds.
- Sees operational performance and approved financial summaries.
- Cannot change ownership, platform security, immutable posted history, or policy above
  delegated limits.

## Cashier

- Creates and edits permitted orders, accepts approved tenders, issues receipts, and
  manages the assigned cash session.
- Can perform bounded void/refund actions only under configured threshold; otherwise
  requests approval.
- Cannot view recipes, supplier cost, profit, general inventory valuation, employees, or
  administration.

## Barista

- Sees bar-routed preparation tickets, required product/modifier instructions, safe
  ingredient/allergen notes, priorities, and readiness actions.
- Records preparation, unavailable item, re-fire, and permitted waste reason.
- Cannot see payment amounts, customer finance, recipe cost, stock valuation, or
  administration.

## Chef

- Sees kitchen-routed tickets, course/priority, preparation instructions, and safe
  ingredient/allergen notes.
- Records preparation, readiness, re-fire, and permitted production loss.
- Cannot see payment, supplier prices, margins, employee management, or bar-only queues.

## Waiter

- Uses assigned floor/section, opens table orders, adds allowed items, sends preparation
  tickets, tracks readiness, delivers, and requests bill/payment.
- May accept payment only if separately granted cashier tender capability.
- Cannot change menu configuration, prices, recipes, stock, roles, or finance.

## Storekeeper

- Receives goods, transfers stock, performs assigned counts, prepares write-off/return
  drafts, and investigates quantity variances.
- Posts documents only within assigned warehouse and approval threshold.
- Cannot view sales revenue, profit, employee administration, or modify recipes/prices.

## Custom roles

Custom roles:

- start from a named template;
- show the difference from the template;
- require an owner-approved delegate boundary;
- cannot combine restricted finance approval and originating action when separation of
  duties applies;
- are versioned so historical decisions retain the effective grant revision.

## Assignment constraints

- location, warehouse, station, shift, and amount threshold may narrow a role;
- temporary elevation has reason, approver, expiry, and audit;
- role changes invalidate active workspace navigation and realtime subscriptions;
- employee session never silently enters an administrative workspace after elevation;
- role title is not authorization evidence—capabilities and context are.
