import { describe, expect, it } from 'vitest';
import {
  formatBusinessEnvironmentCode,
  isBusinessEnvironmentCodeComplete,
  normalizeBusinessEnvironmentCode,
} from './business-environment-code';

describe('normalizeBusinessEnvironmentCode', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['1234567', '1234567'],
    ['1234567890123456', '1234567890123456'],
    ['12345678901234567890', '1234567890123456'],
    ['1234 5678 9012 3456', '1234567890123456'],
    ['1234-5678-9012-3456', '1234567890123456'],
    ['ab12cd34ef56gh78ij90kl12mn34op56', '1234567890123456'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeBusinessEnvironmentCode(input)).toBe(expected);
  });
});

describe('formatBusinessEnvironmentCode', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['1234', '1234'],
    ['12345678', '1234 5678'],
    ['1234567890123456', '1234 5678 9012 3456'],
    ['1234-5678 9012-3456', '1234 5678 9012 3456'],
  ])('formats %j as %j', (input, expected) => {
    expect(formatBusinessEnvironmentCode(input)).toBe(expected);
  });

  it('never appends a trailing space', () => {
    expect(formatBusinessEnvironmentCode('1234')).not.toMatch(/\s$/);
    expect(formatBusinessEnvironmentCode('12345678')).not.toMatch(/\s$/);
  });
});

describe('isBusinessEnvironmentCodeComplete', () => {
  it('returns true only for a complete normalized value', () => {
    expect(isBusinessEnvironmentCodeComplete('1234 5678 9012 3456')).toBe(true);
    expect(isBusinessEnvironmentCodeComplete('123456789012345')).toBe(false);
    expect(isBusinessEnvironmentCodeComplete('')).toBe(false);
  });
});
