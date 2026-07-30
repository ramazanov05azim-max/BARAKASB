# ADR 0019: Quarantine uploaded objects before availability

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Security and Storage

## Context

Directly available uploads can expose malware, spoofed content types, oversized objects,
checksum mismatches, path traversal, and cross-Project references.

## Decision drivers

- no unscanned content delivery;
- bounded storage and upload cost;
- Project-safe object identity;
- resumable provider-neutral uploads.

## Decision

An authorized upload session creates a generated Project-scoped quarantine key, size
limit, expected checksum/type, and expiry. Completion verifies metadata and ownership,
then malware scanning runs. Only a clean result atomically promotes the PostgreSQL
object reference to available. Downloads use short-lived signed access after current
authorization and state checks.

## Why this option

Object storage handles bytes efficiently while PostgreSQL controls the authoritative
lifecycle. Quarantine prevents a race between upload completion and security validation.

## Alternatives considered

- Proxy all bytes through the API: rejected as the default because it consumes API
  bandwidth and memory without improving lifecycle guarantees.
- Trust client MIME type and filename: rejected because both are untrusted metadata.
- Serve first and scan asynchronously: rejected because unsafe content would have an
  exposure window.

## Consequences

Clients handle pending and rejected states. Abandoned multipart sessions and quarantine
objects require expiry cleanup, quotas, and observability.

## Validation

Tests cover checksum/type mismatch, malware result, expiry, duplicate completion,
cross-Project IDs, authorization revocation, and cleanup.
