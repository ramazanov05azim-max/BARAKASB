'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Bell,
  ChevronDown,
  Command,
  CreditCard,
  Grid2X2,
  Menu,
  Plus,
  Search,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Brand } from './brand';
import { LanguageSwitcher } from './language-switcher';
import { Button, buttonVariants } from './ui/button';
import { useTranslation } from '@/i18n/i18n-provider';
import type { TranslationKey } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function PlatformShell({
  children,
  project,
}: {
  children: ReactNode;
  project?: { id: string; name?: string; nameKey?: TranslationKey };
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const accountItems = [
    { href: '/projects', label: t('nav.myProjects'), icon: Grid2X2 },
    { href: '/solutions', label: t('nav.solutions'), icon: Plus },
    { href: '/subscriptions', label: t('nav.subscriptions'), icon: CreditCard },
    { href: '/profile', label: t('nav.profile'), icon: UserRound },
  ];

  const projectItems = project
    ? [
        {
          href: `/projects/${project.id}`,
          label: t('nav.dashboard'),
          icon: Grid2X2,
        },
        {
          href: `/projects/${project.id}/admin/subscription`,
          label: t('nav.subscription'),
          icon: CreditCard,
        },
      ]
    : accountItems;

  return (
    <div className="min-h-dvh bg-transparent">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="floating-chrome mx-auto flex h-16 max-w-[1536px] items-center gap-3 rounded-[20px] px-3 sm:px-5">
          <Button
            variant="quiet"
            size="icon"
            className="xl:hidden"
            aria-label={t('nav.openNavigation')}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <Brand className="mr-2" />
          <div className="hidden h-6 w-px bg-[var(--border)] sm:block" />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="hidden min-h-10 items-center gap-2 rounded-[12px] px-3 text-sm font-semibold transition hover:bg-[var(--action-soft)] sm:flex">
                <span>
                  {project
                    ? (project.name ?? t(project.nameKey ?? 'common.newProject'))
                    : t('nav.allProjects')}
                </span>
                <ChevronDown className="size-4 text-[var(--muted)]" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                className="floating-chrome z-50 min-w-56 rounded-[18px] p-1.5"
              >
                <DropdownMenu.Label className="px-2.5 py-2 text-xs font-semibold text-[var(--muted)]">
                  {t('nav.projectContext')}
                </DropdownMenu.Label>
                <DropdownMenu.Item asChild>
                  <Link
                    href="/projects"
                    className="block cursor-pointer rounded-xl px-2.5 py-2 text-sm outline-none hover:bg-[var(--action-soft)]"
                  >
                    {t('nav.allProjects')}
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
                <DropdownMenu.Item asChild>
                  <Link
                    href="/projects/new"
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-sm outline-none hover:bg-[var(--action-soft)]"
                  >
                    <Plus className="size-4" /> {t('nav.createProject')}
                  </Link>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden min-h-10 min-w-52 items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--muted)] shadow-[var(--shadow-control)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-solid)] xl:flex"
            >
              <Search className="size-4" />
              <span>{t('nav.searchOrJump')}</span>
              <kbd className="ml-auto rounded border border-[var(--border)] px-1.5 text-[11px]">
                {t('common.commandShortcut')}
              </kbd>
            </button>
            <LanguageSwitcher compact />
            <button
              type="button"
              className={buttonVariants({ variant: 'quiet', size: 'icon' })}
              aria-label={t('nav.notifications')}
              onClick={() => window.alert(t('nav.notificationsFuture'))}
            >
              <Bell className="size-5" />
            </button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="ml-1 grid size-10 place-items-center rounded-full bg-[linear-gradient(145deg,#3b82ff,var(--action))] text-xs font-bold text-white shadow-[0_8px_20px_rgb(23_105_255_/_22%)]">
                  {t('common.userInitials')}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="floating-chrome z-50 min-w-48 rounded-[18px] p-1.5"
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/profile"
                      className="block rounded-xl px-3 py-2 text-sm outline-none hover:bg-[var(--action-soft)]"
                    >
                      {t('nav.profileSecurity')}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/platform"
                      className="block rounded-xl px-3 py-2 text-sm outline-none hover:bg-[var(--action-soft)]"
                    >
                      {t('nav.platformSettings')}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/login"
                      className="block rounded-xl px-3 py-2 text-sm outline-none hover:bg-[var(--action-soft)]"
                    >
                      {t('nav.signOut')}
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1536px]">
        <aside className="floating-chrome sticky top-24 my-4 ml-5 hidden h-[calc(100dvh-7rem)] w-64 shrink-0 rounded-[24px] p-4 xl:block">
          <Navigation items={projectItems} pathname={pathname} />
          <div className="absolute inset-x-4 bottom-4 rounded-[18px] border border-blue-100/80 bg-[linear-gradient(145deg,rgb(239_245_255_/_92%),rgb(255_255_255_/_72%))] p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_80%)]">
            <p className="text-xs font-semibold text-[var(--text)]">
              {t('nav.platformPrototype')}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              {t('nav.mockNoBackend')}
            </p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          {children}
        </main>
      </div>

      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
          <Dialog.Content className="floating-chrome fixed inset-y-3 left-3 z-50 w-[min(86vw,320px)] rounded-[24px] p-5">
            <div className="mb-8 flex items-center justify-between">
              <Brand />
              <Dialog.Close asChild>
                <Button
                  variant="quiet"
                  size="icon"
                  aria-label={t('nav.closeNavigation')}
                >
                  <X className="size-5" />
                </Button>
              </Dialog.Close>
            </div>
            <Navigation
              items={projectItems}
              pathname={pathname}
              onNavigate={() => setMenuOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={commandOpen} onOpenChange={setCommandOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
          <Dialog.Content className="floating-chrome fixed left-1/2 top-[16vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[24px] p-3">
            <Dialog.Title className="sr-only">{t('nav.commandTitle')}</Dialog.Title>
            <div className="flex items-center gap-3 px-2">
              <Command className="size-5 text-[var(--muted)]" />
              <input
                autoFocus
                aria-label={t('nav.searchCommands')}
                placeholder={t('nav.commandPlaceholder')}
                className="h-12 flex-1 bg-transparent text-[15px] outline-none"
              />
              <Dialog.Close className="text-xs text-[var(--muted)]">
                {t('common.escape')}
              </Dialog.Close>
            </div>
            <div className="border-t border-[var(--border)] pt-2">
              {[
                ...accountItems,
                { href: '/projects/new', label: t('nav.createProject'), icon: Plus },
              ].map((item) => (
                <Dialog.Close asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm hover:bg-[var(--action-soft)]"
                  >
                    <item.icon className="size-4 text-[var(--muted)]" />
                    {item.label}
                  </Link>
                </Dialog.Close>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Navigation({
  items,
  pathname,
  onNavigate,
}: {
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('nav.primary')} className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-medium transition',
              active
                ? 'border border-blue-200/70 bg-[var(--action-soft)] text-[var(--action)] shadow-[inset_0_1px_0_rgb(255_255_255_/_75%)]'
                : 'border border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/platform"
        {...(onNavigate ? { onClick: onNavigate } : {})}
        className="mt-5 flex min-h-11 items-center gap-3 rounded-[14px] border border-transparent px-3 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface)]"
      >
        <Settings className="size-[18px]" />
        {t('nav.platformSettings')}
      </Link>
    </nav>
  );
}
