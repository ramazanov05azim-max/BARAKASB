'use client';

import { defaultLocale, isLocale, type Locale } from './config';

export const userLocalePreferenceStorageKey = 'barakasb.mock.user.preferences.v1';
const listeners = new Set<() => void>();

interface UserPreferences {
  locale: Locale;
}

export const userLocalePreference = {
  read(): Locale {
    if (typeof window === 'undefined') return defaultLocale;

    try {
      const stored = window.localStorage.getItem(userLocalePreferenceStorageKey);
      if (!stored) return defaultLocale;
      const preferences = JSON.parse(stored) as Partial<UserPreferences>;
      return isLocale(preferences.locale) ? preferences.locale : defaultLocale;
    } catch {
      return defaultLocale;
    }
  },

  write(locale: Locale): void {
    if (typeof window === 'undefined') return;
    const preferences: UserPreferences = { locale };
    window.localStorage.setItem(
      userLocalePreferenceStorageKey,
      JSON.stringify(preferences),
    );
    listeners.forEach((listener) => listener());
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === userLocalePreferenceStorageKey) listener();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  },
};
