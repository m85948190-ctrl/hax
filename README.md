# HAxBRO AI

**Your AI. Three Modes. One Ecosystem.**

HAxBRO AI (Hacks Bro AI) is an independent AI workspace created by Mainak. This repository contains the web interface, API routes, KAI 51 orchestration, App Maker workflows, knowledge/search services, database migrations, and the OpenMontage source snapshot.

## Deploying on Vercel

1. Import this repository: https://github.com/m85948190-ctrl/hax
2. Select the `main` branch.
3. Set the project root to the repository root.
4. Configure the environment variables and external services required by the backend before expecting API features to work.
5. Deploy, then test the landing page, `/app/`, health endpoint, chat, App Maker, and publishing flows.

## Important deployment note

This repository was originally structured for a managed hosting runtime. The Hatchable marketing/manifest files are being removed, but the backend still needs a Vercel-compatible audit of runtime imports, database access, environment variables, and route/build configuration before a deployment can be considered production-ready. Do not paste secret values into source files or commit them.

## Project structure

- `public/` — landing page, app UI, styles, browser-side KAI assets
- `api/` — server-side API routes
- `lib/` — KAI orchestration, knowledge, App Maker and OpenMontage bridges
- `pages/` — published app and content routes
- `migrations/` — database schema changes
- `vendor/OpenMontage/` — vendored OpenMontage source; review its AGPL-3.0 license and comply with its obligations if distributing/hosting derived functionality

The Hatchable-hosted site is not changed by this repository cleanup.
