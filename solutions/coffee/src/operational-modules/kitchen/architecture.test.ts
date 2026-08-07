import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const solutionRoot = path.resolve(moduleRoot, '..');
const kitchenRoot = path.join(moduleRoot, 'kitchen');

function files(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? files(absolute)
      : /\.tsx?$/u.test(entry.name) && !/\.test\.tsx?$/u.test(entry.name)
        ? [absolute]
        : [];
  });
}

function imports(file: string): string[] {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/gu)].map(
    (match) => match[1] ?? '',
  );
}

describe('Kitchen operational boundary', () => {
  it('uses only owner-owned public preparation and Recipe query services', () => {
    const source = files(kitchenRoot)
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');
    expect(source).toContain("from '../../order-preparation/contracts'");
    expect(source).toContain("from '../../recipe-engine/queries'");
    expect(source).not.toMatch(
      /from ['"]\.\.\/\.\.\/(?:bar-domain|bar-service|bar-local-repository|bar-repository-contracts)['"]/u,
    );
    expect(source).not.toMatch(
      /from ['"]\.\.\/(?:warehouse|bar)\/(?:domain|repository|service|screen)['"]/u,
    );
    expect(source).not.toMatch(/barakasb\.mock\.coffee\.(?:bar-orders|warehouse)/u);
  });

  it('has no reverse UI or repository dependency from owner modules', () => {
    const owners = [
      ...files(path.join(moduleRoot, 'bar')),
      ...files(path.join(moduleRoot, 'warehouse')),
      ...files(path.join(moduleRoot, 'purchasing')),
      ...fs
        .readdirSync(solutionRoot)
        .filter((name) => /^bar-.*\.tsx?$/u.test(name) && !/\.test\.tsx?$/u.test(name))
        .map((name) => path.join(solutionRoot, name)),
    ];
    expect(
      owners.flatMap((file) =>
        imports(file).filter((specifier) => specifier.includes('/kitchen/')),
      ),
    ).toEqual([]);
  });

  it('contains no Kitchen repository or copied ticket persistence', () => {
    expect(fs.existsSync(path.join(kitchenRoot, 'repository.ts'))).toBe(false);
    const source = files(kitchenRoot)
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('KitchenOrder');
  });
});
