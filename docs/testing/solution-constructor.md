# Solution Constructor local prototype

## Scope

The Solution Constructor is a Manager Platform feature inside the existing `apps/web`
composition root. It creates no application, deployable, backend, or parallel runtime.

The prototype supports:

1. opening a configured Coffee Project;
2. selecting one or more Russian-labelled modules;
3. generating only the selected Operational Workspaces;
4. creating local employees;
5. assigning an employee to one or more workspaces;
6. manually issuing one immutable twelve-digit Workspace Access Code per workspace;
7. resolving that code in the Universal Application;
8. opening the real Russian-language Bar workspace when `Бар` is resolved;
9. opening a generic Russian-language placeholder for modules not implemented yet.

## Routes

```text
/projects/{projectId}/admin/solutions/coffee/constructor
/app/connect
/app/runtime/{projectId}/workspaces/{workspaceId}
```

## Ownership

- Coffee Solution owns the module identifiers, generated structure, and assignments.
- Manager Platform composes the owner workflow and local prototype adapters.
- Universal Application owns generic code resolution and its runtime session.
- Coffee Solution owns Bar orders, order rules, preparation routing, tables, and the Bar
  screen exposed through its existing public solution boundary.
- A Workspace Access Code identifies the Installed Solution, Business Environment, and
  Operational Workspace. It never identifies an employee.

## Explicit exclusions

Only `Бар` implements local order capture, Bar preparation states, local payment marks,
and issue history. Other workspaces remain placeholders. Kitchen execution, warehouse
operations, inventory deduction, real payments, reporting, production, and delivery are
not implemented. The local directory is not an authentication or security boundary.

## Replacement seam

`OperationalWorkspaceAccessResolver`, `OperationalWorkspaceAccessIssuer`, and
`OperationalWorkspaceSessionStore` are the replaceable boundaries. A future
authoritative adapter can implement them without adding another browser application or
changing the route composition root.
