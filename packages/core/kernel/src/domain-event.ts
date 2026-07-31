import type { Timestamp } from './clock';
import type {
  ActorId,
  AggregateId,
  CausationId,
  CorrelationId,
  EventId,
  ProjectId,
} from './identifiers';
import type { AggregateVersion } from './aggregate-version';

export type EventScope =
  Readonly<{ kind: 'global' }> | Readonly<{ kind: 'project'; projectId: ProjectId }>;

export interface DomainEventMetadata {
  readonly eventId: EventId;
  readonly occurredAt: Timestamp;
  readonly aggregateId: AggregateId;
  readonly aggregateVersion: AggregateVersion;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly actorId?: ActorId;
  readonly scope: EventScope;
}

export interface DomainEvent<
  Type extends string = string,
  Payload extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  readonly type: Type;
  readonly version: number;
  readonly metadata: DomainEventMetadata;
  readonly payload: Payload;
}

export class InvalidDomainEventVersionError extends Error {
  readonly code = 'kernel.invalid_domain_event_version';

  constructor(readonly value: number) {
    super('Domain event version must be a positive safe integer.');
    this.name = 'InvalidDomainEventVersionError';
  }
}

export function domainEvent<
  Type extends string,
  Payload extends Readonly<Record<string, unknown>>,
>(
  type: Type,
  version: number,
  metadata: DomainEventMetadata,
  payload: Payload,
): Readonly<DomainEvent<Type, Payload>> {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new InvalidDomainEventVersionError(version);
  }

  return Object.freeze({
    type,
    version,
    metadata: Object.freeze(metadata),
    payload: Object.freeze(payload),
  });
}
