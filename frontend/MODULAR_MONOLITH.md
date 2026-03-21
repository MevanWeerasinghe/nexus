# Frontend Modular Monolith Structure

This frontend is now organized with module API entry points while remaining a single Next.js app.

## Current Module Entry Points

- `modules/auth/api`: auth-facing API surface.
- `modules/itam/api`: ITAM-facing API surface.

## Why This Pattern

- Keep one deployable frontend.
- Avoid direct cross-feature coupling from pages/components to global service files.
- Prepare clean onboarding for future modules like Maintenance.

## Migration Strategy Used

- Existing behavior stays unchanged.
- Module API facades currently delegate to `lib/api-service`.
- Pages/components now import module facades instead of importing `lib/api-service` directly.

## Adding the Maintenance Frontend Module

1. Create `modules/maintenance/api/index.ts`.
2. Place maintenance pages under `app/itams/maintenance/` (or a dedicated route group if required).
3. Keep maintenance UI components within a maintenance feature folder.
4. Import maintenance API only from `modules/maintenance/api`.

## Next Hardening Step (Optional)

Move implementation details from `lib/api-service` into module-local implementations and keep `lib/api-service` as a thin compatibility layer during migration.
