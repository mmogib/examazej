# Repository Guidelines

## Project Structure & Module Organization
- App code in `src/` with key folders:
  - `src/pages/` (route views), `src/components/` (UI + layout), `src/lib/` (core, utils, types), `src/hooks/`, `src/integrations/supabase/`.
- Static assets: `public/` (served at `/`) and `src/assets/` (bundled).
- Path alias: import from `@/*` (configured in `tsconfig` and `vite.config`).

## Build, Test, and Development Commands
- Install: `npm install` (or `bun install`).
- Develop: `npm run dev` → starts Vite on `http://localhost:8080`.
- Build: `npm run build` → outputs to `dist/`.
- Preview: `npm run preview` → serves the production build.
- Lint: `npm run lint` → runs ESLint.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Indentation: 2 spaces; keep semicolons; prefer named exports.
- Naming: Components `PascalCase` (e.g., `Header.tsx`), variables/functions `camelCase`, directories lowercase (e.g., `components`, `lib/utils`).
- Hooks start with `use*`; shared utilities live in `src/lib/utils` (e.g., `cn` helper).
- Styling: Tailwind CSS; prefer utility classes; keep classnames readable and merged with `cn`.
- Linting: ESLint config in `eslint.config.js` (React Hooks rules enabled).

## Testing Guidelines
- No automated test suite yet. Prefer adding Vitest + Testing Library.
- Convention (when added): colocate `*.test.ts(x)` next to sources or under `src/__tests__/`.
- Minimum: smoke-test locally via `npm run dev`; verify routes, Supabase auth flow, and critical UI paths.

## Commit & Pull Request Guidelines
- Commits: imperative mood, concise subject (<72 chars). Examples: `Add landing page`, `Fix token extraction`, `Refactor auth flow`.
- Include scope when helpful: `auth: fix session handling`.
- PRs: clear description, linked issues, testing steps, and screenshots/GIFs for UI changes. Ensure `npm run lint` passes.

## Security & Configuration Tips
- Env vars via Vite: `VITE_*` are publicly exposed. Keep secrets out of the repo; use only Supabase public anon keys locally.
- Local config: `.env` for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Consider committing a sanitized `.env.example`.
- Supabase assets live under `supabase/`; avoid committing service-role keys.

## Architecture Overview
- Routing in `src/App.tsx` with React Router.
- Data/auth via Supabase (`src/integrations/supabase`) and React Query for client data needs.
