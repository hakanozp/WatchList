# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, localhost:5173)
npm run build      # tsc -b && vite build  (type-check then bundle)
npm run lint       # ESLint
npm run preview    # Preview the production build locally
```

TypeScript errors will fail the build — always run `npm run build` to validate before deploying.

## Deploy (Netlify)

Build credits are exhausted on the free plan. Deploy the pre-built `dist/` folder directly:

```bash
npm run build
NETLIFY_AUTH_TOKEN=<token> netlify deploy --dir=dist --site=d9bd3047-262d-4ab5-9daf-41fa9b12771e
```

`--prod` flag is forbidden by the token; promote the draft to production via the Netlify API:

```bash
curl -X POST "https://api.netlify.com/api/v1/sites/d9bd3047-262d-4ab5-9daf-41fa9b12771e/deploys/<deploy_id>/restore" \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json"
```

## Environment Variables

Required in `.env.local` (not committed):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TMDB_API_KEY=
```

## Architecture

### Data flow

```
Supabase (PostgreSQL)
  └── useMediaItems.ts      board items (archived=false), full CRUD + archiveItem + moveItem
  └── useArchivedItems.ts   archive items (archived=true), unarchive + delete
       └── KanbanBoard.tsx  drag-and-drop board → KanbanColumn → MediaCard
       └── ArchivePage.tsx  table view of archived items
```

`App.tsx` gates everything behind auth (`AuthContext`), shows a spinner while the session loads, then renders either `LoginPage` or the main layout. The main layout has two tabs — **Board** and **Archive** — controlled by local `activeTab` state.

### Contexts

- **`AuthContext`** — wraps Supabase auth; `signUp` calls the `is_email_allowed` RPC before registering (whitelist check via `SECURITY DEFINER` function so the `allowed_users` table is never exposed to the client).
- **`LanguageContext`** — TR/EN toggle; `t(key: TranslationKey)` returns the current-language string. All UI text goes through `t()`. The active language is also used as `tmdb_lang` passed to TMDB API calls and genre resolution.

### i18n

All strings live in `src/lib/translations.ts` as a `const` object. `TranslationKey = keyof typeof translations.tr` provides compile-time safety — adding a key to one language without the other will cause a TypeScript error.

### TMDB integration

`src/lib/tmdb.ts` exports:
- `searchTMDB(query, lang)` — multi-search endpoint, filters to `movie | tv`
- `resolveGenres(genreIds, lang)` — fetches genre lists (movie + TV merged) with a per-language in-memory cache; returns a comma-separated string stored in `genres` column
- `posterUrl(path)` — prepends `https://image.tmdb.org/t/p/w300`

`useTMDB(query, lang, delay=400)` debounces the search query before calling `searchTMDB`.

### Drag-and-drop ordering

`moveItem(id, newStatus, newIndex)` does an **optimistic update first** (local state), then fires the Supabase update. `order_index` values are multiples of 10 (e.g. 10, 20, 30) so insertions don't require reindexing all rows.

### Supabase schema notes

- `media_items` table has RLS enabled; a `BEFORE INSERT` trigger auto-sets `user_id = auth.uid()`.
- `allowed_users` table is never accessible to the client — only the `is_email_allowed(TEXT) RETURNS BOOLEAN` function (SECURITY DEFINER, granted to `anon` and `authenticated`) is callable.
- `archived` (boolean, default false) + `archived_at` (timestamptz) columns control board vs. archive visibility. Filtering always uses `.eq('archived', false)` or `.eq('archived', true)`.

### PWA

`vite-plugin-pwa` generates the service worker. TMDB poster images use `CacheFirst` (7-day TTL, max 200 entries). Supabase API calls use `NetworkFirst` with a 5-second timeout fallback to cache.
