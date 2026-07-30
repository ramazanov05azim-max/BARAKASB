# Coffee Employee Workspaces

## Shared workspace contract

Employee workspaces are independent task surfaces. They contain no Administration,
finance, role, supplier-term, audit, or Project-settings navigation. The shell shows
Project, location, workspace role, shift/device state, connectivity, notifications
relevant to the task, and Sign out/Lock.

An actor assigned to several roles chooses a workspace explicitly. Switching workspace
clears queue state and subscriptions not authorized in the target role.

Offline never implies authoritative payment, posted stock, final completion, or
successful synchronization.

## Cashier Workspace

- **Purpose:** Create and settle customer orders quickly and accurately at an assigned
  point of sale.
- **Available screens:** Start/lock shift, New Order, Current Order, Product
  Search/Menu, Payment, Receipt, Held/Open Orders, Cash Session, bounded Refund/Void
  request.
- **Permissions:** Order create/revise, approved price/discount use, tender capture,
  receipt, assigned cash session, threshold-limited void/refund. No recipe cost,
  inventory value, people, configuration, or reporting.
- **Actions:** Choose takeaway/table when granted, add items/modifiers, set guest count,
  send/confirm, take payment, print/send receipt, hold/resume, request manager approval,
  count/close assigned cash drawer.
- **Navigation:** Fixed task navigation: New Order, Orders, Cash Session, More
  (availability/help/lock). Payment opens as a focused step, not an admin page.
- **Workflow:** Confirm workstation and cash session → create/select order → choose
  channel → add items → validate availability → review total → resolve payment policy →
  release tickets → provide receipt → monitor only cashier-relevant completion.
- **Restrictions:** Cannot manually change taxes, published price, posted payment,
  inventory, recipe, station routing, or another cashier's drawer. Sensitive provider
  data is never displayed.
- **Offline behaviour:** May browse the last authorized menu and build an explicitly
  unsent local draft if policy permits. Card/payment capture, final confirmation,
  receipt fiscal status, refund, and cross-device order access require authoritative
  connectivity. Reconnect validates prices, availability, duplicate identity, and
  permissions before submission.

## Barista Workspace

- **Purpose:** Prepare bar-routed items in the correct order with clear instructions and
  readiness feedback.
- **Available screens:** Bar Queue, Ticket Detail, Preparing, Ready/Hand-off, Item
  Unavailable, Re-fire/Waste reason, Station Status.
- **Permissions:** Read assigned bar tickets and safe instructions; accept/start/ready
  lines; declare temporary unavailability; create bounded waste/re-fire intent. No
  payment, prices, costs, full stock, employee, or admin access.
- **Actions:** Accept next ticket, batch/view compatible items, start, mark ready, flag
  missing ingredient/equipment, request re-fire approval, hand off.
- **Navigation:** Queue is home. Filters are limited to Now, Held, Ready, and Issue.
  Ticket detail returns to the same queue position.
- **Workflow:** Station check-in → acknowledge ticket → review item/modifier/allergen
  instructions → prepare → record issue if any → mark item ready → hand off → next
  priority.
- **Restrictions:** Cannot reorder beyond policy, edit order, substitute ingredient,
  reveal customer/payment information, view theoretical cost, or post stock adjustment.
- **Offline behaviour:** Already acknowledged cached tickets may remain readable. Status
  actions queue locally only when station policy permits and display “Not synchronized.”
  New tickets, cancellation, reprioritization, and readiness are not assumed. Reconnect
  resolves ticket version before applying any action.

## Chef Workspace

- **Purpose:** Execute kitchen preparation while coordinating courses, priorities, and
  exceptions.
- **Available screens:** Kitchen Queue, Course/Station View, Ticket Detail, Preparing,
  Ready, Hold/Resume, Re-fire/Production Loss, Station Status.
- **Permissions:** Read assigned kitchen tickets and safe recipe instructions;
  accept/start/ready; record production issue/loss within policy. No payment, supplier
  price, margin, employee management, or bar-only queue.
- **Actions:** Accept ticket, start line/course, coordinate station handoff, hold/resume
  under policy, mark ready, declare unavailable, record re-fire/loss reason.
- **Navigation:** Queue home with station and course filters; large-format focus mode is
  allowed but remains keyboard and touch accessible.
- **Workflow:** Station check-in → queue priority → accept → prepare by approved version
  → coordinate course → mark ready → resolve exception → next ticket.
- **Restrictions:** Cannot alter recipes while executing, change ordered quantity,
  complete payment/delivery, or directly edit stock balances.
- **Offline behaviour:** Same conservative model as Barista. Cached recipe instructions
  show version/freshness. A stale cancellation or recipe revision must be resolved
  before queued offline status can apply.

## Waiter Workspace

- **Purpose:** Manage assigned tables and customer service from seating through delivery
  and bill request.
- **Available screens:** Floor/Section, Table Order, Menu/Product Search, Order Review,
  Preparation Status, Ready to Deliver, Bill/Payment Request, Transfer/Manager Request.
- **Permissions:** Read assigned floor/section; open and revise allowed table orders;
  send tickets; see readiness; mark delivered; request payment. Tender capture requires
  separate cashier capability.
- **Actions:** Select table, set guests, add items/modifiers, add service notes, send
  lines, hold/fire course where configured, monitor status, deliver, request bill,
  request table/order transfer.
- **Navigation:** Floor is home; bottom actions: Tables, Ready, Current Order, More.
  Administration and broad reports are absent.
- **Workflow:** Start shift/section → open table → capture guests/order → confirm/send →
  monitor preparation → collect ready items → deliver → request/accept authorized
  payment → complete service.
- **Restrictions:** Cannot publish menu, change base price/tax, view costs/profit, edit
  recipe/stock, access unassigned sections beyond granted support, or transfer without
  policy.
- **Offline behaviour:** May draft unsent table lines locally if policy allows.
  Occupancy, duplicate open orders, final send, payment, transfer, and completion
  require connectivity. Reconnect revalidates table/order revision and presents
  conflicts for deliberate merge.

## Storekeeper Workspace

- **Purpose:** Execute physical stock work accurately within assigned warehouses.
- **Available screens:** Receiving Tasks, Goods Receipt, Transfers, Count Tasks, Count
  Entry, Write-off Draft, Supplier Return Draft, Item Lookup/Barcode, Exceptions.
- **Permissions:** Read assigned warehouse items/documents; receive, transfer, count,
  draft write-off/return; post only within explicit thresholds. Cost visibility is a
  separate grant.
- **Actions:** Scan/select item, enter lot/expiry/quantity, compare expected receipt,
  record rejected/damaged goods, count blind where configured, submit variance,
  prepare/confirm transfer handoff.
- **Navigation:** Tasks is home; Receive, Move, Count, More. Document status is always
  visible.
- **Workflow:** Select assigned task → verify warehouse/source → scan/count quantities →
  record lot/expiry/discrepancy → review → submit/post or request approval → receive
  authoritative document number.
- **Restrictions:** Cannot edit on-hand balance, supplier terms, recipe, sale, finance,
  employee roles, or another warehouse. Cannot approve own above-threshold variance.
- **Offline behaviour:** Assigned count or receipt worksheet may be downloaded with
  explicit timestamp and scope. Entries remain unposted drafts. Reconnect checks task
  revision, duplicate receipt, item status, lot, and permission; conflicts require
  review, never last-write-wins.

## Shared queue behavior

- Queue order is server-defined from priority, promised time, course, and policy.
- New/changed/cancelled items are announced without relying on sound.
- Slow or disconnected devices cannot consume unbounded realtime buffers.
- Reconnect fetches authoritative state and identifies gaps.
- One employee cannot claim the same exclusive work item twice; claim is fenced and
  expires visibly.
- Manager override records reason and never silently changes historical timestamps.

## Device and session safety

- Shared devices support quick lock but not shared identities.
- Role/workspace and Project are visible at all times.
- Shift end locks active operational workspace and requires explicit handoff.
- Local drafts are Project-, actor-, device-, and workspace-scoped, encrypted where
  supported, bounded, and purged after sync/expiry/sign-out.
- Notifications reveal only the minimum preparation or task information on lock screens.
