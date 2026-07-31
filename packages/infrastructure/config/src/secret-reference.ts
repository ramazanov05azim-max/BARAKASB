declare const secretReferenceBrand: unique symbol;

export type SecretReference = string & {
  readonly [secretReferenceBrand]: 'SecretReference';
};

export interface SecretResolver {
  resolve(reference: SecretReference): Promise<string>;
}

export class InvalidSecretReferenceError extends Error {
  readonly code = 'config.invalid_secret_reference';

  constructor() {
    super('Secret reference must use the secret:// scheme and contain no whitespace.');
    this.name = 'InvalidSecretReferenceError';
  }
}

export function secretReference(value: string): SecretReference {
  if (
    !value.startsWith('secret://') ||
    value.length <= 'secret://'.length ||
    /\s/u.test(value)
  ) {
    throw new InvalidSecretReferenceError();
  }

  return value as SecretReference;
}
