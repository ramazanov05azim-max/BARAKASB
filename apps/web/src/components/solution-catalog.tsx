'use client';

import { ArrowRight, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/i18n/i18n-provider';
import { mockRepository, type SolutionSummary } from '@/lib/mock-repository';
import { PageHeading } from './page-heading';
import { Badge } from './ui/badge';
import { buttonVariants } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

export function SolutionCatalog() {
  const { t } = useTranslation();
  const [solutions, setSolutions] = useState<SolutionSummary[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void mockRepository.listSolutions().then(setSolutions);
  }, []);

  const visible = useMemo(
    () =>
      solutions?.filter((solution) =>
        `${t(solution.nameKey)} ${t(solution.categoryKey)}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ) ?? [],
    [solutions, query, t],
  );

  return (
    <>
      <PageHeading
        eyebrow={t('solutions.eyebrow')}
        title={t('solutions.title')}
        description={t('solutions.description')}
      />
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-10"
          placeholder={t('solutions.search')}
          aria-label={t('solutions.search')}
        />
      </div>
      {!solutions ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="skeleton h-80 rounded-[18px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((solution) => (
            <Card key={solution.id} className="overflow-hidden">
              <div className={cn('h-28 bg-gradient-to-br', solution.accent)} />
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      {t(solution.categoryKey)}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {t(solution.nameKey)}
                    </h2>
                  </div>
                  <Badge tone={solution.status === 'available' ? 'success' : 'neutral'}>
                    {solution.status === 'available'
                      ? t('common.available')
                      : t('common.comingSoon')}
                  </Badge>
                </div>
                <p className="mt-4 min-h-20 text-sm leading-6 text-[var(--text-secondary)]">
                  {t(solution.descriptionKey)}
                </p>
                {solution.status === 'available' ? (
                  <Link
                    href="/projects/new?category=food&solution=coffee"
                    className={cn(buttonVariants(), 'mt-6 w-full')}
                  >
                    {t('solutions.createCoffee')} <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className={cn(
                      buttonVariants({ variant: 'secondary' }),
                      'mt-6 w-full',
                    )}
                  >
                    {t('solutions.notAvailable')}
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
          {visible.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-12 text-center">
                <Sparkles className="mx-auto size-6 text-[var(--action)]" />
                <h2 className="mt-4 font-semibold">{t('solutions.noMatches')}</h2>
                <button
                  className="mt-3 text-sm font-semibold text-[var(--action)]"
                  onClick={() => setQuery('')}
                >
                  {t('solutions.clearSearch')}
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
