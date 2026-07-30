# ADR 0030: Use PITR and isolated selective Project recovery

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Data Platform and Reliability

## Context

A shared shard backup contains many Projects. Restoring it directly over production to
recover one Project would overwrite unrelated state and risk cross-Project exposure.

## Decision drivers

- recover a full cell/shard to a point in time;
- selectively recover one Project safely;
- prove RPO/RTO and isolation;
- reconcile PostgreSQL and object storage.

## Decision

PostgreSQL uses encrypted automated backups with point-in-time recovery. Object storage
uses versioning and lifecycle protection. Backup catalogs record shard/cell, region,
schema, key version, time range, retention, and expiry.

Selective Project recovery restores a shared backup into an isolated environment,
extracts only validated project-scoped records and objects through an audited recovery
tool, and imports them through a placement-fenced workflow. A shared backup is never
restored in place for one Project.

## Why this option

PITR provides broad disaster recovery; isolated extraction prevents one tenant's
recovery from altering or exposing another tenant.

## Alternatives considered

- In-place partial restore to production: rejected due to overwrite and isolation risk.
- Backup per Project from the start: rejected because backup count and consistency
  overhead scale poorly on shared shards.
- Treat replication as backup: rejected because corruption and deletion replicate too.

## Consequences

Selective recovery tooling is security-sensitive and must understand all owning modules,
RLS, objects, schema versions, and outbox boundaries. Restore drills are mandatory.

## Validation

Drills recover a cell and a single Project, verify checksums and isolation with the
restricted role, and record achieved RPO/RTO.
