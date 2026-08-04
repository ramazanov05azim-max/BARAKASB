// @vitest-environment jsdom

import React from 'react';
import type { MediaAsset, MediaAssetId } from '@barakasb/contracts-platform';
import type { MediaAssetService } from '@barakasb/frontend-media';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCoffeeCrashTestSeed } from './coffee-crash-test-seed';
import type { CollectionKey } from './domain';
import { CoffeeI18nProvider } from './i18n';
import { CoffeeResourceScreen } from './resource-screen';
import { createLocalCoffeeManagerRepositories } from './repositories';
import { CoffeeWorkspaceProvider, generateMenuItemSku } from './workspace-store';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const projectId = 'menu-item-form-test';
const timestamp = '2026-07-31T12:00:00.000Z';
const storedValues = new Map<string, string>();
const mediaAssets = new Map<MediaAssetId, MediaAsset>();
let mediaSequence = 0;
const releasePreview = vi.fn();
const testMediaService: MediaAssetService = {
  async uploadImage(input) {
    const id = input.assetId ?? (`media-test-${++mediaSequence}` as MediaAssetId);
    const timestamp = new Date().toISOString();
    const asset: MediaAsset = {
      id,
      projectId: input.projectId,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      fileName: input.fileName,
      mimeType: 'image/webp',
      byteSize: input.file.size,
      width: 800,
      height: 600,
      source: 'local-binary',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    mediaAssets.set(id, asset);
    return asset;
  },
  async importExternalImage() {
    throw new Error('not-used');
  },
  async get(requestedProjectId, assetId) {
    const asset = mediaAssets.get(assetId);
    return asset?.projectId === requestedProjectId ? asset : null;
  },
  async list(requestedProjectId) {
    return [...mediaAssets.values()].filter(
      (asset) => asset.projectId === requestedProjectId,
    );
  },
  async resolveDisplayUrl(requestedProjectId, assetId) {
    const asset = mediaAssets.get(assetId);
    if (!asset || asset.projectId !== requestedProjectId) return null;
    return {
      asset,
      url: `blob:${assetId}`,
      release: releasePreview,
    };
  },
  async remove(requestedProjectId, assetId) {
    if (mediaAssets.get(assetId)?.projectId === requestedProjectId) {
      mediaAssets.delete(assetId);
    }
  },
  async removeProject(requestedProjectId) {
    for (const asset of mediaAssets.values()) {
      if (asset.projectId === requestedProjectId) mediaAssets.delete(asset.id);
    }
  },
};
const testRepositories = createLocalCoffeeManagerRepositories(testMediaService);
const localStorageAdapter: Storage = {
  get length() {
    return storedValues.size;
  },
  clear: () => storedValues.clear(),
  getItem: (key) => storedValues.get(key) ?? null,
  key: (index) => [...storedValues.keys()][index] ?? null,
  removeItem: (key) => {
    storedValues.delete(key);
  },
  setItem: (key, value) => {
    storedValues.set(key, value);
  },
};

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageAdapter,
  });
});
beforeEach(() => {
  window.localStorage.clear();
  mediaAssets.clear();
  mediaSequence = 0;
  releasePreview.mockClear();
});
afterEach(cleanup);

async function renderSeededMenu(): Promise<ReturnType<typeof userEvent.setup>> {
  await testRepositories.coffeeProject.initialize(projectId, 'Тестовая кофейня');
  await testRepositories.developmentSeed.apply(
    projectId,
    createCoffeeCrashTestSeed(timestamp),
  );
  const profile = await testRepositories.businessProfile.get(projectId);
  await testRepositories.businessProfile.update(projectId, {
    ...profile,
    taxMode: 'project-tax-mode',
  });

  renderResource('menuItems', projectId, 'Тестовая кофейня');
  await screen.findByRole('heading', { name: 'Позиции меню' });
  return userEvent.setup();
}

function renderResource(
  kind: CollectionKey,
  resourceProjectId: string,
  projectName: string,
): void {
  render(
    <CoffeeI18nProvider locale="ru">
      <CoffeeWorkspaceProvider
        projectId={resourceProjectId}
        projectName={projectName}
        repositories={testRepositories}
      >
        <CoffeeResourceScreen kind={kind} />
      </CoffeeWorkspaceProvider>
    </CoffeeI18nProvider>,
  );
}

async function openCreateForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Создать позицию' }));
  expect(await screen.findByRole('heading', { name: 'Новая запись' })).toBeTruthy();
}

describe('Coffee menu item owner form', () => {
  it('shows only owner-editable fields with readable Russian controls', async () => {
    const user = await renderSeededMenu();
    await openCreateForm(user);

    expect(screen.getByRole('textbox', { name: /Название/ })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Категория/ })).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: /Цена продажи/ })).toBeTruthy();
    expect(screen.getByText('Изображение')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Рецептура/ })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Группы модификаторов' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /^Штрихкод/u })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Статус/ })).toBeTruthy();

    expect(screen.queryByLabelText('Описание')).toBeNull();
    expect(screen.queryByLabelText('SKU')).toBeNull();
    expect(screen.queryByLabelText('Налоговая категория')).toBeNull();
    expect(screen.queryByLabelText('Доступность по локациям')).toBeNull();
    expect(screen.queryByDisplayValue(/^https?:\/\//u)).toBeNull();
    expect(
      screen.getByText(
        'Необязательно. Используется для быстрого поиска и сканирования готовых товаров.',
      ),
    ).toBeTruthy();

    expect(
      within(screen.getByRole('combobox', { name: /Рецептура/ })).getByRole('option', {
        name: 'Техкарта · Капучино',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Молоко' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Сироп' })).toBeTruthy();
    expect(screen.queryByText('crash-modifier-milk')).toBeNull();

    const status = screen.getByRole('combobox', { name: /Статус/ });
    expect(within(status).getByRole('option', { name: 'Активен' })).toBeTruthy();
    expect(within(status).getByRole('option', { name: 'Неактивен' })).toBeTruthy();
    expect(within(status).queryByRole('option', { name: 'Черновик' })).toBeNull();
  });

  it('uploads, replaces and removes an image without exposing a URL field', async () => {
    const user = await renderSeededMenu();
    await openCreateForm(user);

    const firstImage = new File(['first'], 'first.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Загрузить изображение'), firstImage);
    await waitFor(() => expect(screen.getByLabelText('Заменить')).toBeTruthy());
    await waitFor(() =>
      expect(
        screen.getByRole('img', { name: 'Предпросмотр изображения' }).style
          .backgroundImage,
      ).toContain('blob:media-test-1'),
    );

    const replacement = new File(['replacement'], 'replacement.png', {
      type: 'image/png',
    });
    await user.upload(screen.getByLabelText('Заменить'), replacement);
    await waitFor(() =>
      expect(mediaAssets.has('media-test-1' as MediaAssetId)).toBe(false),
    );
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(screen.getByLabelText('Загрузить изображение')).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Предпросмотр изображения' }).style
        .backgroundImage,
    ).toBe('');
    await waitFor(() => expect(mediaAssets.size).toBe(0));
    expect(releasePreview).toHaveBeenCalled();
    expect([...storedValues.values()].join('')).not.toContain('data:image');
  });

  it('persists only the media asset ID and resolves the image after a UI refresh', async () => {
    const user = await renderSeededMenu();
    await openCreateForm(user);

    await user.upload(
      screen.getByLabelText('Загрузить изображение'),
      new File(['image'], 'latte.png', { type: 'image/png' }),
    );
    await user.type(screen.getByRole('textbox', { name: /Название/ }), 'Латте с фото');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Категория/ }),
      'crash-category-coffee',
    );
    await user.type(screen.getByRole('spinbutton', { name: /Цена продажи/ }), '420');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    const created = await waitFor(async () => {
      const snapshot = await testRepositories.loadSnapshot(projectId);
      const item = snapshot.menuItems.find(
        (candidate) => candidate.name === 'Латте с фото',
      );
      expect(item?.imageAssetId).toBe('media-test-1');
      return item;
    });
    expect(created?.imageAssetId).toBe('media-test-1');
    const serializedCoffeeState = [...storedValues.entries()]
      .filter(([key]) => key.startsWith('barakasb.mock.coffee.project.v1.'))
      .map(([, stored]) => stored)
      .join('');
    expect(serializedCoffeeState).not.toContain('data:image');
    expect(serializedCoffeeState).not.toContain('blob:');
    expect(serializedCoffeeState).toContain('"imageAssetId":"media-test-1"');

    cleanup();
    renderResource('menuItems', projectId, 'Тестовая кофейня');
    await screen.findByRole('heading', { name: 'Позиции меню' });
    const row = screen
      .getAllByRole('row')
      .find((candidate) => within(candidate).queryByText('Латте с фото'));
    expect(row).toBeTruthy();
    if (!row) throw new Error('Expected menu item with media.');
    await user.click(within(row).getByRole('button', { name: 'Изменить' }));
    await waitFor(() =>
      expect(
        screen.getByRole('img', { name: 'Предпросмотр изображения' }).style
          .backgroundImage,
      ).toContain('blob:media-test-1'),
    );
  });

  it('creates an item with automatic technical values and zero or many modifiers', async () => {
    const user = await renderSeededMenu();
    await openCreateForm(user);

    await user.type(screen.getByRole('textbox', { name: /Название/ }), 'Тестовый раф');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Категория/ }),
      'crash-category-coffee',
    );
    await user.type(screen.getByRole('spinbutton', { name: /Цена продажи/ }), '450');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Рецептура/ }),
      'crash-recipe-cappuccino',
    );
    await user.click(screen.getByRole('checkbox', { name: 'Молоко' }));
    await user.click(screen.getByRole('checkbox', { name: 'Сироп' }));
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const snapshot = await testRepositories.loadSnapshot(projectId);
      expect(snapshot.menuItems.some((item) => item.name === 'Тестовый раф')).toBe(
        true,
      );
    });
    const firstSnapshot = await testRepositories.loadSnapshot(projectId);
    const created = firstSnapshot.menuItems.find(
      (item) => item.name === 'Тестовый раф',
    );
    expect(created).toMatchObject({
      sku: 'MENU-0001',
      taxCategory: 'project-tax-mode',
      locationAvailability: 'crash-location-main',
      barcode: '',
      recipeId: 'crash-recipe-cappuccino',
      modifierGroupIds: ['crash-modifier-milk', 'crash-modifier-syrup'],
    });

    await openCreateForm(user);
    await user.type(
      screen.getByRole('textbox', { name: /Название/ }),
      'Товар без настроек',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Категория/ }),
      'crash-category-food',
    );
    await user.type(screen.getByRole('spinbutton', { name: /Цена продажи/ }), '120');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const snapshot = await testRepositories.loadSnapshot(projectId);
      expect(
        snapshot.menuItems.find((item) => item.name === 'Товар без настроек')
          ?.modifierGroupIds,
      ).toEqual([]);
    });
  });

  it('preserves hidden existing data while editing an item', async () => {
    const user = await renderSeededMenu();
    const before = await testRepositories.loadSnapshot(projectId);
    const existing = before.menuItems.find((item) => item.name === 'Капучино');
    expect(existing).toBeTruthy();

    const row = screen
      .getAllByRole('row')
      .find((candidate) => within(candidate).queryByText('Капучино'));
    expect(row).toBeTruthy();
    if (!row) throw new Error('Expected Cappuccino table row.');
    await user.click(within(row).getByRole('button', { name: 'Изменить' }));
    const name = screen.getByRole('textbox', { name: /Название/ });
    await user.clear(name);
    await user.type(name, 'Капучино классический');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const snapshot = await testRepositories.loadSnapshot(projectId);
      expect(snapshot.menuItems.find((item) => item.id === existing?.id)?.name).toBe(
        'Капучино классический',
      );
    });
    const after = await testRepositories.loadSnapshot(projectId);
    const updated = after.menuItems.find((item) => item.id === existing?.id);
    expect(updated).toMatchObject({
      description: existing?.description,
      sku: existing?.sku,
      barcode: existing?.barcode,
      locationAvailability: existing?.locationAvailability,
      recipeId: existing?.recipeId,
      modifierGroupIds: existing?.modifierGroupIds,
      status: existing?.status,
    });
  });
});

describe('automatic menu item SKU', () => {
  it('generates the first free deterministic internal SKU', () => {
    expect(generateMenuItemSku(['SALE-CAPPUCCINO', 'MENU-0001', 'menu-0002'])).toBe(
      'MENU-0003',
    );
  });
});

describe('Coffee menu category owner form', () => {
  it('shows readable location selection only when several locations exist', async () => {
    await testRepositories.coffeeProject.initialize(projectId, 'Тестовая кофейня');
    await testRepositories.developmentSeed.apply(
      projectId,
      createCoffeeCrashTestSeed(timestamp),
    );
    renderResource('menuCategories', projectId, 'Тестовая кофейня');
    const user = userEvent.setup();

    await screen.findByRole('heading', { name: 'Категории меню' });
    await user.click(screen.getByRole('button', { name: 'Создать категорию' }));

    expect(screen.getByRole('textbox', { name: /Название/ })).toBeTruthy();
    expect(
      screen.getByRole('spinbutton', { name: /Порядок отображения/ }),
    ).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Доступность по локациям' })).toBeTruthy();
    expect(
      screen.getByRole('checkbox', {
        name: 'Север Coffee Lab — основная кофейня',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('checkbox', { name: 'Производственная зона' }),
    ).toBeTruthy();
    expect(screen.queryByText('crash-location-main')).toBeNull();
    expect(screen.queryByLabelText('Описание')).toBeNull();
    expect(screen.queryByText('Изображение')).toBeNull();

    const status = screen.getByRole('combobox', { name: 'Статус' });
    expect(within(status).getByRole('option', { name: 'Активна' })).toBeTruthy();
    expect(within(status).getByRole('option', { name: 'Неактивна' })).toBeTruthy();

    await user.type(screen.getByRole('textbox', { name: /Название/ }), 'Завтраки');
    await user.click(
      screen.getByRole('checkbox', {
        name: 'Север Coffee Lab — основная кофейня',
      }),
    );
    await user.click(screen.getByRole('checkbox', { name: 'Производственная зона' }));
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const snapshot = await testRepositories.loadSnapshot(projectId);
      expect(
        snapshot.menuCategories.find((category) => category.name === 'Завтраки')
          ?.locationAvailability,
      ).toBe('crash-location-main,crash-location-production');
    });
  });

  it('hides and automatically assigns the only location', async () => {
    const singleLocationProjectId = 'single-location-category-form-test';
    await testRepositories.coffeeProject.initialize(
      singleLocationProjectId,
      'Одна кофейня',
    );
    await testRepositories.locations.create(singleLocationProjectId, {
      name: 'Единственная кофейня',
      code: 'ONLY',
      locationType: 'coffee-shop',
      address: 'Москва',
      timezone: 'Europe/Moscow',
      currency: 'RUB',
      phone: '',
      email: '',
      openingHours: '08:00–22:00',
      isDefault: true,
      status: 'active',
    });
    renderResource('menuCategories', singleLocationProjectId, 'Одна кофейня');
    const user = userEvent.setup();

    await screen.findByRole('heading', { name: 'Категории меню' });
    await user.click(screen.getAllByRole('button', { name: 'Создать категорию' })[0]!);
    expect(screen.queryByRole('group', { name: 'Доступность по локациям' })).toBeNull();

    await user.type(screen.getByRole('textbox', { name: /Название/ }), 'Выпечка');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const snapshot = await testRepositories.loadSnapshot(singleLocationProjectId);
      expect(snapshot.menuCategories[0]?.locationAvailability).toBe(
        snapshot.locations[0]?.id,
      );
    });
  });

  it('migrates a hidden legacy category image while preserving other hidden data', async () => {
    await testRepositories.coffeeProject.initialize(projectId, 'Тестовая кофейня');
    await testRepositories.developmentSeed.apply(
      projectId,
      createCoffeeCrashTestSeed(timestamp),
    );
    const before = await testRepositories.loadSnapshot(projectId);
    const category = before.menuCategories[0];
    expect(category).toBeTruthy();
    if (!category) throw new Error('Expected seeded menu category.');
    const coffeeStorageKey = `barakasb.mock.coffee.project.v1.${encodeURIComponent(
      projectId,
    )}`;
    const rawSnapshot = JSON.parse(
      window.localStorage.getItem(coffeeStorageKey) ?? '{}',
    ) as {
      menuCategories: Array<Record<string, unknown>>;
    };
    const rawCategory = rawSnapshot.menuCategories.find(
      (item) => item.id === category.id,
    );
    if (!rawCategory) throw new Error('Expected raw seeded category.');
    rawCategory.description = 'Скрытое описание';
    rawCategory.imagePlaceholder = 'data:image/png;base64,cHJlc2VydmU=';
    delete rawCategory.imageAssetId;
    window.localStorage.setItem(coffeeStorageKey, JSON.stringify(rawSnapshot));

    renderResource('menuCategories', projectId, 'Тестовая кофейня');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Категории меню' });
    const row = screen
      .getAllByRole('row')
      .find((candidate) => within(candidate).queryByText(category.name));
    expect(row).toBeTruthy();
    if (!row) throw new Error('Expected seeded category row.');
    await user.click(within(row).getByRole('button', { name: 'Изменить' }));
    const name = screen.getByRole('textbox', { name: /Название/ });
    await user.clear(name);
    await user.type(name, 'Кофе и классика');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const snapshot = await testRepositories.loadSnapshot(projectId);
      expect(
        snapshot.menuCategories.find((item) => item.id === category.id),
      ).toMatchObject({
        name: 'Кофе и классика',
        description: 'Скрытое описание',
        locationAvailability: category.locationAvailability,
      });
    });
    const migrated = await testRepositories.loadSnapshot(projectId);
    expect(
      migrated.menuCategories.find((item) => item.id === category.id)?.imageAssetId,
    ).toMatch(/^media-legacy-/u);
    expect(window.localStorage.getItem(coffeeStorageKey)).not.toContain('data:image');
  });
});
