import type { TelemetryAttributes } from './types';

export interface RedactionPolicy {
  redact(attributes: TelemetryAttributes): TelemetryAttributes;
}

const sensitiveKeyFragments = [
  'authorization',
  'businessenvironmentcode',
  'connectionstring',
  'credential',
  'password',
  'secret',
  'token',
] as const;

function normalizeKey(key: string): string {
  return key.replaceAll(/[^a-z0-9]/giu, '').toLowerCase();
}

export class DefaultRedactionPolicy implements RedactionPolicy {
  redact(attributes: TelemetryAttributes): TelemetryAttributes {
    const redacted = Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [
        key,
        sensitiveKeyFragments.some((fragment) => normalizeKey(key).includes(fragment))
          ? '<redacted>'
          : value,
      ]),
    );

    return Object.freeze(redacted);
  }
}
