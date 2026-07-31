import type { ConfigSource } from './source';
import {
  InvalidSecretReferenceError,
  secretReference,
  type SecretReference,
} from './secret-reference';

export type ConfigIssueCode =
  | 'missing'
  | 'invalid_boolean'
  | 'invalid_enum'
  | 'invalid_integer'
  | 'invalid_secret_reference'
  | 'invalid_string'
  | 'out_of_range'
  | 'invariant_violation';

export interface ConfigIssue {
  readonly key: string;
  readonly code: ConfigIssueCode;
  readonly message: string;
}

export class ConfigurationValidationError extends Error {
  readonly code = 'config.validation_failed';
  readonly issues: readonly ConfigIssue[];

  constructor(issues: readonly ConfigIssue[]) {
    super(`Runtime configuration is invalid (${issues.length} issue(s)).`);
    this.name = 'ConfigurationValidationError';
    this.issues = Object.freeze([...issues]);
  }
}

export class ConfigReader {
  readonly #issues: ConfigIssue[] = [];

  constructor(private readonly source: ConfigSource) {}

  requiredString(key: string): string | undefined {
    const value = this.source.get(key);

    if (value === undefined) {
      this.addIssue(key, 'missing', 'Required configuration is missing.');
      return undefined;
    }

    if (value.length === 0 || value.trim() !== value) {
      this.addIssue(
        key,
        'invalid_string',
        'Value must be non-empty and have no surrounding whitespace.',
      );
      return undefined;
    }

    return value;
  }

  optionalString(key: string): string | undefined {
    const value = this.source.get(key);

    if (value === undefined) {
      return undefined;
    }

    if (value.length === 0 || value.trim() !== value) {
      this.addIssue(
        key,
        'invalid_string',
        'Value must be non-empty and have no surrounding whitespace.',
      );
      return undefined;
    }

    return value;
  }

  integer(
    key: string,
    options: Readonly<{
      defaultValue?: number;
      minimum: number;
      maximum: number;
    }>,
  ): number | undefined {
    const raw = this.source.get(key);

    if (raw === undefined) {
      if (options.defaultValue !== undefined) {
        return options.defaultValue;
      }

      this.addIssue(key, 'missing', 'Required configuration is missing.');
      return undefined;
    }

    if (!/^-?\d+$/u.test(raw)) {
      this.addIssue(key, 'invalid_integer', 'Value must be an integer.');
      return undefined;
    }

    const value = Number(raw);

    if (
      !Number.isSafeInteger(value) ||
      value < options.minimum ||
      value > options.maximum
    ) {
      this.addIssue(
        key,
        'out_of_range',
        `Value must be between ${options.minimum} and ${options.maximum}.`,
      );
      return undefined;
    }

    return value;
  }

  boolean(key: string, defaultValue?: boolean): boolean | undefined {
    const raw = this.source.get(key);

    if (raw === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      this.addIssue(key, 'missing', 'Required configuration is missing.');
      return undefined;
    }

    if (raw === 'true') {
      return true;
    }

    if (raw === 'false') {
      return false;
    }

    this.addIssue(key, 'invalid_boolean', 'Value must be true or false.');
    return undefined;
  }

  enumValue<const Values extends readonly string[]>(
    key: string,
    values: Values,
  ): Values[number] | undefined {
    const raw = this.requiredString(key);

    if (raw === undefined) {
      return undefined;
    }

    if (!values.includes(raw)) {
      this.addIssue(key, 'invalid_enum', `Value must be one of: ${values.join(', ')}.`);
      return undefined;
    }

    return raw as Values[number];
  }

  secretReference(key: string): SecretReference | undefined {
    const raw = this.requiredString(key);

    if (raw === undefined) {
      return undefined;
    }

    try {
      return secretReference(raw);
    } catch (error) {
      if (error instanceof InvalidSecretReferenceError) {
        this.addIssue(
          key,
          'invalid_secret_reference',
          'Value must be an external secret reference.',
        );
        return undefined;
      }

      throw error;
    }
  }

  invariant(valid: boolean, key: string, message: string): void {
    if (!valid) {
      this.addIssue(key, 'invariant_violation', message);
    }
  }

  finish(): void {
    if (this.#issues.length > 0) {
      throw new ConfigurationValidationError(this.#issues);
    }
  }

  private addIssue(key: string, code: ConfigIssueCode, message: string): void {
    this.#issues.push(Object.freeze({ key, code, message }));
  }
}
