# Data classification and lifecycle

## Classification

Every field, event attribute, object, log attribute, and export is classified:

| Class        | Examples                                              | Baseline                                                    |
| ------------ | ----------------------------------------------------- | ----------------------------------------------------------- |
| Public       | Published non-sensitive metadata                      | Integrity controls                                          |
| Internal     | Operational configuration, non-sensitive identifiers  | Authenticated access                                        |
| Confidential | Business records, membership data                     | Project authorization, encryption, redaction                |
| Restricted   | Credentials, recovery data, high-impact personal data | Dedicated access path, no ordinary logging, strongest audit |

Solutions and Plugins extend the classification catalog in their manifests. Unknown data
defaults to Confidential.

## Retention ledger

Each owning module declares:

- data classes and purpose;
- authoritative store and derived copies;
- retention and archival period;
- legal-hold behavior;
- export and deletion method;
- backup expiry and deletion evidence;
- encryption-key ownership.

Runtime installation is rejected when required lifecycle metadata is absent.

## Project deletion

Deletion is a durable orchestration, not a synchronous endpoint. It inventories module
data, projections, objects, caches, events, jobs, search indexes, exports, and backups;
records completion evidence for each owner; and retains only the minimum permitted
tombstone/audit data.

Backups expire according to documented retention. Where stricter deletion latency is
required, Project-scoped envelope-encryption keys enable crypto-shredding after
legal-hold checks. Key destruction is irreversible and requires dual control.

## Residency

Project placement records the allowed regions and storage classes. Data, backups,
telemetry containing Confidential/Restricted data, and extension processing remain
inside the permitted residency boundary.

Cross-region support access and disaster recovery are explicit audited purposes, not
implicit administrator privileges.

## Related decision

- [ADR 0018: Data classification and lifecycle](../adr/0018-data-classification-lifecycle.md)
