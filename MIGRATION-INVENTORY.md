# HAxBRO Hatchable-to-GitHub Migration Inventory

**Status: inventory only; migration is not complete.** This file is based on the current Hatchable project file listing for project `proj_cPoy7TbTYZPq` (version 1175) on 2026-10-14. It intentionally does not change the live frontend or disable existing routes.

## Snapshot
- Total files listed: 296
- API source files: 79
- Shared library files: 24
- Public frontend/static files: 157
- Registered deployed API functions reported by Hatchable: 96 (includes route aliases and framework-generated pages, so this is not necessarily a 1:1 count of API source files).

## Migration rule
GitHub becomes the source of truth for source code, tool implementations, tests, model assets/release references, and deployment workflows. The current public frontend stays at `https://haxbro.hatchable.site`. Do not switch the frontend API base until replacement endpoints are deployed and smoke-tested. Do not delete or disable current Hatchable functions before parity checks.

## Backend API source files
- `api/admin/stats.js`
- `api/admin69-auth.js`
- `api/agents/leader.js`
- `api/analytics.js`
- `api/app-builder.js`
- `api/app-continue.js`
- `api/app-data-miner.js`
- `api/app-download.js`
- `api/app-export.js`
- `api/app-maker.js`
- `api/app-publish.js`
- `api/appmaker-original-generate.js`
- `api/appmaker-original-publish.js`
- `api/art-generate.js`
- `api/art-status.js`
- `api/chat.js`
- `api/code-writer.js`
- `api/deepx.js`
- `api/events-token.js`
- `api/file-create.js`
- `api/file-download.js`
- `api/haxbro-creative.js`
- `api/haxbro-openmontage.js`
- `api/health.js`
- `api/kai-4567.js`
- `api/kai-699.js`
- `api/kai-78.js`
- `api/kai-9-art.js`
- `api/kai-90.js`
- `api/kai-lite.js`
- `api/kai-local-model.js`
- `api/kai-model.js`
- `api/kai-router.js`
- `api/kai-run.js`
- `api/kai-start.js`
- `api/kai-training-sync.js`
- `api/kai-worker.js`
- `api/kai/agent.js`
- `api/kai/app-intent.js`
- `api/kai/browser.js`
- `api/kai/builder-agent.js`
- `api/kai/ci.js`
- `api/kai/decoder.js`
- `api/kai/language.js`
- `api/kai/search.js`
- `api/kai/status.js`
- `api/kai/understanding.js`
- `api/kai56.js`
- `api/knowledge-sync.js`
- `api/knowledge/feed-stats.js`
- `api/knowledge/ingest.js`
- `api/knowledge/queue-batch.js`
- `api/knowledge/queue.js`
- `api/knowledge/search.js`
- `api/knowledge/stats.js`
- `api/marketing-validate.js`
- `api/mode.js`
- `api/model-status.js`
- `api/netlify/callback.js`
- `api/netlify/connect.js`
- `api/netlify/status.js`
- `api/plugin-run.js`
- `api/plugins.js`
- `api/pro/redeem.js`
- `api/public-deploy.js`
- `api/public-traffic.js`
- `api/publish.js`
- `api/recover-live-script.js`
- `api/roast-core.js`
- `api/script-runtime.js`
- `api/social/messages.js`
- `api/social/register.js`
- `api/social/threads.js`
- `api/social/users.js`
- `api/status.js`
- `api/supabase/bridge.js`
- `api/ultimax/normal.js`
- `api/web-check.js`
- `api/xpro-followup.js`

## Shared library files
- `lib/app-intent-intelligence.js`
- `lib/appmaker-agent.js`
- `lib/core.js`
- `lib/html.js`
- `lib/kai-ci.js`
- `lib/kai-control.js`
- `lib/kai-decoder.js`
- `lib/kai-judges.js`
- `lib/kai-knowledge.js`
- `lib/kai-native-builder.js`
- `lib/kai-native-test-mode.js`
- `lib/kai-training.js`
- `lib/kai.js`
- `lib/kai12.js`
- `lib/kai456.js`
- `lib/kai51-core.js`
- `lib/kai51-language.js`
- `lib/kai51-server-core.js`
- `lib/kai678.js`
- `lib/marketing-app.js`
- `lib/normal-ultimax-control.js`
- `lib/openmontage-bridge.js`
- `lib/openmontage-runner.js`
- `lib/ui-polish.js`

## Frontend/static files
- `public/admin-ultimax.css`
- `public/app-ads.txt`
- `public/app-maker-original/app.js`
- `public/app-maker-original/index.html`
- `public/app-maker-original/style.css`
- `public/app-maker-polish.css`
- `public/app/index.html`
- `public/art-generation.css`
- `public/art-generation.html`
- `public/art-generation.js`
- `public/assets/skeleton.glb`
- `public/calculator-app.js`
- `public/capability-rail.js`
- `public/chat-model-selector.css`
- `public/chatgpt-mobile-layout.css`
- `public/decoding-partner.js`
- `public/deepx.css`
- `public/deepx.js`
- `public/download/index.html`
- `public/encryptor-machine.js`
- `public/esp32/haxbro.ino`
- `public/events-loader.js`
- `public/favicon.svg`
- `public/final-product-shell.css`
- `public/future-command.css`
- `public/futuristic-polish.css`
- `public/google67af4bbae3ec73f9.html`
- `public/googlead1e1eb563cab084.html`
- `public/googlefcc03d781eb6e863.html`
- `public/ha-xpro-art-motion.css`
- `public/haxbro-app-maker-exact.css`
- `public/haxbro-app-maker-new.css`
- `public/haxbro-cinematic-intro.css`
- `public/haxbro-cinematic-intro.js`
- `public/haxbro-command-shortcuts.css`
- `public/haxbro-creative.css`
- `public/haxbro-creative.js`
- `public/haxbro-onboarding.css`
- `public/haxbro-onboarding.js`
- `public/haxbro-openmontage.js`
- `public/haxbro-professional-final.css`
- `public/haxbro-professional-v2.css`
- `public/haxbro-ui-ambient.mp4`
- `public/haxbro-v2-ui.css`
- `public/haxbro-visual-system.css`
- `public/icon-192.svg`
- `public/icon-512.svg`
- `public/index.html`
- `public/install.js`
- `public/kai-capability-bridge.js`
- `public/kai-forge-3d.js`
- `public/kai-future-world.css`
- `public/kai-image-worker.js`
- `public/kai-infinity-motion.css`
- `public/kai-lite.js`
- `public/kai-local-intelligence.js`
- `public/kai-local-model.js`
- `public/kai-local-ui.css`
- `public/kai-local-ui.js`
- `public/kai-normal-thinking.css`
- `public/kai-power-core.css`
- `public/kai-predictive-timer.js`
- `public/kai-visibility.js`
- `public/kai2-app-maker.css`
- `public/kai51-boot-stamp.js`
- `public/kai51-future-studio.css`
- `public/kai51-largest-engine.js`
- `public/kai51-largest-worker.js`
- `public/kai51-local-engine.js`
- `public/kai51-local.js`
- `public/kai51-model-sw.js`
- `public/kai51-runtime-indicator.css`
- `public/kai51-runtime-indicator.js`
- `public/kai51-voice-intelligence.css`
- `public/kai51-voice-intelligence.js`
- `public/kai69-secret.css`
- `public/kai69-secret.js`
- `public/kai69-ultimax.css`
- `public/kai69-ultimax.js`
- `public/kai9-art.css`
- `public/landing-3d.js`
- `public/landing-board.css`
- `public/landing-v2.css`
- `public/legacy-tools.js`
- `public/light-mode-final.css`
- `public/login.html`
- `public/logo-mark.css`
- `public/logo-symbol.svg`
- `public/logo-wordmark.svg`
- `public/marketing-counter.css`
- `public/marketing-counter.js`
- `public/matte-white.css`
- `public/mobile-composer-viewport.js`
- `public/mobile-final-polish.css`
- `public/mobile-send-size.css`
- `public/onboarding-appmaker.png`
- `public/onboarding-appmaker.svg`
- `public/onboarding-appmaker.webp`
- `public/onboarding-creation.png`
- `public/onboarding-creation.svg`
- `public/onboarding-creation.webp`
- `public/onboarding-ecosystem.jpg`
- `public/onboarding-ecosystem.svg`
- `public/onboarding-ecosystem.webp`
- `public/onboarding-kai.png`
- `public/onboarding-kai.svg`
- `public/onboarding-kai.webp`
- `public/premium-response-light.css`
- `public/premium-revolution.css`
- `public/privacy.html`
- `public/pro-mode.css`
- `public/pro-mode.js`
- `public/pro-response-light.css`
- `public/pro-revolution.css`
- `public/pro-workspace.css`
- `public/pro-workspace.js`
- `public/professional-overhaul.css`
- `public/professional-shell.css`
- `public/professional-shell.js`
- `public/responsive-fixes.css`
- `public/roast-mode.css`
- `public/roast-mode.js`
- `public/robots.txt`
- `public/script.js`
- `public/send-guard.js`
- `public/sidebar-final.css`
- `public/site.webmanifest`
- `public/sitemap.xml`
- `public/skeleton-video/index.html`
- `public/social-chat.css`
- `public/social-chat.js`
- `public/style.css`
- `public/sw.js`
- `public/terms.html`
- `public/theme-overhaul-final.css`
- `public/theme-responsive-fix.css`
- `public/tier-exit.css`
- `public/tier-exit.js`
- `public/tier-professional-polish.css`
- `public/trial.js`
- `public/ui-command-center-v2.css`
- `public/ui-command-center-v3.css`
- `public/ui-command-center.css`
- `public/ui-command-center.js`
- `public/ui-fixes.css`
- `public/ultimax-public.css`
- `public/username-login-future.css`
- `public/vendor/three.min.js`
- `public/work-canvas.js`
- `public/workspace-bridge.js`
- `public/workspace-overhaul.css`
- `public/workspace-overhaul.js`
- `public/xpro-appmaker-polish.css`
- `public/xpro-premium-followup.css`
- `public/xpro-premium-followup.js`
- `public/xpro-workspace.css`
- `public/xpro-workspace.js`

## Known SDK coupling found in API source scan
The current live project contains imports/calls to the Hatchable SDK that must be replaced or deliberately retained behind a documented compatibility boundary before a full cutover. The scan found 45 matches across 15 API files:
- `api/admin/stats.js`
- `api/agents/leader.js`
- `api/kai/browser.js`
- `api/kai/builder-agent.js`
- `api/kai/search.js`
- `api/netlify/callback.js`
- `api/netlify/connect.js`
- `api/netlify/status.js`
- `api/pro/redeem.js`
- `api/social/messages.js`
- `api/social/register.js`
- `api/social/threads.js`
- `api/social/users.js`
- `api/supabase/bridge.js`

The scan also found a provider request in `api/kai/builder-agent.js` and `api/ultimax/normal.js`; these need an explicit policy decision and must not be silently substituted. Review each route's data, auth, storage, email, scheduler, browser, AI, and database dependencies before porting.

## Required parity gates before cutover
1. Export/copy all required API and library source files into GitHub, retaining paths and recording checksums.
2. Replace the Hatchable SDK with explicit, tested adapters for database, auth/session, storage/files, browser/retrieval, AI inference, scheduler/queues, and any integrations actually used.
3. Configure secrets only in GitHub Actions / the selected runtime's secret store; never commit secret values.
4. Add route-level contract tests for request shape, response shape, authentication, error behavior, and CORS.
5. Confirm model and large-file download paths avoid routing every model byte through Hatchable.
6. Deploy a staging backend and test each route and tool, including App Maker, Code Maker, File Maker, Decoder/Encoder, KAI Lite, publishing, and social/knowledge routes.
7. Change only the frontend API base/config after tests pass; keep the existing public URL and UI.
8. Retain a rollback path until production traffic is verified.

## Current KAI backend draft caveats
The existing PR #2 adds a server-side `/api/chat` draft and retrieval code, but it does not port the full set of backend routes. It also requires a configured model endpoint/token and has not been verified end-to-end. Do not mark this migration complete based on syntax checks or a successful deploy command alone.
