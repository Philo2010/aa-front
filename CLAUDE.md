# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Abyss Angel** — an FRC (FIRST Robotics Competition) scouting web app for Team 696. It handles match scouting, pit scouting, data analytics, and team administration during competitions.

## Commands

```bash
npm run dev        # Start dev server (proxies /api to localhost:8000)
npm run build      # Production build (static site)
npm run preview    # Preview production build
npm run openapi-ts # Regenerate API client from schima.json
```

No test or lint commands are configured.

## Architecture

**Stack**: SvelteKit (Svelte 5) + Vite + Tailwind CSS, deployed as a static site (`adapter-static`, SSR disabled).

**Backend**: All API calls are proxied to `http://localhost:8000/api` in dev. The TypeScript client in `src/lib/schema/` is auto-generated from `schima.json` using `@hey-api/openapi-ts` — do not edit those files manually.

**Routing**: SvelteKit file-based routing under `src/routes/`. Main sections:
- `/scout/*` — match scouting (assignments, queue, scouting page, MVP)
- `/pit/*` — pit scouting (insert, edit, view, assign)
- `/view/*` — analytics (search, graphs, averages) — admin only
- `/admin/*` — event setup, queue management, user management — admin only
- `/login` — authentication

**Auth**: Cookie-based via `js-cookie`. The `is_admin` cookie determines admin access. Protected routes call `checkadmin()` from `src/lib/checkadminship.ts` in `onMount` and redirect to `/notallowed` if not authorized.

**API Layer**: `src/lib/ApiRequest.svelte.ts` wraps API calls with Zod validation and returns a discriminated union: `{ type: 'success' | 'api_error' | 'validation_error' | 'network_error' }`. Use this wrapper rather than calling the generated SDK directly when you need validation.

**State**: Svelte 5 runes (`$state`, `$effect`, `$props`) for component state. `src/lib/store/users.svelte.ts` provides a manual subscription store for shared user data across components.

## Key Conventions

- **Svelte 5 runes** — use `$state`, `$effect`, `$props` (not Svelte 4 stores or `export let` for props)
- **Styling** — dark theme, `DM Mono` monospace font, Tailwind utilities. Layouts are narrow (max ~480–560px), designed for mobile use in loud gym environments
- **Alliance colors** — red/blue for alliances, green as primary, amber for status
- **Form handlers** return `{ message: string, worked: boolean }` tuples
- **Admin guards** — add `onMount(() => { if (!checkadmin()) goto('/notallowed') })` to any admin-only page
- When adding new API endpoints, update `schima.json` and re-run `npm run openapi-ts` rather than writing manual fetch calls
