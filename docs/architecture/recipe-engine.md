# Recipe Engine architecture

## Purpose and ownership

Coffee owns one reusable Recipe Engine domain boundary. Bar, Kitchen, Warehouse,
Purchasing, Production and Finance consume this boundary instead of creating
module-local recipe models.

Recipe semantics are business semantics, so the engine remains inside Coffee Solution.
It is not moved to Platform Core and it does not make Core aware of Coffee. Another
Solution may adopt the contract deliberately, but cannot query Coffee repositories or
share Coffee business data.

The canonical contracts remain side-effect free. Coffee Warehouse v1 now provides the
first expansion consumer: it converts a resolved recipe into aggregated base-unit
requirements and then owns the resulting stock movements. The engine itself still does
not persist stock, calculate purchasing, post finance entries or execute production.

## Unified model

Every recipe has the same structure. Its target type is one of:

- Product;
- Preparation;
- Semi-finished product;
- Package.

Every component type is one of:

- Ingredient;
- Preparation;
- Semi-finished product;
- Package.

```text
Recipe Definition
├── Project and Solution Installation scope
├── Target reference and target type
├── Output quantity and unit
├── Ordered components
│   ├── component type and reference
│   ├── gross quantity and unit
│   └── loss percentage
├── instructions
├── version and status
└── effective date
```

Only the target reference changes across the four target types. Separate Product,
Preparation, Semi-finished or Package recipe tables/models are forbidden.

## Public Solution contracts

`solutions/coffee/src/recipe-engine/contracts.ts` defines:

- canonical target and component type sets;
- `RecipeEngineDefinition` as the versioned project-scoped model;
- `RecipeEngineRepository` as the persistence port;
- `RecipeEngine` as validation and effective-version resolution;
- validation results that contain stable codes rather than presentation strings.

The contract is framework-, transport- and provider-neutral. UI components, PostgreSQL
types, localStorage types, inventory commands and financial entries are excluded.

## Dependency rules

```text
Operational Module application service
  -> Recipe Engine public interface
    -> Recipe Engine domain
      <- Recipe Engine repository adapter
```

Operational modules never import the Recipe Engine repository adapter. They request a
validated/effective recipe through the public application interface. They do not inspect
another module's recipe cache or persistence.

The Recipe Engine may publish versioned events after a future implementation is
approved. Consumers build their own projections. A consumer cannot add a cross-owner
write to the Recipe Engine transaction.

## Versioning and identity

A recipe ID is stable. Editing an active recipe creates a new monotonic version rather
than changing historical meaning. Effective resolution uses Project, target and time.
References use stable IDs; display names are resolved for presentation and are not
authoritative identity.

Recipes are scoped by non-null Project and Solution Installation identity. A repository
must never resolve by target ID without Project scope. References cannot cross Projects.

## Consumers

Future module responsibilities remain separate:

| Consumer      | Allowed use                                       | Not owned by Recipe Engine         |
| ------------- | ------------------------------------------------- | ---------------------------------- |
| Bar / Kitchen | Read effective product preparation                | Order or kitchen execution         |
| Warehouse     | Expand components into material requirements      | Stock balance and movement ledger  |
| Purchasing    | Build a consumer-owned demand projection          | Purchase orders and supplier terms |
| Production    | Resolve preparation and semi-finished definitions | Production runs and yield posting  |
| Finance       | Consume cost/projection outputs when defined      | Ledger, COGS and financial posting |

No consumer may fork the recipe schema or create a second recipe source of truth.

## Existing prototype compatibility

The existing Coffee configuration prototype persists a legacy `menu-item` recipe target.
The Warehouse expansion adapter maps this read model to Product at the application
boundary without rewriting stored recipes. Package, Preparation and Semi-finished
references are expanded recursively when configured. A future canonical write-path
migration must still preserve IDs and versions and remain reversible according to the
repository migration policy.

Until that migration is implemented, the new engine contracts remain the target
boundary; the legacy form is a compatibility input and must not be copied by future
modules. Modifier effects are typed manager-owned recipe inputs; operational services
never infer consumption from Russian option labels.

## Validation requirements

Implementation must add tests for:

- all four target and component types;
- positive and invalid quantity/loss rules;
- reference cycles across Preparation and Semi-finished components;
- immutable active versions and effective-date resolution;
- two-Project negative isolation;
- repository adapter conformance;
- deterministic migration from the legacy target;
- absence of stock, purchasing and finance side effects.

## Related decisions

- [ADR 0003: Project isolation](../adr/0003-project-isolation.md)
- [ADR 0009: Module data ownership](../adr/0009-shared-database-module-ownership.md)
- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
- [ADR 0034: Contract compatibility and versioning](../adr/0034-contract-compatibility-versioning.md)
