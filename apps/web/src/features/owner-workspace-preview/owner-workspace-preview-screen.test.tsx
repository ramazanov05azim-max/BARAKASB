import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/i18n-provider';
import type { OwnerWorkspacePreviewService } from './owner-workspace-preview-service';
import { OwnerWorkspacePreviewScreen } from './owner-workspace-preview-screen';

describe('OwnerWorkspacePreviewScreen', () => {
  it('opens a concrete workspace without device binding or employee login', async () => {
    const sessionWrite = vi.spyOn(Storage.prototype, 'setItem');
    const service: OwnerWorkspacePreviewService = {
      load: vi.fn(async () => ({
        projectId: 'coffee-1',
        projectName: 'Север',
        businessEnvironmentId: 'environment-1',
        workspaceId: 'workspace-kitchen',
        workspaceType: 'kitchen' as const,
      })),
    };

    render(
      <I18nProvider>
        <OwnerWorkspacePreviewScreen
          projectId="coffee-1"
          workspaceId="workspace-kitchen"
          service={service}
        />
      </I18nProvider>,
    );

    expect(await screen.findByText('Предпросмотр владельца')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Кухня' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Вернуться в управление' }),
    ).toHaveAttribute('href', '/projects/coffee-1');
    expect(
      screen.queryByLabelText('Код рабочего пространства'),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Пароль')).not.toBeInTheDocument();
    expect(sessionWrite).not.toHaveBeenCalled();
    sessionWrite.mockRestore();
  });
});
