# Open decision register

An open item is not permission for each team to choose independently. The named scope
remains blocked until an ADR accepts a decision.

| Decision                                                  | Needed before                             | Evaluation criteria                                                                    | Owner                        |
| --------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------- |
| OIDC provider and enterprise federation/SCIM roadmap      | Identity implementation                   | Standards, MFA/passkeys, federation, audit, regional availability, exportability, cost | Security Architecture        |
| PostgreSQL access library and migration tool              | Persistence implementation                | RLS/session control, transactions, SQL visibility, migration safety, Nest integration  | Data Platform                |
| Queue/event broker                                        | First asynchronous integration            | Ordering, retries, DLQ, regional topology, observability, operating cost               | Platform Reliability         |
| Object-storage provider and malware-scan pipeline         | Upload implementation                     | S3 contract, residency, lifecycle, signed access, event integrity, scan isolation      | Platform Reliability         |
| API gateway/edge and WebSocket ingress                    | Public deployment                         | Auth propagation, project routing, rate limits, connection scale, DDoS controls        | Platform Reliability         |
| Production orchestrator and IaC stack                     | Staging environment                       | Cell model, progressive delivery, workload identity, policy, portability               | Infrastructure               |
| Observability and audit backends                          | Staging environment                       | OpenTelemetry support, access isolation, retention, residency, tamper evidence, cost   | Reliability and Security     |
| Initial SLO, RPO, RTO, and security invalidation deadline | Production readiness                      | User impact, recovery capability, cost, contractual commitments                        | Product and Reliability      |
| Cell/shard placement thresholds                           | First scale test                          | Connection budget, data size/skew, workload profile, blast radius, move time           | Data Platform                |
| Project-level encryption/crypto-shredding tier            | Retention/deletion implementation         | Legal requirements, key scale, query impact, recovery, irreversible controls           | Security and Data Governance |
| Extension-runner isolation technology                     | Before third-party code                   | Conformance to ADR 0033, escape resistance, identity, egress, quotas, portability      | Security Architecture        |
| Repository license and contribution policy                | Before external contribution/distribution | Ownership, distribution intent, dependency compatibility, legal review                 | Repository Owner             |

Every item receives an issue or ADR owner before implementation starts. A deadline is
set by the “needed before” gate, not an arbitrary date.
