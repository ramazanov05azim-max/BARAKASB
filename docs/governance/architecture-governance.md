# Architecture governance

## Sources of authority

When documents conflict, use this order:

1. Current user-approved platform requirements
2. Accepted ADRs not superseded
3. Current architecture and security documents
4. Operations and development standards
5. Point-in-time reviews and proposals

Raise a corrective change when a lower source contradicts a higher source. Do not choose
the more convenient interpretation.

## Change classes

| Change                                                                                | Required governance                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Local implementation within an accepted boundary                                      | Normal review and quality gates                                    |
| Public contract or compatibility change                                               | Owner review, compatibility evidence, ADR check                    |
| New cross-cutting dependency, store, provider, trust boundary, or deployment topology | New ADR before implementation                                      |
| Exception to isolation/security/dependency rules                                      | Time-bounded risk record and ADR; some invariants are non-waivable |
| Reversal of an accepted decision                                                      | Superseding ADR and migration plan                                 |

## Decision workflow

```text
problem and evidence
-> decision drivers
-> alternatives and trade-offs
-> proposed ADR
-> affected-owner/security/operations review
-> accepted or rejected
-> architecture docs and decision map update
-> implementation and validation evidence
```

The ADR is approved before implementation creates irreversible coupling.

## Accountable capability roles

| Area                                             | Accountable role         |
| ------------------------------------------------ | ------------------------ |
| Core boundaries and context map                  | Platform Architecture    |
| Identity, authorization, threat model            | Security Architecture    |
| PostgreSQL, RLS, placement, migrations, recovery | Data Platform            |
| Web/BFF, browser security, design system         | Frontend Platform        |
| API, WebSocket, events, worker                   | API and Runtime Platform |
| Solution and Plugin lifecycle                    | Extension Platform       |
| Cells, deployment, SLO, observability            | Platform Reliability     |
| Data classification, retention, residency        | Data Governance          |
| Toolchain, CI, dependency matrix                 | Platform Engineering     |

Until these roles are assigned to teams, the repository owner is accountable for
explicitly approving or deferring the decision.

## Exceptions

An exception records rule, scope, reason, risk, compensating controls, owner, expiry,
and removal work. It cannot waive:

- cross-Project isolation;
- deny-by-default authoritative authorization;
- secret non-disclosure;
- artifact integrity;
- auditability of privileged actions.

Expired exceptions fail the production-readiness gate.

## Review cadence

- ADR and architecture review for every cross-cutting change.
- Quarterly threat-model and open-decision review during active development.
- Production-readiness review before a new component or extension launches.
- Annual recovery, residency, and architecture fitness review at minimum.

## Related decision

- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
