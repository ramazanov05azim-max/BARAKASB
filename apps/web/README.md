# Web application boundary

Next.js App Router composition root for the BARAKASB platform frontend.

It implements the Phase 5 platform prototype: public and authentication screens, Project
discovery and creation, Solution catalog, an empty Project Dashboard, profile,
subscription, Platform Settings, responsive navigation, and safe system states.

All data and authentication behavior comes from the typed mock repository. No backend or
Coffee business module is connected. Business pages remain owned by future Solution
packages.

```text
src/
├── app/          # App Router pages and layouts
├── components/   # Reusable platform and shadcn-style UI components
├── i18n/         # Locale resources, typed translation API, and user preference adapter
└── lib/          # Typed mock repository and utilities
```

Russian is the default locale and English is the second supported locale. Components
consume typed translation keys through `useTranslation`; they do not own display copy.
To add a locale, add its resource map and register the locale in `src/i18n/config.ts`.
The selected locale is stored through the user-preference adapter and applies across
every Project surface.

Run locally with `pnpm --dir apps/web dev`.
