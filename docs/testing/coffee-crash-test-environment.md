# Coffee crash-test environment

## Purpose

This development-only environment is the canonical, deterministic Coffee dataset for
manual UI checks, repository contract tests, project isolation checks, and future
operational-module development. It is a local prototype, not a production Stage 7.2
installation.

The environment is installed through Manager Platform ownership boundaries. The
Universal Application resolves generated codes. The Business Environment preview remains
read-only, while the generated `Бар` workspace owns local operational order data through
replaceable Coffee repository contracts. It cannot create, edit, or regenerate a Coffee
environment.

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
| Seed ID                    | `coffee-crash-test-v3`                              |
| Seed schema version        | `3`                                                 |

The 16-digit code is deterministic, immutable after creation, and resolves only the
canonical project in the current browser.

## Explicit installation

Open:

`/projects/dev/coffee-crash-test`

The route is available only in development, unless the explicit
`NEXT_PUBLIC_ENABLE_COFFEE_CRASH_TEST=true` build flag is present. Installation never
runs during application startup and deleted data is never silently recreated.

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
- `Бар` and `Руководитель` are selected in the Solution Constructor;
- Иван Беляев and Анна Лукина are assigned to `Бар`;
- the immutable Bar Workspace Access Code is `6728 0175 1693`.

## Routes

| Purpose                         | Route                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------- |
| DEV lifecycle and diagnostics   | `/projects/dev/coffee-crash-test`                                            |
| Manager project overview        | `/projects/barakasb-coffee-crash-test-v2`                                    |
| Coffee setup and generated code | `/projects/barakasb-coffee-crash-test-v2/admin/solutions/coffee/setup`       |
| Coffee administration           | `/projects/barakasb-coffee-crash-test-v2/coffee`                             |
| Solution Constructor            | `/projects/barakasb-coffee-crash-test-v2/admin/solutions/coffee/constructor` |
| Universal code entry            | `/app/connect`                                                               |
| Resolved operational preview    | `/app/runtime/barakasb-coffee-crash-test-v2`                                 |
| Bar operational workspace       | `/app/runtime/barakasb-coffee-crash-test-v2/workspaces/workspace-bar`        |

## Dataset coverage

The version 3 seed contains:

- one complete business profile, configured Coffee project, and generated Bar workspace;
- two locations, one register, five workstations, and four storage areas;
- twelve configured tables in the main location;
- eight units of measure with supported conversion data;
- five suppliers;
- at least 30 ingredients and opening balances;
- at least 20 available products and four modifier groups;
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

The typed cleanup service also removes recognized legacy Manager, onboarding, directory,
selected-project, and Coffee namespaces before installation. Locale preference is not
business test data and is intentionally preserved.

## Manual Safari and tablet check

1. Start the web application and open the DEV lifecycle route in Safari.
2. Confirm the warning and install the environment.
3. Verify the project overview shows the exact establishment name, `DEV DEMO` marker,
   success message, and formatted code.
4. Open My Projects and both project switchers; each must contain only the canonical
   environment after reset.
5. Open Coffee setup and verify the read-only generated code.
6. Open the Solution Constructor and verify that `Бар` has the immutable code
   `6728 0175 1693` and the assigned employees Иван Беляев and Анна Лукина.
7. Open `/app/connect`, enter `6728 0175 1693`, and continue.
8. Select Иван Беляев as the current employee. The access code identifies the workspace,
   while the explicit selection establishes the current local employee context.
9. Verify `Север Coffee Lab`, the main location, table plan, Russian catalog, open-order
   counters, and empty recent-issued history.
10. Select `Стол 1`, add `Капучино`, choose `Овсяное +70 ₽`, add a comment, and change
    quantity. Verify the total is recalculated.
11. Send the order, advance the Bar item through `Принят`, `Готовится`, and `Готов`,
    mark `Карта`, then issue the order. Verify the table returns to `Свободен` and the
    order appears in recent history.
12. Create a takeaway order with `Вода без газа`; verify it becomes ready immediately,
    but cannot be issued until a local payment method is selected.
13. Verify identity, active location, catalog, recipe, stock, supplier, and employee
    summaries appear while unfinished transactional modules stay disabled.
14. Reload the page and verify the selected workspace, orders, and issued history remain
    readable.
15. Repeat at tablet widths. No horizontal page overflow is permitted.

## Current prototype limitations

- payment statuses are local explicit marks; no payment provider or fiscal device is
  used;
- Kitchen-routed items are visible but cannot be completed because Kitchen UI is not
  part of this stage;
- issuing an order does not deduct stock or create warehouse, finance, or reporting
  postings;
- localStorage is the replaceable prototype adapter and is not a security boundary;
- same-origin tabs synchronize order changes, but no realtime backend events exist.

Browser-check evidence captured at a 1280-pixel tablet/landscape viewport:

- [DEV lifecycle and exact counts](coffee-crash-test-dev-lifecycle.jpg);
- [Manager project overview](coffee-crash-test-project.jpg);
- [Manager project switcher](coffee-crash-test-project-switcher.jpg);
- [Coffee setup and generated code](coffee-crash-test-setup-code.jpg);
- [Coffee administration](coffee-crash-test-coffee-admin.jpg);
- [Universal Application read-only preview](coffee-crash-test-operational-preview.jpg).

## Production boundary

The reset, deterministic generator, local directory, and local code are replaceable
prototype adapters. They do not implement PostgreSQL, NATS, OIDC, the authoritative
Business Environment directory, or Stage 7.2 production generation.
