# Privileged production access

## Access classes

| Class       | Identity                   | Grant                      | Normal use                    |
| ----------- | -------------------------- | -------------------------- | ----------------------------- |
| Runtime     | workload identity          | fixed least privilege      | application operation         |
| Migration   | deployment identity        | release-scoped, time-bound | expand/contract schema change |
| Operator    | named human identity       | just in time               | diagnosed operational action  |
| Break glass | named emergency identity   | dual-approved, short-lived | service restoration           |
| Recovery    | isolated recovery workflow | incident-scoped            | PITR/selective restore        |

No class shares credentials with another. Runtime roles cannot bypass RLS or own
schemas. Human operators do not become Project members merely to access infrastructure.

## Control requirements

Privileged access requires phishing-resistant authentication, managed device posture,
reason and ticket, explicit target, short expiry, approval proportional to risk, session
recording, immutable audit, and immediate revocation. Restricted-data reads and
destructive recovery require dual approval.

Direct production database access from a developer laptop is forbidden. Controlled tools
apply Project scope, query limits, redaction, and safe defaults. Export requires a
separate approved workflow.

## Assurance

Access grants, denied requests, commands, query fingerprints, exports, and termination
are audited outside ordinary application logs. Quarterly reviews remove unused grants.
Break-glass and recovery paths are exercised without exposing production data.

## Related decisions

- [ADR 0003: Project isolation](../adr/0003-project-isolation.md)
- [ADR 0020: Separate immutable audit](../adr/0020-opentelemetry-and-separate-audit.md)
- [ADR 0035: Privileged production access](../adr/0035-privileged-production-access.md)
