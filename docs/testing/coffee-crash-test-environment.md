# Coffee crash-test environment

## Purpose

This development-only environment is the canonical, deterministic Coffee dataset for
manual UI checks, repository contract tests, project isolation checks, and future
operational-module development. It is a local prototype, not a production Stage 7.2
installation.

The environment is installed through Manager Platform ownership boundaries. The
Universal Application accepts only Workspace Codes and opens the bound workspace after
employee authentication. The generated `Бар` workspace owns local operational order data
through replaceable Coffee repository contracts.

## Canonical identity

| Item                       | Stable value                                        |
| -------------------------- | --------------------------------------------------- |
| Project name               | `BARAKASB Coffee Crash Test`                        |
| Establishment display name | `Север Coffee Lab — CRASH TEST`                     |
| Project ID                 | `barakasb-coffee-crash-test-v2`                     |
| Solution Installation ID   | `coffee-installation-barakasb-coffee-crash-test-v2` |
| Business Environment ID    | `business-environment-coffee-crash-test-v2`         |
| Business Environment Code  | `5715 4221 5648 5027`                               |
| Bar Workspace Access Code  | `6728 0175 1693`                                    |
| Seed ID                    | `coffee-crash-test-v5`                              |
| Seed schema version        | `5`                                                 |

The 16-digit code is a deterministic, immutable Manager Platform identifier. It is never
accepted by the Universal Application. Operational device binding uses only the 12-digit
Bar Workspace Access Code.

## Explicit installation

Start the application in development mode:

```bash
pnpm dev:web
```

Then open the canonical bootstrap URL:

`http://localhost:3000/projects/dev/coffee-crash-test`

The route is available only while `NODE_ENV=development`. A production build always
returns `404` for this route and never exposes the destructive reset action.
Installation never runs during application startup and deleted data is never silently
recreated.

Manager Platform also displays the development-only action `Обновить тестовое окружение`
on `/projects`. It performs the same canonical reset and navigates directly to the
installed project.

When stale local test data exists, the page shows `reset-required`. The action requires
this destructive confirmation:

> DEV ONLY: all local Projects, Coffee configuration, Business Environment Codes, and
> stale localhost test data in this browser will be permanently deleted. The single
> Coffee crash-test Project will then be installed. Continue?

The reset affects only browser-local prototype data. It does not call a backend deletion
API or modify the source-controlled seed.

After a successful reset, the invariants are:

- exactly one Manager project;
- exactly one Coffee Solution Installation;
- exactly one Business Environment mapping;
- the selected project is the canonical crash-test project;
- no recognized legacy keys or Coffee project records remain;
- the schema marker is version `2`.
- the Coffee development seed is exactly version `5`;
- `Бар` and `Управляющий` are selected in the Solution Constructor;
- all five canonical employees exist with PBKDF2 password verifiers;
- Иван Беляев and Анна Лукина are assigned to `Бар`;
- the immutable Bar Workspace Access Code is `6728 0175 1693`.

The development fixture password for every canonical employee is `Coffee2026`. Only
PBKDF2-SHA256 verifier records are persisted; the plain password is never written to
localStorage.

## Routes

| Purpose                         | Route                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------- |
| DEV lifecycle and diagnostics   | `/projects/dev/coffee-crash-test`                                            |
| Manager project overview        | `/projects/barakasb-coffee-crash-test-v2`                                    |
| Coffee setup and generated code | `/projects/barakasb-coffee-crash-test-v2/admin/solutions/coffee/setup`       |
| Coffee administration           | `/projects/barakasb-coffee-crash-test-v2/coffee`                             |
| Manager floor-plan editor       | `/projects/barakasb-coffee-crash-test-v2/coffee/floor-plan`                  |
| Solution Constructor            | `/projects/barakasb-coffee-crash-test-v2/admin/solutions/coffee/constructor` |
| Universal Application entry     | `/app`                                                                       |
| Workspace Code entry            | `/app/connect`                                                               |
| Bound operational workspace     | `/app/workspace`                                                             |

## Dataset coverage

The version 5 seed contains:

- one complete business profile, configured Coffee project, and generated Bar workspace;
- two locations, one register, five workstations, and four storage areas;
- two service zones and twelve positioned tables in the main location;
- eight units of measure with supported conversion data;
- five suppliers;
- at least 30 ingredients and opening balances;
- at least 20 available products and eight product-specific modifier groups;
- at least 15 versioned recipes with ingredient rows, cost, sale price, and gross-margin
  data;
- five employees representing owner, manager, barista, cashier, and inventory
  responsibilities;
- normal, low, zero, high-value, and high-quantity stock cases;
- a completed setup checklist and ready project state.

No sales, purchases, receipts, stock movements, production postings, or reports are
fabricated. Those modules remain visibly disabled.

## Storage ownership

Canonical browser-local keys:

- `barakasb.mock.projects.v2`;
- `barakasb.manager.coffee-installations.v2`;
- `barakasb.local.business-environment.directory.v1`;
- `barakasb.manager.selected-project.v1`;
- `barakasb.dev.coffee-crash-test.schema.v2`;
- `barakasb.mock.coffee.project.v1.<projectId>`;
- `barakasb.mock.coffee.bar-orders.v1.<projectId>`.

Before installation, the reset removes every existing localStorage value, including
unknown and stale prototype keys. The only previous value preserved is the UI language
preference (`barakasb.mock.user.preferences.v1`). The installer then writes only the
canonical version 5 project, workspaces, employees, password verifiers, directories, and
selection markers required by the test environment.

## Manual Safari and tablet check

1. Run `pnpm dev:web` and open `http://localhost:3000/projects/dev/coffee-crash-test` in
   Safari. Verify it does not return `404`.
2. Confirm the warning and install the environment.
3. Verify the project overview shows the exact establishment name, `DEV DEMO` marker,
   success message, and formatted code.
4. Open My Projects and both project switchers; each must contain only the canonical
   environment after reset.
5. Open Coffee setup and verify the read-only generated code.
6. Open the Solution Constructor and verify that `Бар` has the immutable code
   `6728 0175 1693` and the assigned employees Иван Беляев and Анна Лукина.
7. Open `/app`, enter `6728 0175 1693`, and continue. Verify the device is bound and the
   code is not requested again.
8. Select Иван Беляев, enter `Coffee2026`, and verify the Bar workspace opens directly.
9. In Coffee Administration open the business profile. Verify Monday–Friday default to
   `08:00–22:00`, Saturday–Sunday default to `09:00–21:00`, and the time zone plus
   operating-day boundaries can be saved.
10. Open the Manager floor-plan editor. Standard zone types must receive their Russian
    name automatically. Only `Другая зона` reveals the required `Название зоны` field.
    Zone dimensions must be displayed in metres and table dimensions in centimetres.
    Drag `Стол 1`, change its dimensions, save, and reload. The position and size must
    persist. Verify that an active-order table cannot be disabled or deleted.
11. Return to `/app`. Verify code entry is skipped, employee selection opens
    immediately, and Иван Беляев can open Bar with the Manager-owned read-only floor
    plan and Russian catalog.
12. Verify the top navigation contains only `Зал`, `Меню`, and `Заказы`. In `Зал`, each
    table must appear exactly once and no order list may be duplicated under the plan.
13. Select free `Стол 1`. A one-guest draft order must open immediately and the
    workspace must switch directly to `Меню`, without a seating dialog.
14. Add `Эспрессо` and verify its configurator contains only `Объём`,
    `Дополнительный шот`, Coffee-specific `Дополнительно`, and the comment field. Verify
    it does not contain milk, syrup, or a free-text variant field.
15. Add `Капучино` and verify its owner-defined configuration contains volume, milk,
    syrup, extra shot, Coffee-specific additions, and comment. Open tea and verify its
    additions contain honey and lemon instead of Coffee additions.
16. Select the simple product `Круассан`. Verify it is added immediately without opening
    the product configurator.
17. From the open order choose `Добавить позиции`. Verify the menu opens without leaving
    or replacing the order, configured products return to the same order, and only newly
    added items form the next unsent batch.
18. Send the first batch. Add `Вода без газа` to the same table and verify it appears
    under `Новые позиции` while the cappuccino remains immutable under `Уже отправлено`.
    Send only the additional batch.
19. Advance the Bar item through `Принят`, `Готовится`, and `Готов`. Verify a
    Kitchen-routed item cannot be completed from Bar.
20. Mark `Карта`. Verify payment does not change preparation state and cannot be
    recorded twice.
21. When all positions are ready and the order is paid, choose
    `Выдать, завершить и освободить стол`. Verify status `Завершён`, immutable history,
    completion metadata, and the table returning to `Свободен`.
22. Choose `Новый заказ`, add `Вода без газа` before assigning a table, then use
    `Прикрепить заказ` to choose a free table or `Оформить навынос`. After assignment
    the action must become `Перенести заказ`.
23. Transfer an active order to another free table. Verify the old table becomes free,
    the new table becomes occupied, and the transfer audit keeps both table identifiers.
24. In `Заказы`, verify `Активные` is selected by default. Verify filters for all,
    takeaway, delivery, ready, completed, and cancelled orders. Each card must show up
    to three position summaries, remaining-item count, total, and a secondary order
    number. Search by order number and reopen an active order in the same order editor
    used by the floor plan; its card must retain a light pastel-blue selection state.
25. Verify the Workspace Access Code is absent from the Bar header, order editor,
    receipts, and all operational status areas after connection.
26. Open another table, send an item, and cancel it. Verify a reason is required and
    retained in history. Verify an empty unsent table can be released.
27. Verify identity, active location, catalog, recipe, stock, supplier, and employee
    summaries appear while unfinished transactional modules stay disabled.
28. Reload the page and verify employee login is required before the bound workspace,
    orders, and completed history become readable.
29. Repeat at 1024 × 768 and 1280 × 800. Each operational screen must use internal
    scrolling where needed and the document must not overflow horizontally.

## Current prototype limitations

- payment statuses are local explicit marks; no payment provider or fiscal device is
  used;
- Kitchen-routed items are visible but cannot be completed because Kitchen UI is not
  part of this stage;
- completing an order does not deduct stock or create warehouse, finance, or reporting
  postings;
- localStorage is the replaceable prototype adapter and is not a security boundary;
- same-origin tabs synchronize order changes, but no realtime backend events exist.

Browser-check evidence captured at a 1280-pixel tablet/landscape viewport:

- [DEV lifecycle and exact counts](coffee-crash-test-dev-lifecycle.jpg);
- [Manager project overview](coffee-crash-test-project.jpg);
- [Manager project switcher](coffee-crash-test-project-switcher.jpg);
- [Coffee setup and generated code](coffee-crash-test-setup-code.jpg);
- [Coffee administration](coffee-crash-test-coffee-admin.jpg);
- [Universal Application workspace](coffee-crash-test-operational-preview.jpg).

## Production boundary

The reset, deterministic generator, local directory, and local code are replaceable
prototype adapters. They do not implement PostgreSQL, NATS, OIDC, the authoritative
Business Environment directory, or Stage 7.2 production generation.
