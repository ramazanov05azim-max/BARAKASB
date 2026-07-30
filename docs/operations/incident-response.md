# Incident response

## Lifecycle

1. Detect and classify severity.
2. Assign incident commander, communications, and technical owners.
3. Contain impact without destroying evidence.
4. Mitigate and verify user-visible recovery.
5. Recover normal operation and reconcile delayed work.
6. Publish a blameless review with tracked corrective actions.

## Project-isolation incidents

Suspected cross-project exposure is critical. Immediately preserve audit and trace
evidence, disable the affected path or extension, revoke relevant credentials, identify
Projects and data classes involved, and engage security and legal response owners.

Do not run broad corrective queries without a reviewed scope and backup.

## Operational requirements

Runbooks identify safe commands, permissions, expected signals, rollback, and
escalation. Production actions use named identities and are audited. Temporary access
expires automatically.
