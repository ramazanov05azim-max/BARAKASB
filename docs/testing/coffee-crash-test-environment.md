# Coffee crash-test environment

## Purpose

This development-only environment is the canonical, deterministic Coffee dataset for
manual UI checks, repository contract tests, project isolation checks, and future
operational-module development. It is a local prototype, not a production Stage 7.2
installation.

The environment is installed through Manager Platform ownership boundaries. The
Universal Application only resolves the generated code and exposes read-only configured
data. It cannot create, edit, or regenerate a Coffee environment.

## Canonical identity

| Item                       | Stable value                                        |
| -------------------------- | --------------------------------------------------- |
| Project name               | `BARAKASB Coffee Crash Test`                        |
| Establishment display name | `Север Coffee Lab — CRASH TEST`                     |
| Project ID                 | `barakasb-coffee-crash-test-v2`                     |
| Solution Installation ID   | `coffee-installation-barakasb-coffee-crash-test-v2` |
| Business Environment ID    | `business-environment-coffee-crash-test-v2`         |
| Business Environment Code  | `5715 4221 5648 5027`                               |
| Seed ID                    | `coffee-crash-test-v2`                              |
| Seed schema version        | `2`                                                 |

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

## Routes

| Purpose                         | Route                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- |
| DEV lifecycle and diagnostics   | `/projects/dev/coffee-crash-test`                                      |
| Manager project overview        | `/projects/barakasb-coffee-crash-test-v2`                              |
| Coffee setup and generated code | `/projects/barakasb-coffee-crash-test-v2/admin/solutions/coffee/setup` |
| Coffee administration           | `/projects/barakasb-coffee-crash-test-v2/coffee`                       |
| Universal code entry            | `/app/connect`                                                         |
| Resolved operational preview    | `/app/runtime/barakasb-coffee-crash-test-v2`                           |

## Dataset coverage

The version 2 seed contains:

- one complete business profile and configured Coffee project;
- two locations, one register, five workstations, and four storage areas;
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
- `barakasb.mock.coffee.project.v1.<projectId>`.

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
6. Open `/app/connect`, enter `5715 4221 5648 5027`, and continue.
7. Verify identity, active location, catalog, recipe, stock, supplier, and employee
   summaries appear while transactional modules stay disabled.
8. Reload the page and verify the session and configured data remain readable.
9. Repeat at tablet widths. No horizontal page overflow is permitted.

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
