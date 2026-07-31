'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Coffee,
  Command,
  CookingPot,
  FileBarChart,
  Gauge,
  LayoutGrid,
  LockKeyhole,
  Menu,
  PackageOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Users,
  Warehouse,
  Wheat,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CoffeeCapability, CoffeeLocale } from './domain';
import {
  CoffeeI18nProvider,
  type CoffeeTranslationKey,
  useCoffeeTranslation,
} from './i18n';
import type { CoffeeManagerRepositories } from './repository-contracts';
import { CoffeeWorkspaceProvider, useCoffeeWorkspace } from './workspace-store';

type IconComponent = typeof Gauge;

interface NavigationItem {
  key: CoffeeTranslationKey;
  suffix: string;
  icon: IconComponent;
  capability?: CoffeeCapability;
}

interface NavigationGroup {
  key?: CoffeeTranslationKey;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    items: [
      { key: 'nav.overview', suffix: '', icon: Gauge },
      { key: 'nav.setup', suffix: '/setup', icon: ClipboardCheck },
    ],
  },
  {
    key: 'nav.menu',
    items: [
      { key: 'nav.menuOverview', suffix: '/menu', icon: LayoutGrid },
      {
        key: 'nav.categories',
        suffix: '/menu/categories',
        icon: Boxes,
        capability: 'menu.read',
      },
      {
        key: 'nav.items',
        suffix: '/menu/items',
        icon: Coffee,
        capability: 'menu.read',
      },
      {
        key: 'nav.modifiers',
        suffix: '/menu/modifiers',
        icon: Plus,
        capability: 'menu.read',
      },
    ],
  },
  {
    items: [
      {
        key: 'nav.recipes',
        suffix: '/recipes',
        icon: CookingPot,
        capability: 'recipes.read',
      },
    ],
  },
  {
    key: 'nav.inventory',
    items: [
      { key: 'nav.inventory', suffix: '/inventory', icon: Warehouse },
      {
        key: 'nav.ingredients',
        suffix: '/inventory/ingredients',
        icon: Wheat,
        capability: 'inventory.read',
      },
      {
        key: 'nav.units',
        suffix: '/inventory/units',
        icon: PackageOpen,
        capability: 'inventory.read',
      },
      {
        key: 'nav.warehouses',
        suffix: '/inventory/warehouses',
        icon: Store,
        capability: 'inventory.read',
      },
    ],
  },
  {
    items: [
      {
        key: 'nav.suppliers',
        suffix: '/suppliers',
        icon: BriefcaseBusiness,
        capability: 'suppliers.read',
      },
      {
        key: 'nav.employees',
        suffix: '/employees',
        icon: Users,
        capability: 'employees.read',
      },
      {
        key: 'nav.roles',
        suffix: '/employees/roles',
        icon: ShieldCheck,
        capability: 'roles.read',
      },
      {
        key: 'nav.permissions',
        suffix: '/employees/permissions',
        icon: LockKeyhole,
        capability: 'roles.read',
      },
      {
        key: 'nav.workstations',
        suffix: '/workstations',
        icon: Building2,
        capability: 'workstations.read',
      },
      {
        key: 'nav.reports',
        suffix: '/reports',
        icon: FileBarChart,
        capability: 'reports.read',
      },
      {
        key: 'nav.settings',
        suffix: '/settings',
        icon: Settings,
        capability: 'settings.manage',
      },
    ],
  },
];

const quickActions: Array<Pick<NavigationItem, 'key' | 'suffix' | 'icon'>> = [
  { key: 'quick.addLocation', suffix: '/setup/locations', icon: Building2 },
  { key: 'quick.addMenuItem', suffix: '/menu/items', icon: Coffee },
  { key: 'quick.addIngredient', suffix: '/inventory/ingredients', icon: Wheat },
  { key: 'quick.inviteEmployee', suffix: '/employees', icon: Users },
];

export function CoffeeProjectEnvironment({
  projectId,
  projectName,
  locale,
  projects,
  languageControl,
  repositories,
  children,
}: {
  projectId: string;
  projectName: string;
  locale: CoffeeLocale;
  projects: Array<{ id: string; name: string }>;
  languageControl: ReactNode;
  repositories?: CoffeeManagerRepositories;
  children: ReactNode;
}) {
  return (
    <CoffeeI18nProvider locale={locale}>
      <CoffeeWorkspaceProvider
        projectId={projectId}
        projectName={projectName}
        {...(repositories ? { repositories } : {})}
      >
        <CoffeeShell languageControl={languageControl} projects={projects}>
          {children}
        </CoffeeShell>
      </CoffeeWorkspaceProvider>
    </CoffeeI18nProvider>
  );
}

function CoffeeShell({
  languageControl,
  projects,
  children,
}: {
  languageControl: ReactNode;
  projects: Array<{ id: string; name: string }>;
  children: ReactNode;
}) {
  const { t } = useCoffeeTranslation();
  const {
    projectId,
    snapshot,
    loading,
    feedbackKey,
    clearFeedback,
    can,
    setDefaultLocation,
    setPreviewRole,
  } = useCoffeeWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const base = `/projects/${projectId}/coffee`;

  const visibleGroups = useMemo(
    () =>
      navigationGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.capability || can(item.capability)),
      })),
    [can],
  );

  const searchItems = useMemo(
    () =>
      visibleGroups
        .flatMap((group) => group.items)
        .filter((item) =>
          t(item.key).toLowerCase().includes(searchQuery.toLowerCase().trim()),
        ),
    [searchQuery, t, visibleGroups],
  );

  const currentItem = navigationGroups
    .flatMap((group) => group.items)
    .filter((item) => pathname === `${base}${item.suffix}`)
    .at(0);

  const completeCount =
    snapshot?.setupSteps.filter((step) => step.status === 'complete').length ?? 0;
  const totalSteps = snapshot?.setupSteps.length ?? 14;
  const progress = Math.round((completeCount / totalSteps) * 100);
  const selectedLocation =
    snapshot?.locations.find(
      (location) => location.id === snapshot.project.defaultLocationId,
    ) ?? snapshot?.locations.at(0);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <div className="relative min-h-dvh bg-transparent text-[var(--text)]">
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="floating-chrome flex h-16 items-center gap-2 rounded-[20px] px-3 sm:px-5 xl:pl-[272px]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-11 place-items-center rounded-xl transition hover:bg-[var(--action-soft)] xl:hidden"
            aria-label={t('nav.openNavigation')}
          >
            <Menu className="size-5" />
          </button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--action-soft)]">
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#3b82ff,var(--action))] text-white shadow-[0_8px_18px_rgb(23_105_255_/_22%)]">
                  <Coffee className="size-4" />
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm font-semibold">
                    {snapshot?.project.name ?? projectId}
                  </span>
                  <span className="block text-[11px] text-[var(--text-secondary)]">
                    {t('common.coffeeAdministration')}
                  </span>
                </span>
                <ChevronDown className="size-4 text-[var(--muted)]" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <MenuSurface align="start">
                <MenuLabel>{t('nav.projectSwitcher')}</MenuLabel>
                <DropdownMenu.Item asChild>
                  <Link href="/projects" className={menuItemClass}>
                    <LayoutGrid className="size-4" />
                    {t('nav.allProjects')}
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
                {projects.map((project) => (
                  <DropdownMenu.Item key={project.id} asChild>
                    <Link
                      href={`/projects/${project.id}/coffee`}
                      className={menuItemClass}
                    >
                      {project.id === projectId ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <span className="size-4" />
                      )}
                      {project.name}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </MenuSurface>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="hidden h-7 w-px bg-[var(--border)] md:block" />

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-[var(--action-soft)] md:flex">
                <Store className="size-4 text-[var(--muted)]" />
                <span className="max-w-36 truncate">
                  {selectedLocation?.name ?? t('nav.noLocations')}
                </span>
                <ChevronDown className="size-4 text-[var(--muted)]" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <MenuSurface align="start">
                <MenuLabel>{t('nav.locationSwitcher')}</MenuLabel>
                {snapshot?.locations.length ? (
                  snapshot.locations.map((location) => (
                    <DropdownMenu.Item
                      key={location.id}
                      className={menuItemClass}
                      onSelect={() => void setDefaultLocation(location.id)}
                    >
                      {location.id === selectedLocation?.id ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <span className="size-4" />
                      )}
                      {location.name}
                    </DropdownMenu.Item>
                  ))
                ) : (
                  <DropdownMenu.Item asChild>
                    <Link href={`${base}/setup/locations`} className={menuItemClass}>
                      <Plus className="size-4" />
                      {t('quick.addLocation')}
                    </Link>
                  </DropdownMenu.Item>
                )}
              </MenuSurface>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden min-h-10 min-w-64 items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--muted)] shadow-[var(--shadow-control)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-solid)] xl:flex"
            >
              <Search className="size-4" />
              <span>{t('nav.globalSearch')}</span>
              <kbd className="ml-auto rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px]">
                {t('common.commandShortcut')}
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-11 place-items-center rounded-xl transition hover:bg-[var(--action-soft)] xl:hidden"
              aria-label={t('nav.globalSearch')}
            >
              <Search className="size-5" />
            </button>
            {languageControl}
            <NotificationsMenu
              base={base}
              hasLocation={Boolean(snapshot?.locations.length)}
            />
            <QuickActionsMenu base={base} />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="ml-1 grid size-10 place-items-center rounded-full bg-[linear-gradient(145deg,#3b82ff,var(--action))] text-xs font-bold text-white shadow-[0_8px_20px_rgb(23_105_255_/_22%)]"
                  aria-label={t('nav.userMenu')}
                >
                  {t('common.userInitials')}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <MenuSurface align="end" className="w-72">
                  <MenuLabel>{t('nav.mockRole')}</MenuLabel>
                  <p className="px-2.5 pb-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {t('nav.mockRoleHelp')}
                  </p>
                  {snapshot?.roles.map((role) => (
                    <DropdownMenu.Item
                      key={role.id}
                      className={menuItemClass}
                      onSelect={() => void setPreviewRole(role.id)}
                    >
                      {role.id === snapshot.currentRoleId ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <span className="size-4" />
                      )}
                      {t(role.nameKey as CoffeeTranslationKey)}
                    </DropdownMenu.Item>
                  ))}
                  <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
                  <DropdownMenu.Item asChild>
                    <Link href="/profile" className={menuItemClass}>
                      {t('nav.platformProfile')}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/projects" className={menuItemClass}>
                      {t('nav.leaveProject')}
                    </Link>
                  </DropdownMenu.Item>
                </MenuSurface>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>

      <DesktopSidebar
        base={base}
        groups={visibleGroups}
        pathname={pathname}
        progress={progress}
        ready={snapshot?.project.ready ?? false}
      />

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
          <Dialog.Content className="floating-chrome fixed inset-y-3 left-3 z-[60] w-[min(88vw,340px)] overflow-y-auto rounded-[24px] p-5 text-[var(--text)]">
            <Dialog.Title className="sr-only">{t('nav.openNavigation')}</Dialog.Title>
            <div className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="soft-icon-tile grid size-9 place-items-center rounded-xl">
                  <Coffee className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{snapshot?.project.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('common.coffeeAdministration')}
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-xl hover:bg-[var(--action-soft)]"
                  aria-label={t('nav.closeNavigation')}
                >
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            <SidebarNavigation
              base={base}
              groups={visibleGroups}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="min-w-0 px-4 py-9 sm:px-7 lg:px-12 lg:py-12 xl:ml-64">
        <div className="mx-auto max-w-[1440px]">
          <nav
            aria-label={t('nav.breadcrumb')}
            className="mb-7 flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]"
          >
            <Link href={base} className="hover:text-[var(--action)]">
              {t('nav.coffeeHome')}
            </Link>
            {currentItem?.suffix ? (
              <>
                <ChevronRight className="size-3.5" />
                <span className="text-[var(--text)]">{t(currentItem.key)}</span>
              </>
            ) : null}
          </nav>

          {loading && !snapshot ? (
            <CoffeeLoadingState />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <AnimatePresence>
        {feedbackKey ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="floating-chrome fixed bottom-5 right-5 z-[80] flex max-w-sm items-center gap-3 rounded-[18px] border-emerald-200/80 px-4 py-3 text-sm font-semibold text-emerald-800"
            role="status"
          >
            <Check className="size-4" />
            <span>{t(feedbackKey)}</span>
            <button
              type="button"
              onClick={clearFeedback}
              className="ml-2 grid size-8 place-items-center rounded-lg hover:bg-[var(--action-soft)]"
              aria-label={t('common.close')}
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/35 backdrop-blur-sm" />
          <Dialog.Content className="floating-chrome fixed left-1/2 top-[12vh] z-[80] w-[min(92vw,640px)] -translate-x-1/2 overflow-hidden rounded-[24px]">
            <Dialog.Title className="sr-only">{t('nav.globalSearch')}</Dialog.Title>
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-5">
              <Search className="size-5 text-[var(--muted)]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]"
              />
              <Command className="size-4 text-[var(--muted)]" />
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {searchItems.length ? (
                searchItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.suffix}
                      type="button"
                      onClick={() => {
                        router.push(`${base}${item.suffix}`);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-medium hover:bg-[var(--action-soft)]"
                    >
                      <Icon className="size-4 text-[var(--muted)]" />
                      {t(item.key)}
                      <ChevronRight className="ml-auto size-4 text-[var(--muted)]" />
                    </button>
                  );
                })
              ) : (
                <p className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                  {t('nav.noSearchResults')}
                </p>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function DesktopSidebar({
  base,
  groups,
  pathname,
  progress,
  ready,
}: {
  base: string;
  groups: NavigationGroup[];
  pathname: string;
  progress: number;
  ready: boolean;
}) {
  const { t } = useCoffeeTranslation();
  return (
    <aside className="floating-chrome fixed inset-y-3 left-3 z-50 hidden w-[244px] overflow-y-auto rounded-[24px] px-4 pb-5 pt-4 text-[var(--text)] xl:block">
      <Link href={base} className="mb-8 flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-xl border border-blue-400/20 bg-[linear-gradient(145deg,#3b82ff,var(--action))] text-[10px] font-extrabold tracking-[-0.08em] text-white shadow-[0_10px_24px_rgb(23_105_255_/_24%)]">
          {t('common.brandMark')}
        </span>
        <div>
          <span className="block text-sm font-semibold">{t('common.brandName')}</span>
          <span className="block text-xs text-[var(--text-secondary)]">
            {t('common.coffeeAdministration')}
          </span>
        </div>
      </Link>
      <SidebarNavigation base={base} groups={groups} pathname={pathname} />
      <div className="mt-7 rounded-[18px] border border-blue-100/80 bg-[linear-gradient(145deg,rgb(239_245_255_/_92%),rgb(255_255_255_/_72%))] p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_80%)]">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>{t('header.setupProgress')}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--action),#7ca4ff)] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {ready ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <CircleAlert className="size-3.5 text-amber-600" />
          )}
          {t(ready ? 'header.readyForOperations' : 'header.notReady')}
        </p>
      </div>
    </aside>
  );
}

function SidebarNavigation({
  base,
  groups,
  pathname,
  onNavigate,
}: {
  base: string;
  groups: NavigationGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useCoffeeTranslation();
  return (
    <nav className="space-y-5">
      {groups.map((group, groupIndex) => (
        <div key={group.key ?? `group-${groupIndex}`}>
          {group.key ? (
            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.15em] text-[var(--muted)] uppercase">
              {t(group.key)}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const href = `${base}${item.suffix}`;
              const active =
                pathname === href ||
                (item.suffix !== '' && pathname.startsWith(`${href}/`));
              const Icon = item.icon;
              return (
                <Link
                  key={item.suffix}
                  href={href}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                  className={`flex min-h-10 items-center gap-3 rounded-[13px] border px-3 text-[13px] font-medium transition ${
                    active
                      ? 'border-blue-200/70 bg-[var(--action-soft)] text-[var(--action)] shadow-[inset_0_1px_0_rgb(255_255_255_/_75%)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="size-4" />
                  {t(item.key)}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function NotificationsMenu({
  base,
  hasLocation,
}: {
  base: string;
  hasLocation: boolean;
}) {
  const { t } = useCoffeeTranslation();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="relative grid size-11 place-items-center rounded-xl hover:bg-[var(--action-soft)]"
          aria-label={t('nav.notifications')}
        >
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-[var(--action)]" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <MenuSurface align="end" className="w-[min(92vw,380px)]">
          <div className="px-3 pb-2 pt-1">
            <p className="font-semibold">{t('notifications.title')}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {t('notifications.previewLabel')}
            </p>
          </div>
          <NotificationItem
            href={`${base}/setup`}
            title={t('notifications.incompleteSetup')}
            text={t('notifications.incompleteSetupText')}
          />
          {!hasLocation ? (
            <NotificationItem
              href={`${base}/setup/locations`}
              title={t('notifications.noLocation')}
              text={t('notifications.noLocationText')}
            />
          ) : null}
          <NotificationItem
            title={t('notifications.noLiveEvents')}
            text={t('notifications.noLiveEventsText')}
          />
        </MenuSurface>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function NotificationItem({
  href,
  title,
  text,
}: {
  href?: string;
  title: string;
  text: string;
}) {
  const content = (
    <div className="flex gap-3 rounded-[14px] px-3 py-3 hover:bg-[var(--action-soft)]">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{text}</p>
      </div>
    </div>
  );
  return href ? (
    <DropdownMenu.Item asChild>
      <Link href={href} className="outline-none">
        {content}
      </Link>
    </DropdownMenu.Item>
  ) : (
    <div>{content}</div>
  );
}

function QuickActionsMenu({ base }: { base: string }) {
  const { t } = useCoffeeTranslation();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl hover:bg-[var(--action-soft)]"
          aria-label={t('nav.quickActions')}
        >
          <Plus className="size-5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <MenuSurface align="end">
          <MenuLabel>{t('nav.quickActions')}</MenuLabel>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenu.Item key={action.suffix} asChild>
                <Link href={`${base}${action.suffix}`} className={menuItemClass}>
                  <Icon className="size-4" />
                  {t(action.key)}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </MenuSurface>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function CoffeeLoadingState() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-28 rounded-[var(--radius-card)]" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="skeleton h-64 rounded-[var(--radius-card)] lg:col-span-2" />
        <div className="skeleton h-64 rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}

function MenuSurface({
  children,
  align,
  className = '',
}: {
  children: ReactNode;
  align: 'start' | 'end';
  className?: string;
}) {
  return (
    <DropdownMenu.Content
      align={align}
      sideOffset={8}
      className={`floating-chrome z-[90] min-w-60 rounded-[18px] p-1.5 text-[var(--text)] outline-none ${className}`}
    >
      {children}
    </DropdownMenu.Content>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu.Label className="px-2.5 py-2 text-xs font-semibold text-[var(--text-secondary)]">
      {children}
    </DropdownMenu.Label>
  );
}

const menuItemClass =
  'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[13px] px-2.5 py-2 text-sm outline-none hover:bg-[var(--action-soft)] focus:bg-[var(--action-soft)]';
