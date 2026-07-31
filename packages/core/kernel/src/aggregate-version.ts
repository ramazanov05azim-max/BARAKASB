import type { Brand } from './identifiers';

export type AggregateVersion = Brand<number, 'AggregateVersion'>;

export class InvalidAggregateVersionError extends Error {
  readonly code = 'kernel.invalid_aggregate_version';

  constructor(readonly value: number) {
    super('Aggregate version must be a non-negative safe integer.');
    this.name = 'InvalidAggregateVersionError';
  }
}

export function aggregateVersion(value: number): AggregateVersion {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new InvalidAggregateVersionError(value);
  }

  return value as AggregateVersion;
}

export const initialAggregateVersion = (): AggregateVersion => aggregateVersion(0);

export const nextAggregateVersion = (current: AggregateVersion): AggregateVersion =>
  aggregateVersion(current + 1);
