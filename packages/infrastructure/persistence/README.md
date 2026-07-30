# Persistence

Owns technical PostgreSQL adapters: connection management, unit-of-work contracts,
project-scope application, migration plumbing, and outbox/inbox infrastructure. Module
repositories remain with their owning module. Domain and application layers depend on
ports, not this package.
