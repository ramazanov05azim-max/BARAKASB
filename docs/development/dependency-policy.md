# Dependency and runtime policy

## Version baseline

Node.js uses an active LTS line. pnpm, Nx, TypeScript, Next.js, React, NestJS, database
drivers, and validation/OpenAPI tooling have one repository compatibility matrix owned
by the Platform team.

The root `packageManager`, engine range, and lockfile are authoritative. Application
packages cannot independently select another major runtime or duplicate a framework
version.

## Update classes

- **Emergency security**: expedited update with targeted compatibility and rollback
  evidence.
- **Routine patch/minor**: automated proposal, full affected checks, scheduled merge.
- **Major/framework**: compatibility branch, migration guide, architecture/security
  review, load/cache/isolation regression suite, and explicit rollout.

No dependency is upgraded solely because a newer version exists. No vulnerable
dependency remains solely because an upgrade is inconvenient; risk acceptance is
time-bound and owned.

## Evidence

Updates verify:

- lockfile integrity and reproducible clean install;
- licenses and dependency provenance;
- typecheck, build, unit/integration/contract/isolation tests;
- Next.js cache behavior and NestJS request/context behavior;
- database driver transaction and RLS scope behavior;
- generated API/event compatibility;
- bundle/image size and startup/runtime performance;
- canary and rollback compatibility for runtime changes.

## Supply chain

CI uses immutable, reviewed build actions and produces signed provenance and an SBOM.
Install scripts are disabled unless explicitly reviewed. Package publication uses
trusted publishing/workload identity rather than long-lived tokens.

## Related decision

- [ADR 0027: Central runtime version policy](../adr/0027-central-runtime-version-policy.md)
