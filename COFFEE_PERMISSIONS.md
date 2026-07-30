# Coffee Solution Permissions

## Capability convention

```text
solution.coffee.<module>.<action>
```

Actions use `read`, `create`, `update`, `approve`, `post`, `void`, `refund`, `export`,
`manage`, or a specific operational verb. Capabilities are further constrained by
Project, location, warehouse, station, shift, document state, amount, and policy.

Legend: **A** allowed by default, **L** limited by assignment/threshold, **—** not
granted. Owner defaults remain subject to step-up and separation-of-duty policy.

## Administrative permissions

| Capability group              | Owner | Administrator | Manager | Cashier | Barista | Chef | Waiter | Storekeeper |
| ----------------------------- | :---: | :-----------: | :-----: | :-----: | :-----: | :--: | :----: | :---------: |
| Administration overview       |   A   |       A       |    A    |    —    |    —    |  —   |   —    |      —      |
| Floor plan configure          |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      —      |
| Menu/category/product read    |   A   |       A       |    A    |    L    |    L    |  L   |   L    |      L      |
| Menu/category/product manage  |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      —      |
| Price/discount policy manage  |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      —      |
| Recipe read                   |   A   |       A       |    A    |    —    |    L    |  L   |   —    |      L      |
| Recipe cost read              |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      L      |
| Recipe create/update          |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      —      |
| Recipe approve/publish        |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      —      |
| Kitchen/bar/display configure |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      —      |
| Supplier read/manage          |   A   |       A       |    A    |    —    |    —    |  —   |   —    |      L      |
| Purchase create               |   A   |       A       |    A    |    —    |    —    |  —   |   —    |      L      |
| Purchase approve/post         |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      L      |
| Inventory value read          |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      L      |
| Inventory document approve    |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      L      |
| Employee/role read            |   A   |       A       |    A    |    —    |    —    |  —   |   —    |      —      |
| Employee invite/assignment    |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      —      |
| Role/capability manage        |   A   |       L       |    —    |    —    |    —    |  —   |   —    |      —      |
| Revenue/profit read           |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      —      |
| Expense create                |   A   |       A       |    A    |    —    |    —    |  —   |   —    |      —      |
| Expense approve/post          |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      —      |
| Daily close approve           |   A   |       L       |    A    |    L    |    —    |  —   |   —    |      —      |
| Reports read/export           |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      —      |
| Coffee settings manage        |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      —      |
| Coffee audit read             |   A   |       A       |    L    |    —    |    —    |  —   |   —    |      —      |

## Employee workspace permissions

| Capability                         | Owner | Administrator | Manager | Cashier | Barista | Chef | Waiter | Storekeeper |
| ---------------------------------- | :---: | :-----------: | :-----: | :-----: | :-----: | :--: | :----: | :---------: |
| Open assigned workspace            |   L   |       L       |    A    |    A    |    A    |  A   |   A    |      A      |
| Create takeaway order              |   A   |       L       |    A    |    A    |    —    |  —   |   L    |      —      |
| Create/manage assigned table order |   A   |       L       |    A    |    L    |    —    |  —   |   A    |      —      |
| Apply bounded discount             |   A   |       L       |    L    |    L    |    —    |  —   |   L    |      —      |
| Accept cash/card tender            |   A   |       L       |    A    |    A    |    —    |  —   |   L    |      —      |
| Void unpaid line/order             |   A   |       L       |    A    |    L    |    —    |  —   |   L    |      —      |
| Refund captured payment            |   A   |       L       |    L    |    L    |    —    |  —   |   —    |      —      |
| View bar queue                     |   L   |       L       |    A    |    —    |    A    |  —   |   L    |      —      |
| Advance bar preparation            |   L   |       —       |    A    |    —    |    A    |  —   |   —    |      —      |
| View kitchen queue                 |   L   |       L       |    A    |    —    |    —    |  A   |   L    |      —      |
| Advance kitchen preparation        |   L   |       —       |    A    |    —    |    —    |  A   |   —    |      —      |
| View assigned floor/tables         |   A   |       L       |    A    |    —    |    —    |  —   |   A    |      —      |
| Mark delivered/served              |   A   |       L       |    A    |    L    |    L    |  L   |   A    |      —      |
| Receive goods                      |   A   |       L       |    A    |    —    |    —    |  —   |   —    |      A      |
| Transfer stock                     |   A   |       L       |    A    |    —    |    —    |  —   |   —    |      L      |
| Enter inventory count              |   A   |       L       |    A    |    —    |    —    |  —   |   —    |      A      |
| Create write-off/return draft      |   A   |       L       |    A    |    —    |    L    |  L   |   —    |      A      |
| Post stock adjustment              |   A   |       L       |    L    |    —    |    —    |  —   |   —    |      L      |

## Sensitive-action rules

- Refunds, voids, discounts, write-offs, purchase discrepancies, expenses, and stock
  adjustments use configurable amount/percentage thresholds.
- Above-threshold action becomes an approval request; the requester cannot approve their
  own action where separation of duties is configured.
- Secret, role, ownership, export, and destructive operations require recent
  authentication.
- Export permission is never implied by read permission.
- Cost, price, margin, compensation, and personal data are separate disclosure classes.
- UI hiding is usability only; every command is authorized again.

## Permission-denied UX

Employee workspaces omit administrative destinations entirely. A blocked operational
action explains the required approval without showing restricted configuration.
Nonexistent and inaccessible resources use disclosure-safe responses. Revocation removes
navigation, active subscriptions, cached content, and pending writes promptly.
