import type { Brand } from './identifiers';

export type Timestamp = Brand<string, 'Timestamp'>;

export class InvalidTimestampError extends Error {
  readonly code = 'kernel.invalid_timestamp';

  constructor(readonly value: string) {
    super('Timestamp must be a canonical UTC ISO-8601 value.');
    this.name = 'InvalidTimestampError';
  }
}

export function timestamp(value: string): Timestamp {
  const parsed = new Date(value);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== value ||
    !value.endsWith('Z')
  ) {
    throw new InvalidTimestampError(value);
  }

  return value as Timestamp;
}

export interface Clock {
  now(): Timestamp;
}

export class SystemClock implements Clock {
  now(): Timestamp {
    return timestamp(new Date().toISOString());
  }
}
