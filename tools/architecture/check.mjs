import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];
const ignoredDirectories = new Set(['.git', '.nx', 'node_modules', 'outputs', 'work']);

const requiredFiles = [
  'README.md',
  'ARCHITECTURE_VALIDATION_REPORT.md',
  'UX_FOUNDATION.md',
  'SCREEN_MAP.md',
  'NAVIGATION.md',
  'DESIGN_SYSTEM.md',
  'COMPONENT_LIBRARY.md',
  'DESIGN_PRINCIPLES.md',
  'USER_JOURNEYS.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'docs/index.md',
  'docs/architecture/overview.md',
  'docs/architecture/decision-map.md',
  'docs/architecture/tenancy-and-isolation.md',
  'docs/architecture/control-plane-and-data-plane.md',
  'docs/architecture/authentication.md',
  'docs/architecture/authorization.md',
  'docs/architecture/solution-engine.md',
  'docs/architecture/plugin-engine.md',
  'docs/architecture/extension-contracts.md',
  'docs/architecture/extension-isolation.md',
  'docs/architecture/compatibility-and-versioning.md',
  'docs/architecture/analytics-and-reporting.md',
  'docs/architecture/integration-boundaries.md',
  'docs/architecture/data-classification-and-lifecycle.md',
  'docs/open-decisions.md',
  'docs/onboarding/README.md',
  'docs/onboarding/platform-mental-model.md',
  'docs/onboarding/repository-navigation.md',
  'docs/onboarding/request-lifecycle.md',
  'docs/onboarding/change-playbook.md',
  'docs/governance/architecture-governance.md',
  'docs/governance/documentation-standard.md',
  'docs/operations/production-readiness.md',
  'docs/reviews/2026-07-30-enterprise-architecture-review.md',
  'docs/reviews/phase-2-adr-review.md',
  'docs/reviews/phase-2-documentation-audit.md',
  'docs/security/threat-model.md',
  'docs/security/privileged-access.md',
  'docs/adr/README.md',
  'docs/adr/template.md',
];

const zonePolicies = [
  { prefix: 'apps/', type: 'type:app', projectType: 'application' },
  { prefix: 'packages/core/', type: 'type:core', projectType: 'library' },
  {
    prefix: 'packages/contracts/',
    type: 'type:contracts',
    projectType: 'library',
  },
  {
    prefix: 'packages/infrastructure/',
    type: 'type:infrastructure',
    projectType: 'library',
  },
  {
    prefix: 'packages/frontend/',
    type: 'type:frontend',
    projectType: 'library',
  },
  {
    prefix: 'packages/toolchain/',
    type: 'type:tooling',
    projectType: 'library',
  },
  { prefix: 'solutions/', type: 'type:solution', projectType: 'library' },
  { prefix: 'plugins/', type: 'type:plugin', projectType: 'library' },
];

const allowedTypeTags = new Set(zonePolicies.map(({ type }) => type));
const allowedRuntimeTags = new Set([
  'runtime:browser',
  'runtime:server',
  'runtime:tooling',
  'runtime:universal',
]);
const applicationProfiles = new Map([
  ['apps/web', ['app-web', 'scope:edge', 'runtime:universal']],
  [
    'apps/control-plane-api',
    ['app-control-plane-api', 'scope:control-plane', 'runtime:server'],
  ],
  [
    'apps/control-plane-worker',
    ['app-control-plane-worker', 'scope:control-plane', 'runtime:server'],
  ],
  ['apps/data-plane-api', ['app-data-plane-api', 'scope:data-plane', 'runtime:server']],
  [
    'apps/data-plane-worker',
    ['app-data-plane-worker', 'scope:data-plane', 'runtime:server'],
  ],
  [
    'apps/realtime-gateway',
    ['app-realtime-gateway', 'scope:data-plane', 'runtime:server'],
  ],
  [
    'apps/extension-runner',
    ['app-extension-runner', 'scope:extension-plane', 'runtime:server'],
  ],
]);

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function walk(directory, predicate = () => true) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute, predicate));
    else if (predicate(absolute)) files.push(absolute);
  }
  return files;
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing required file: ${file}`);
  }
}

const projectFiles = walk(root, (file) => path.basename(file) === 'project.json');
const names = new Map();
const roots = new Map();

for (const file of projectFiles) {
  const projectDirectory = relative(path.dirname(file));
  let project;
  try {
    project = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${relative(file)} is invalid JSON: ${error.message}`);
    continue;
  }

  if (project.root !== projectDirectory) {
    errors.push(`${relative(file)} root must equal ${projectDirectory}`);
  }
  if (!fs.existsSync(path.join(path.dirname(file), 'README.md'))) {
    errors.push(`${projectDirectory} must document its boundary in README.md`);
  }

  if (typeof project.name !== 'string' || project.name.length === 0) {
    errors.push(`${relative(file)} has no project name`);
  } else if (names.has(project.name)) {
    errors.push(
      `Duplicate project name ${project.name}: ${names.get(project.name)} and ${relative(file)}`,
    );
  } else {
    names.set(project.name, relative(file));
  }

  if (roots.has(project.root)) {
    errors.push(
      `Duplicate project root ${project.root}: ${roots.get(project.root)} and ${relative(file)}`,
    );
  } else {
    roots.set(project.root, relative(file));
  }

  const policy = zonePolicies.find(({ prefix }) =>
    `${projectDirectory}/`.startsWith(prefix),
  );
  if (!policy) {
    errors.push(`${relative(file)} is outside an approved project zone`);
    continue;
  }

  if (project.projectType !== policy.projectType) {
    errors.push(`${relative(file)} must use projectType ${policy.projectType}`);
  }

  const tags = Array.isArray(project.tags) ? project.tags : [];
  const typeTags = tags.filter((tag) => allowedTypeTags.has(tag));
  const runtimeTags = tags.filter((tag) => allowedRuntimeTags.has(tag));
  const scopeTags = tags.filter((tag) => tag.startsWith('scope:'));

  if (typeTags.length !== 1 || typeTags[0] !== policy.type) {
    errors.push(`${relative(file)} must have exactly ${policy.type}`);
  }
  if (runtimeTags.length !== 1) {
    errors.push(`${relative(file)} must have exactly one runtime:* tag`);
  }
  if (scopeTags.length !== 1) {
    errors.push(`${relative(file)} must have exactly one scope:* tag`);
  }

  if (policy.type === 'type:app') {
    const profile = applicationProfiles.get(projectDirectory);
    if (!profile) {
      errors.push(
        `${relative(file)} has no approved least-privilege application profile`,
      );
    } else {
      const [expectedName, expectedScope, expectedRuntime] = profile;
      if (project.name !== expectedName) {
        errors.push(`${relative(file)} name must be ${expectedName}`);
      }
      if (!tags.includes(expectedScope) || !tags.includes(expectedRuntime)) {
        errors.push(
          `${relative(file)} must use ${expectedScope} and ${expectedRuntime}`,
        );
      }
    }
  }

  if (policy.type === 'type:solution') {
    if (scopeTags.some((tag) => tag === 'scope:platform' || tag === 'scope:shared')) {
      errors.push(`${relative(file)} must have a Solution-specific scope`);
    }
  }

  if (policy.type === 'type:plugin') {
    const targetSolution = project.metadata?.targetSolution;
    if (typeof targetSolution !== 'string' || !/^[a-z0-9-]+$/.test(targetSolution)) {
      errors.push(`${relative(file)} must declare metadata.targetSolution`);
    } else {
      if (!tags.includes(`scope:${targetSolution}`)) {
        errors.push(
          `${relative(file)} scope must match target Solution ${targetSolution}`,
        );
      }
      if (!project.name.startsWith(`plugin-${targetSolution}-`)) {
        errors.push(`${relative(file)} name must start with plugin-${targetSolution}-`);
      }
    }
  }
}

for (const zone of [
  'apps',
  'packages/core',
  'packages/contracts',
  'packages/infrastructure',
  'packages/frontend',
  'packages/toolchain',
]) {
  const zonePath = path.join(root, zone);
  for (const entry of fs.readdirSync(zonePath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const projectFile = path.join(zonePath, entry.name, 'project.json');
    if (!fs.existsSync(projectFile)) {
      errors.push(`${relative(path.dirname(projectFile))} is missing project.json`);
    }
  }
}

const markdownFiles = walk(root, (file) => file.endsWith('.md'));
const linkPattern = /\[[^\]]*]\(([^)]+)\)/g;
for (const file of markdownFiles) {
  const contents = fs.readFileSync(file, 'utf8');
  for (const match of contents.matchAll(linkPattern)) {
    const href = match[1].trim().replace(/^<|>$/g, '');
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) continue;
    const target = decodeURIComponent(href.split('#')[0]);
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) {
      errors.push(`${relative(file)} has broken link: ${href}`);
    }
  }
}

for (const file of markdownFiles) {
  const fileName = relative(file);
  if (
    fileName.startsWith('docs/adr/') ||
    fileName.startsWith('docs/reviews/') ||
    fileName === 'ARCHITECTURE_VALIDATION_REPORT.md'
  ) {
    continue;
  }
  const contents = fs.readFileSync(file, 'utf8');
  for (const legacyPath of ['apps/api', 'apps/worker', 'packages/shared']) {
    if (contents.includes(legacyPath)) {
      errors.push(`${fileName} references removed path: ${legacyPath}`);
    }
  }
}

const adrFiles = fs
  .readdirSync(path.join(root, 'docs/adr'))
  .filter((file) => /^\d{4}-.*\.md$/.test(file));
const adrNumbers = new Set();
const adrIndex = fs.readFileSync(path.join(root, 'docs/adr/README.md'), 'utf8');
const decisionMap = fs.readFileSync(
  path.join(root, 'docs/architecture/decision-map.md'),
  'utf8',
);
for (const file of adrFiles) {
  const number = file.slice(0, 4);
  if (adrNumbers.has(number)) errors.push(`Duplicate ADR number: ${number}`);
  adrNumbers.add(number);
  if (!adrIndex.includes(`](${file})`)) errors.push(`ADR is not indexed: ${file}`);
  if (!decisionMap.includes(`](../adr/${file})`)) {
    errors.push(`ADR is missing from decision map: ${file}`);
  }

  const contents = fs.readFileSync(path.join(root, 'docs/adr', file), 'utf8');
  for (const heading of [
    '## Context',
    '## Decision',
    '## Alternatives considered',
    '## Consequences',
  ]) {
    if (!contents.includes(heading)) {
      errors.push(`${file} is missing required section: ${heading}`);
    }
  }
}

for (const file of fs.readdirSync(path.join(root, 'docs/architecture'))) {
  if (!file.endsWith('.md') || file === 'decision-map.md') continue;
  const contents = fs.readFileSync(path.join(root, 'docs/architecture', file), 'utf8');
  if (!contents.includes('## Related decision')) {
    errors.push(`Architecture document has no ADR traceability section: ${file}`);
  }
}

const implementationExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
for (const zone of ['plugins']) {
  for (const file of walk(path.join(root, zone))) {
    if (implementationExtensions.has(path.extname(file))) {
      errors.push(`Unapproved Plugin implementation found in ${relative(file)}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Architecture check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Architecture check passed: ${projectFiles.length} projects, ${markdownFiles.length} Markdown files, ${adrFiles.length} ADRs.`,
);
