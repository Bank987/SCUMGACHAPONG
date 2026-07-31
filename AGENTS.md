# Repository Guide

## Runtime Shape

- This is one package with two entrypoints: `server.ts` owns Express/Mongoose and mounts Vite as development middleware; `src/main.tsx` starts the React SPA. Use `npm run dev` for the integrated app on fixed port `3000`; running Vite alone omits the API that the startup loader requires at `/api/health`.
- In production, `server.ts` serves the prebuilt `dist/` only when `NODE_ENV=production`. `npm run build` runs only `vite build`; it does not build or validate the server separately.
- API modules live under `server/routes/` and mount at `/api/auth`, `/api/cases`, `/api/spin`, `/api/admin`, and `/api/settings`. Mongoose schemas in `server/models/` are the persistence contract.
- Client API calls should remain rooted at `/api`. `src/main.tsx` globally prefixes those fetches with `VITE_API_URL`, includes cookies, and attaches the local-storage bearer token. Local integrated development normally leaves `VITE_API_URL` unset.

## Setup And Verification

- Use `npm install` with the committed `package-lock.json` before `npm run dev`, `npm run lint`, or `npm run build`.
- `npm run lint` is only `tsc --noEmit`; there is no ESLint configuration and no test suite. For ordinary changes, run `npm run lint` and `npm run build`.
- `npm run seed` requires `MONGODB_URI` and is destructive: it deletes every `Case` document before inserting the hard-coded fixtures from `seed.ts`.
- Do not run `restore.ts`: it changes global Git safe-directory configuration and executes `git checkout .` for a deployment-specific `/app/applet` checkout.

## Environment And Deployment

- `.env` is loaded by both `server.ts` and `seed.ts`. Database-backed behavior requires `MONGODB_URI`; without it the process stays up, but cases are empty and most model-backed routes cannot provide useful behavior.
- Discord OAuth requires `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`. Its callback origin is hard-coded to `https://land-roleplay.shop`, so a normal localhost OAuth flow will not round-trip locally.
- Set `JWT_SECRET` consistently: auth and spin routes sign/verify the same token. `ADMIN_PIN` protects all `/api/admin/*` routes through the `x-admin-pin` header. `WEBHOOK_GACHA_URL` receives every spin report; `WEBHOOK_PUBLIC_URL` receives only Legendary/Mythic and guaranteed drops. Optional `WEBHOOK_ADMIN_URL` and `WEBHOOK_UPGRADE_URL` select the other Discord webhook targets.
- `vercel.json` hosts the SPA separately: it proxies `/api/*` to the Render backend, then rewrites all other routes to `index.html`. Preserve this ordering when changing deployment routes.

## Behavioral Constraints

- Spin and upgrade operations enforce database timestamp locks tied to animation durations. Refreshing or repeating requests while locked increments cheat warnings and can auto-ban users; do not shorten or bypass one side without coordinating the client animation and server lock logic.
- Server-side random outcomes and atomic balance/item updates in `server/routes/spin.ts` are anti-cheat boundaries. Keep outcome selection and authoritative mutations on the server.
- Gacha guarantee progress is stored per user and case in `User.pityCounters`; the server increments it with the atomic spin deduction and resets it only when the configured guaranteed Mythic is awarded.
- Use the `@/` alias only for `src/`; server imports are relative and use `.js` specifiers even though their source files are TypeScript, matching the ESM/`tsx` setup.
- `dist/` is generated Vite output. Make source changes under `src/` and regenerate with `npm run build` rather than editing bundles directly.
