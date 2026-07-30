# Events and jobs

## Event types

- **Domain events** are internal facts raised by a domain model.
- **Integration events** are stable, versioned facts published outside the owning
  module.
- **Commands/jobs** request work and may be rejected; they are not facts.

Domain events are translated to integration events at the module boundary.

## Envelope

Every integration event contains:

```text
event_id
event_type
event_version
occurred_at
producer
correlation_id
causation_id
project_id | global_scope
actor_id | system_actor
payload
```

Sensitive data is minimized. Event schemas are compatibility-tested and stored with
ownership metadata.

The producing module owns the schema and compatibility mode. Consumers do not require a
producer to rewrite history; they upcast supported historical versions at their
boundary. Replays run in an isolated consumer namespace with an explicit range,
rate/concurrency budget, dry-run where possible, and completion evidence.

## Transactional outbox

State changes and outbox rows commit atomically in PostgreSQL. The worker claims rows
with safe concurrent locking, publishes them, and records delivery progress. Publication
is at least once; consumers must be idempotent.

The inbox pattern records message IDs at consumers whose side effects cannot be safely
repeated.

Outbox tables are shard-local and partitioned by time with bounded retention after
confirmed publication. Claiming uses bounded batches, safe concurrent locking, and
fairness across Projects so a noisy Project cannot starve the shard. Publishers expose
oldest-unpublished age and per-Project backlog.

Polling remains the baseline. Change-data-capture is introduced behind the same
publisher port when measured polling cost, write amplification, or latency violates the
SLO; it does not change delivery semantics.

## Jobs

Jobs include Project context, requested capability or system authority, idempotency key,
placement epoch, attempt count, schedule metadata, and trace context. Workers resolve
current placement and revalidate Project lifecycle and required authorization
assumptions before performing side effects. A stale epoch cannot write.

Retries use bounded exponential backoff with jitter. Permanent failures enter a
dead-letter state with operator visibility and a safe replay procedure.

## Ordering

Global ordering is not promised. When ordering matters, producers include an aggregate
ID and monotonic aggregate version. Consumers reject stale versions or rebuild their
projection from authoritative state.

## Related decisions

- [ADR 0008: Transactional outbox](../adr/0008-transactional-outbox.md)
- [ADR 0023: Event evolution and replay](../adr/0023-event-evolution-and-replay.md)
