import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const solutionSourceRoot = path.resolve(moduleRoot, '..');
const managerRoot = path.join(moduleRoot, 'manager');

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(absolute)
      : /\.(?:ts|tsx)$/u.test(entry.name) && !/\.test\.tsx?$/u.test(entry.name)
        ? [absolute]
        : [];
  });
}

function content(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

function relativeImports(file: string): string[] {
  return [...content(file).matchAll(/(?:from|import)\s*['"](\.[^'"]+)['"]/gu)].map(
    (match) => match[1] ?? '',
  );
}

function resolveSource(file: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(file), specifier);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

describe('Manager operational boundary', () => {
  it('imports owner modules only through their public query contracts', () => {
    const managerService = content(path.join(managerRoot, 'service.ts'));
    expect(managerService).toContain("from '../warehouse/queries'");
    expect(managerService).toContain("from '../purchasing/queries'");
    expect(managerService).not.toMatch(
      /from ['"]\.\.\/(?:warehouse|purchasing)\/(?:domain|repository|service|screen)['"]/u,
    );

    const forbidden = sourceFiles(managerRoot).flatMap((file) => {
      const matches = content(file).match(
        /from ['"]\.\.\/(?:warehouse|purchasing)\/(?:domain|repository|screen)['"]/gu,
      );
      return matches?.map((match) => `${path.basename(file)}: ${match}`) ?? [];
    });
    expect(forbidden).toEqual([]);
  });

  it('has no reverse dependency from any implemented owner module to Manager', () => {
    for (const owner of ['warehouse', 'purchasing']) {
      const imports = sourceFiles(path.join(moduleRoot, owner)).flatMap((file) =>
        relativeImports(file).filter((specifier) => specifier.includes('/manager')),
      );
      expect(imports, `${owner} must not know Manager`).toEqual([]);
    }
    const barFiles = [
      ...sourceFiles(path.join(moduleRoot, 'bar')),
      ...fs
        .readdirSync(solutionSourceRoot)
        .filter((name) => /^bar-.*\.tsx?$/u.test(name) && !/\.test\.tsx?$/u.test(name))
        .map((name) => path.join(solutionSourceRoot, name)),
    ];
    const barImports = barFiles.flatMap((file) =>
      relativeImports(file).filter((specifier) => specifier.includes('/manager')),
    );
    expect(barImports, 'bar must not know Manager').toEqual([]);
  });

  it('does not use another operational module storage namespace', () => {
    const managerSources = sourceFiles(managerRoot).map(content).join('\n');
    expect(managerSources).not.toMatch(
      /barakasb\.mock\.coffee\.(?:warehouse|purchasing|bar-orders)\./u,
    );
  });

  it('does not import another bounded context internal domain, repository or screen', () => {
    const forbidden = sourceFiles(moduleRoot).flatMap((file) =>
      relativeImports(file)
        .filter((specifier) =>
          /^\.\.\/(?:bar|warehouse|purchasing|manager)\/(?:domain|repository|screen)$/u.test(
            specifier,
          ),
        )
        .map((specifier) => `${path.relative(moduleRoot, file)} -> ${specifier}`),
    );
    expect(forbidden).toEqual([]);
  });

  it('contains no circular relative imports across operational modules', () => {
    const files = sourceFiles(moduleRoot);
    const fileSet = new Set(files);
    const graph = new Map(
      files.map((file) => [
        file,
        relativeImports(file)
          .map((specifier) => resolveSource(file, specifier))
          .filter((resolved): resolved is string =>
            Boolean(resolved && fileSet.has(resolved)),
          ),
      ]),
    );
    const visiting = new Set<string>();
    const visited = new Set<string>();

    function visit(file: string, chain: string[]): string[] | null {
      if (visiting.has(file)) return [...chain, file];
      if (visited.has(file)) return null;
      visiting.add(file);
      for (const dependency of graph.get(file) ?? []) {
        const cycle = visit(dependency, [...chain, file]);
        if (cycle) return cycle;
      }
      visiting.delete(file);
      visited.add(file);
      return null;
    }

    const cycle = files.map((file) => visit(file, [])).find(Boolean) ?? null;
    const relativeCycle = cycle
      ? cycle.map((file) => path.relative(moduleRoot, file))
      : null;
    expect(relativeCycle).toBeNull();
  });
});
