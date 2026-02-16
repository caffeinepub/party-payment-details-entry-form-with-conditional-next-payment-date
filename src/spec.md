# Specification

## Summary
**Goal:** Add Internet Identity-based authentication with a simple registration step, plus backend user/role permission management, so only authorized users can access entries and profiles.

**Planned changes:**
- Backend: introduce an app-user concept tied to the authenticated principal, including an idempotent “register me” method and permission-based authorization for entry and profile APIs.
- Backend: add admin-only APIs to grant/revoke at least the “user” permission for a principal (and optionally list registered users).
- Frontend: add an auth gating flow that shows (1) login screen when not authenticated, (2) registration screen when authenticated but not yet authorized, and (3) the existing app tabs when authorized.
- Frontend: add logout and small account/auth status UI elements as needed.
- Frontend: update login UI copy to indicate passkeys/biometric unlock may be used via Internet Identity on supported devices, and apply a cohesive non-blue/non-purple theme to new auth pages.

**User-visible outcome:** Users see a login page when signed out, can sign in with Internet Identity (with passkey/biometric-friendly messaging), register themselves when prompted, then access the existing app tabs; admins can manage user permission access, and users can log out back to the login screen.
