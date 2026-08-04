// Manager-only identifier formatting. Operational access uses Workspace Codes.
const maximumCodeLength = 16;
const codeGroupSize = 4;

export function normalizeBusinessEnvironmentCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, maximumCodeLength);
}

export function formatBusinessEnvironmentCode(value: string): string {
  const normalized = normalizeBusinessEnvironmentCode(value);
  const groups = normalized.match(new RegExp(`.{1,${codeGroupSize}}`, 'g'));
  return groups?.join(' ') ?? '';
}

export function isBusinessEnvironmentCodeComplete(value: string): boolean {
  return normalizeBusinessEnvironmentCode(value).length === maximumCodeLength;
}
