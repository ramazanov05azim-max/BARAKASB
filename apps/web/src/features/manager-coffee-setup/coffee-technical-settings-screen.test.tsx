import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type { CoffeeManagerSetupRecord } from './coffee-manager-setup-repository';
import { CoffeeTechnicalSettingsScreen } from './coffee-technical-settings-screen';

const record = {
  schemaVersion: 2,
  project: {
    id: 'coffee-1',
    name: 'Север',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-08-04T10:00:00.000Z',
  },
  installation: {
    id: 'installation-1',
    projectId: 'coffee-1',
    solutionId: 'coffee',
    status: 'installed',
    installedAt: '2026-08-04T10:00:00.000Z',
  },
  establishment: null,
  businessEnvironmentCode: '1234567890123456',
  businessEnvironmentId: 'environment-1',
  configuredAt: '2026-08-04T10:00:00.000Z',
  isDevelopmentDemo: false,
  crashTestSeedVersion: null,
} satisfies CoffeeManagerSetupRecord;

describe('CoffeeTechnicalSettingsScreen', () => {
  it('shows the internal identifier only as read-only technical information', async () => {
    render(
      <I18nProvider>
        <CoffeeTechnicalSettingsScreen
          projectId="coffee-1"
          repository={{ get: vi.fn(async () => record) }}
        />
      </I18nProvider>,
    );

    const identifier = await screen.findByLabelText(
      'Внутренний идентификатор бизнес-среды',
    );
    expect(identifier).toHaveValue('1234 5678 9012 3456');
    expect(identifier).toHaveAttribute('readonly');
    expect(
      screen.getByText(
        'Внутренний системный идентификатор. Не используется для входа сотрудников и подключения устройств.',
      ),
    ).toBeInTheDocument();
  });
});
