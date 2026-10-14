# HAxBRO backend — GitHub-owned source

This directory is the migration target for HAxBRO backend code. **Vercel is not part of this design.**

## Responsibilities
- Keep backend source, route contracts, tests, model configuration, and tool adapters in this repository.
- Keep secrets out of Git; supply them through the chosen runtime's secret manager.
- Keep the existing frontend at `https://haxbro.hatchable.site` unchanged until the replacement endpoints are verified.
- Port each existing Hatchable route and replace Hatchable SDK dependencies with explicit adapters before switching traffic.

## Important runtime boundary
GitHub is the source-control and automation layer, not a permanent HTTP execution environment. GitHub Actions can lint, test, package, and trigger deployment, but it does not provide a continuously running API endpoint. A non-Vercel runtime must be selected and authorized before Hatchable can call this backend. Until then, the existing Hatchable backend remains active.

## Migration policy
1. Do not disable or delete existing Hatchable routes before parity tests pass.
2. Port route request/response contracts and authentication semantics.
3. Replace database, auth, file storage, browser/retrieval, model inference, and scheduling dependencies with documented adapters.
4. Test every route and workspace in staging.
5. Change only the frontend API base after the new runtime passes end-to-end checks.
6. Keep a rollback path.
