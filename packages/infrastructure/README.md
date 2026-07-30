# Infrastructure packages

Infrastructure packages implement technical adapters for configuration, PostgreSQL,
messaging, object storage, and observability.

They contain no business rules. Domain/application code declares ports; infrastructure
implements them; deployable application composition selects implementations. Provider
SDK types do not cross public adapter boundaries.
