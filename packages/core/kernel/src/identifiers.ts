declare const brand: unique symbol;

export type Brand<Value, Name extends string> = Value & {
  readonly [brand]: Name;
};

export type ActorId = Brand<string, 'ActorId'>;
export type AggregateId = Brand<string, 'AggregateId'>;
export type CausationId = Brand<string, 'CausationId'>;
export type CorrelationId = Brand<string, 'CorrelationId'>;
export type EventId = Brand<string, 'EventId'>;
export type OperationId = Brand<string, 'OperationId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type SolutionId = Brand<string, 'SolutionId'>;
export type SolutionInstallationId = Brand<string, 'SolutionInstallationId'>;

export class InvalidIdentifierError extends Error {
  readonly code = 'kernel.invalid_identifier';

  constructor(
    readonly identifierType: string,
    readonly reason: 'empty' | 'surrounding_whitespace' | 'control_character',
  ) {
    super(`Invalid ${identifierType}: ${reason}.`);
    this.name = 'InvalidIdentifierError';
  }
}

function parseIdentifier<Name extends string>(
  value: string,
  identifierType: Name,
): Brand<string, Name> {
  if (value.length === 0) {
    throw new InvalidIdentifierError(identifierType, 'empty');
  }

  if (value.trim() !== value) {
    throw new InvalidIdentifierError(identifierType, 'surrounding_whitespace');
  }

  if (/[\u0000-\u001f\u007f]/u.test(value)) {
    throw new InvalidIdentifierError(identifierType, 'control_character');
  }

  return value as Brand<string, Name>;
}

export const actorId = (value: string): ActorId => parseIdentifier(value, 'ActorId');
export const aggregateId = (value: string): AggregateId =>
  parseIdentifier(value, 'AggregateId');
export const causationId = (value: string): CausationId =>
  parseIdentifier(value, 'CausationId');
export const correlationId = (value: string): CorrelationId =>
  parseIdentifier(value, 'CorrelationId');
export const eventId = (value: string): EventId => parseIdentifier(value, 'EventId');
export const operationId = (value: string): OperationId =>
  parseIdentifier(value, 'OperationId');
export const projectId = (value: string): ProjectId =>
  parseIdentifier(value, 'ProjectId');
export const solutionId = (value: string): SolutionId =>
  parseIdentifier(value, 'SolutionId');
export const solutionInstallationId = (value: string): SolutionInstallationId =>
  parseIdentifier(value, 'SolutionInstallationId');
