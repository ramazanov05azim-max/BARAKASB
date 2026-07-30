# ADR 0018: Require classified data lifecycle and residency

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Security and Data Governance

## Context

Encryption, logging, retention, deletion, support access, backup, and regional placement
cannot be applied consistently when data has no declared class or owner.

## Decision drivers

- provable Project deletion;
- least-privilege access and redaction;
- regional residency;
- consistent extension governance.

## Decision

Every persisted field, object, event attribute, log attribute, and export is classified
as Public, Internal, Confidential, or Restricted. Unknown data defaults to Confidential.

Each owning module declares purpose, authoritative store, derived copies, retention,
legal hold, export, deletion, backup expiry, residency, and encryption-key ownership in
a lifecycle ledger. Solution and Plugin admission requires this metadata.

## Why this option

A small common classification model creates enforceable defaults without embedding
country- or industry-specific policy in Core. Ownership stays with the module that
understands the data.

## Alternatives considered

- Classify only personal data: rejected because sensitive business, credential, and
  operational data also require controls.
- One retention policy for the platform: rejected because purpose and legal obligations
  differ by data class and module.
- Best-effort deletion from live stores only: rejected because backups, events, and
  projections would remain unaccounted for.

## Consequences

Schema and manifest review includes lifecycle metadata. Backups need expiry evidence.
Stricter deletion tiers may use Project-scoped envelope keys and dual-controlled
crypto-shredding.

## Validation

Production readiness rejects unclassified stores. Deletion drills reconcile all owners
and backup catalog entries.
