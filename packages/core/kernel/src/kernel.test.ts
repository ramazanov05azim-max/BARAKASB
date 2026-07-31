import { describe, expect, it } from 'vitest';
import {
  InvalidAggregateVersionError,
  InvalidDomainEventVersionError,
  InvalidIdentifierError,
  InvalidTimestampError,
  aggregateId,
  aggregateVersion,
  correlationId,
  domainEvent,
  eventId,
  initialAggregateVersion,
  nextAggregateVersion,
  ok,
  projectId,
  timestamp,
  unwrap,
} from './public';

describe('identifiers', () => {
  it('creates an opaque identifier without changing its canonical value', () => {
    expect(projectId('project-01')).toBe('project-01');
  });

  it.each(['', ' project-01', 'project-01 ', 'project\u0000'])(
    'rejects invalid identifier %j',
    (value) => {
      expect(() => projectId(value)).toThrow(InvalidIdentifierError);
    },
  );
});

describe('timestamps', () => {
  it('accepts canonical UTC timestamps', () => {
    expect(timestamp('2026-07-31T12:00:00.000Z')).toBe('2026-07-31T12:00:00.000Z');
  });

  it.each(['not-a-date', '2026-07-31T12:00:00Z', '2026-07-31T15:00:00.000+03:00'])(
    'rejects non-canonical timestamp %j',
    (value) => {
      expect(() => timestamp(value)).toThrow(InvalidTimestampError);
    },
  );
});

describe('aggregate versions', () => {
  it('starts at zero and advances monotonically', () => {
    expect(initialAggregateVersion()).toBe(0);
    expect(nextAggregateVersion(aggregateVersion(4))).toBe(5);
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid version %s',
    (value) => {
      expect(() => aggregateVersion(value)).toThrow(InvalidAggregateVersionError);
    },
  );
});

describe('results', () => {
  it('unwraps a successful result', () => {
    expect(unwrap(ok('value'))).toBe('value');
  });

  it('throws the typed failure from a failed result', async () => {
    const { err } = await import('./public');
    const failure = new Error('failure');

    expect(() => unwrap(err(failure))).toThrow(failure);
  });
});

describe('domain events', () => {
  const metadata = {
    eventId: eventId('event-01'),
    occurredAt: timestamp('2026-07-31T12:00:00.000Z'),
    aggregateId: aggregateId('aggregate-01'),
    aggregateVersion: aggregateVersion(1),
    correlationId: correlationId('correlation-01'),
    scope: {
      kind: 'project' as const,
      projectId: projectId('project-01'),
    },
  };

  it('creates an immutable versioned event envelope', () => {
    const event = domainEvent('ProjectCreated', 1, metadata, {
      projectId: 'project-01',
    });

    expect(event.type).toBe('ProjectCreated');
    expect(event.version).toBe(1);
    expect(event.metadata.scope).toEqual({
      kind: 'project',
      projectId: 'project-01',
    });
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
  });

  it.each([0, -1, 1.5])('rejects invalid event version %s', (version) => {
    expect(() => domainEvent('ProjectCreated', version, metadata, {})).toThrow(
      InvalidDomainEventVersionError,
    );
  });
});
