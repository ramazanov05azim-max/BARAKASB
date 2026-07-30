# Configuration and secrets

## Configuration

Configuration is validated once at process startup against a typed schema. Missing,
malformed, conflicting, or insecure production values fail startup.

Names use:

```text
BARAKASB_<AREA>_<SETTING>
```

Environment variables contain non-secret deployment configuration or secret references.
Large structured policy belongs in versioned configuration artifacts with integrity
verification.

## Secrets

Production secrets live in a managed secret store and are accessed through workload
identity. Secret values are never:

- committed or placed in example files;
- printed by validation errors;
- passed in command-line arguments or URLs;
- included in images or frontend bundles;
- copied into Solution or Plugin manifests.

Every secret has an owner, purpose, consumer list, rotation method, and revocation
procedure. Rotation is tested.

## Feature flags

Flags are typed, owned, observable, and have an expiry/removal issue. Security controls
and database invariants cannot be disabled through ordinary feature flags.

## Related decision

- [ADR 0028: Validated configuration and external secrets](../adr/0028-validated-config-external-secrets.md)
