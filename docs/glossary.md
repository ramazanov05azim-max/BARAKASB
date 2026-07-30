# Glossary

- **Actor**: authenticated human or workload identity performing an operation.
- **Project**: tenant and business-data isolation boundary.
- **Membership**: relationship granting an identity roles in one Project.
- **Capability**: stable namespaced permission checked by authorization policy.
- **Core**: platform capabilities independent of any business domain.
- **Solution**: installable business capability for a Project.
- **Plugin**: extension of one Solution through a declared contract.
- **Extension point**: versioned slot a Solution exposes to Plugins.
- **Manifest**: signed declarative metadata for a Solution or Plugin.
- **Project context**: verified immutable scope carried through an operation.
- **Project placement**: authoritative cell, home region, residency, and fencing epoch
  for a Project.
- **Cell**: independently scalable data-plane and failure-containment unit.
- **Placement epoch**: monotonic fencing token that invalidates stale writers.
- **Domain event**: internal fact raised by a domain model.
- **Integration event**: versioned fact published across module boundaries.
- **Outbox**: transactional record of integration events awaiting publication.
- **Composition root**: application boundary that wires implementations.
- **RLS**: PostgreSQL Row-Level Security enforcing Project scope in the database.
