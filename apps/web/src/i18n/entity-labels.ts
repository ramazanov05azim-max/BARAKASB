import type { TranslationKey } from './config';
import type {
  CategoryId,
  ProjectRole,
  ProjectStatus,
  SolutionId,
} from '@/lib/mock-repository';

export const solutionLabelKeys: Record<SolutionId, TranslationKey> = {
  coffee: 'common.coffee',
  retail: 'common.store',
  service: 'common.service',
};

export const categoryLabelKeys: Record<CategoryId, TranslationKey> = {
  food: 'common.foodBeverage',
  retail: 'common.retail',
  services: 'common.services',
};

export const roleLabelKeys: Record<ProjectRole, TranslationKey> = {
  owner: 'common.owner',
};

export const projectStatusLabelKeys: Record<ProjectStatus, TranslationKey> = {
  active: 'common.active',
  provisioning: 'common.provisioning',
};
