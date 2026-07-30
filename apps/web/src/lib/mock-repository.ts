'use client';

export type ProjectStatus = 'active' | 'provisioning';
export type SolutionId = 'coffee' | 'retail' | 'service';
export type CategoryId = 'food' | 'retail' | 'services';
export type ProjectRole = 'owner';

export interface ProjectSummary {
  id: string;
  name: string;
  solutionId: SolutionId;
  categoryId: CategoryId;
  status: ProjectStatus;
  role: ProjectRole;
  createdAt: string;
}

export interface SolutionSummary {
  id: SolutionId;
  nameKey: 'common.coffee' | 'common.store' | 'common.service';
  categoryKey: 'common.foodBeverage' | 'common.retail' | 'common.services';
  descriptionKey:
    | 'solutions.coffeeDescription'
    | 'solutions.storeDescription'
    | 'solutions.serviceDescription';
  status: 'available' | 'coming-soon';
  accent: string;
}

export interface CreateProjectInput {
  name: string;
  categoryId: CategoryId;
  solutionId: SolutionId;
}

export interface MockRepository {
  listProjects(): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<ProjectSummary | null>;
  createProject(input: CreateProjectInput): Promise<ProjectSummary>;
  listSolutions(): Promise<SolutionSummary[]>;
  authenticate(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
}

export type MockRepositoryErrorCode =
  'account-blocked' | 'account-existing' | 'invalid-password';

export class MockRepositoryError extends Error {
  constructor(public readonly code: MockRepositoryErrorCode) {
    super(code);
    this.name = 'MockRepositoryError';
  }
}

const storageKey = 'barakasb.mock.projects.v2';

const seedProjects: ProjectSummary[] = [
  {
    id: 'north-star',
    name: 'North Star',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-07-30T09:00:00.000Z',
  },
];

const solutions: SolutionSummary[] = [
  {
    id: 'coffee',
    nameKey: 'common.coffee',
    categoryKey: 'common.foodBeverage',
    descriptionKey: 'solutions.coffeeDescription',
    status: 'available',
    accent: 'from-amber-200 to-orange-100',
  },
  {
    id: 'retail',
    nameKey: 'common.store',
    categoryKey: 'common.retail',
    descriptionKey: 'solutions.storeDescription',
    status: 'coming-soon',
    accent: 'from-sky-200 to-blue-100',
  },
  {
    id: 'service',
    nameKey: 'common.service',
    categoryKey: 'common.services',
    descriptionKey: 'solutions.serviceDescription',
    status: 'coming-soon',
    accent: 'from-violet-200 to-fuchsia-100',
  },
];

const wait = async (milliseconds = 320): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

function readProjects(): ProjectSummary[] {
  if (typeof window === 'undefined') return seedProjects;
  const value = window.localStorage.getItem(storageKey);
  if (!value) {
    window.localStorage.setItem(storageKey, JSON.stringify(seedProjects));
    return seedProjects;
  }
  try {
    return JSON.parse(value) as ProjectSummary[];
  } catch {
    return seedProjects;
  }
}

export const mockRepository: MockRepository = {
  async listProjects() {
    await wait();
    return readProjects();
  },
  async getProject(id) {
    await wait(180);
    return readProjects().find((project) => project.id === id) ?? null;
  },
  async createProject(input) {
    await wait(700);
    const id = `${input.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now().toString(36).slice(-4)}`;
    const project: ProjectSummary = {
      id,
      name: input.name.trim(),
      categoryId: input.categoryId,
      solutionId: input.solutionId,
      status: 'active',
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
    const projects = [...readProjects(), project];
    window.localStorage.setItem(storageKey, JSON.stringify(projects));
    return project;
  },
  async listSolutions() {
    await wait(240);
    return solutions;
  },
  async authenticate(email, password) {
    await wait(600);
    if (email.toLowerCase() === 'blocked@barakasb.test') {
      throw new MockRepositoryError('account-blocked');
    }
    if (password.length < 8) throw new MockRepositoryError('invalid-password');
  },
  async register(_name, email, _password) {
    void _name;
    void _password;
    await wait(700);
    if (email.toLowerCase() === 'existing@barakasb.test') {
      throw new MockRepositoryError('account-existing');
    }
  },
  async requestPasswordReset(_email) {
    void _email;
    await wait(650);
  },
};
