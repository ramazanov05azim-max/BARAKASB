# Universal Application

## Purpose

The Universal Application is the single operational application inside `apps/web`. It
connects one device to one Operational Workspace and authenticates an employee assigned
to that workspace.

It never creates Projects, installs Solutions, configures workspaces, manages employees,
or exposes Manager Platform identity data.

## Canonical flow

```text
Manager Platform
  → generate Workspace Code
  → connect device once
  → select employee
  → enter employee password
  → open assigned Workspace
```

When a valid device binding already exists, `/app` skips code entry and opens employee
selection. `Сменить сотрудника` clears only the employee session; the device remains
bound to the same workspace.

## Routes

| Route            | Responsibility                                      |
| ---------------- | --------------------------------------------------- |
| `/app`           | Validate the saved device binding and choose a flow |
| `/app/connect`   | Accept one 12-digit Workspace Code on first launch  |
| `/app/workspace` | Employee login and the bound Workspace screen       |

No Project, Solution Installation, Business Environment, or Workspace identifier is
present in an operational URL.

## Device binding

A Workspace Code resolves to exactly one workspace. A successful resolution stores the
current device binding in `barakasb.operational-workspace.device.v2`.

On every application bootstrap:

1. retired operational storage records are removed;
2. the current binding is loaded;
3. its Workspace Code is revalidated against the Workspace directory;
4. an absent or invalidated binding returns to `/app/connect`;
5. a valid binding opens `/app/workspace` at employee selection.

Rotating a Workspace Code invalidates the previous code and disconnects a matching local
device. Manager Platform can also explicitly disconnect the bound device.

Operational employees cannot disconnect devices, rotate codes, or bind another
workspace.

## Employee authentication

Workspace Codes identify devices and workspaces, never employees.

Employee authentication always uses:

```text
Assigned employee
  → password
  → Workspace
```

Only active employees assigned to the bound workspace are selectable. Passwords are
verified through `OperationalEmployeeAuthenticator`; UI visibility is not treated as a
security boundary.

## Information boundary

Operational UI may display:

- workspace name;
- assigned employee names;
- current employee;
- workspace-specific operational functionality.

Operational UI must not display:

- Business Environment or its code;
- Project identity;
- Solution Installation identity;
- environment mappings;
- Workspace Code after device connection.

Business Environment remains a Manager Platform entity.

## Storage migration

The startup migration removes these retired operational records from both local and
session storage when present:

- `barakasb.local.operational-runtime-session.v1`;
- `barakasb.operational-workspace.session.v1`.

The migration preserves:

- `barakasb.operational-workspace.device.v2`;
- Coffee Solution project data;
- employee credential verifiers;
- Manager-owned configuration and workspace directories.

Existing Workspace directory records and the saved device binding are upgraded in place
to the canonical isolation-scope schema. The migration is automatic and idempotent.

## Composition and deployment

Universal Application remains a runtime mode of the existing Next.js application in
`apps/web`. It introduces no browser application, deployable, or composition root.

Solution-specific operational UI remains owned by its Solution package. Platform code
owns only device binding, employee authentication orchestration, routing, and the
workspace host boundary.

## Related decisions

- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
- [ADR 0027: Central runtime version policy](../adr/0027-central-runtime-version-policy.md)
- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
