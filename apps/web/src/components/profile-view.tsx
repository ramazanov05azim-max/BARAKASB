'use client';

import { Check, Laptop, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from './language-switcher';
import { PageHeading } from './page-heading';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTranslation } from '@/i18n/i18n-provider';

export function ProfileView() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(() => t('profile.mockName'));

  return (
    <>
      <PageHeading
        eyebrow={t('common.account')}
        title={t('profile.title')}
        description={t('profile.description')}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_.85fr]">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">{t('profile.section')}</h2>
            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim().length < 2) return;
                setSaved(true);
                setTimeout(() => setSaved(false), 2200);
              }}
            >
              <div>
                <Label htmlFor="profileName">{t('common.fullName')}</Label>
                <Input
                  id="profileName"
                  className="mt-2"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                {name.trim().length < 2 && (
                  <p className="mt-1.5 text-xs text-[var(--danger)]">
                    {t('validation.nameMinTwo')}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="profileEmail">{t('common.email')}</Label>
                <Input
                  id="profileEmail"
                  className="mt-2"
                  type="email"
                  value={t('profile.mockEmail')}
                  disabled
                />
                <p className="mt-1.5 text-xs text-[var(--muted)]">
                  {t('profile.emailHint')}
                </p>
              </div>
              <div>
                <Label htmlFor="theme">{t('profile.appearance')}</Label>
                <select
                  id="theme"
                  className="mt-2 h-12 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-sm shadow-[var(--shadow-control)] outline-none focus:border-[var(--action)] focus:ring-4 focus:ring-[var(--focus-soft)]"
                >
                  <option>{t('profile.systemTheme')}</option>
                  <option>{t('profile.lightTheme')}</option>
                  <option>{t('profile.darkTheme')}</option>
                </select>
              </div>
              <div>
                <Label>{t('profile.language')}</Label>
                <div className="mt-2 flex items-center justify-between gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--subtle)] p-4">
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    {t('profile.languageHint')}
                  </p>
                  <LanguageSwitcher className="shrink-0" />
                </div>
              </div>
              <Button type="submit" disabled={name.trim().length < 2}>
                {saved ? (
                  <>
                    <Check className="size-4" /> {t('common.saved')}
                  </>
                ) : (
                  t('profile.save')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">{t('profile.security')}</h2>
                  <p className="text-xs text-[var(--muted)]">
                    {t('profile.prototypeAccount')}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-5">
                <div>
                  <p className="text-sm font-semibold">{t('profile.twoStep')}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {t('profile.requiredProduction')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.alert(t('profile.securityFuture'))}
                >
                  {t('profile.review')}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="font-semibold">{t('profile.sessions')}</h2>
              <div className="mt-5 flex gap-3">
                <Laptop className="mt-0.5 size-5 text-[var(--muted)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t('profile.thisBrowser')}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {t('profile.activeNow')}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {t('profile.current')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
