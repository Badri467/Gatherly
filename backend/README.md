# Gatherly Node backend

Run `node --env-file-if-exists=.env server.mjs` (Node 22+). Run all checks with `node --test`.

The backend uses native Node HTTP and fetch, without runtime package dependencies.

- server.mjs: startup, listening address, request timeout, shutdown signals.
- backend/app.mjs: HTTP application, static assets, security headers, AI authorization and error responses.
- backend/config.mjs: environment settings and configuration checks.
- backend/routes/cloud.mjs: validated account and event endpoints.
- backend/routes/planner.mjs: planning, chat, document extraction and draft review.
- backend/services/supabase.mjs: bounded server-to-Supabase requests using user-scoped access tokens.
- backend/services/ai.mjs: Gemini and Ollama calls.
- backend/middleware/http.mjs: bounded JSON parsing and response helpers.

## HTTP API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/health | Health and configured model |
| GET | /api/config | Whether cloud accounts are enabled; no Supabase keys |
| POST | /api/auth/register | Register email and password |
| POST | /api/auth/login | Sign in |
| POST | /api/auth/refresh | Refresh session |
| GET | /api/auth/me | Verify bearer token and load user |
| POST | /api/auth/logout | Revoke current session |
| GET | /api/events | Load user's events |
| PUT | /api/events/:id | Create/update with event and optional version |
| DELETE | /api/events/:id | Delete with required version |
| POST | /api/plan | Starting plan plus AI notes |
| POST | /api/chat | Event-aware AI response |
| POST | /api/import | Extract AI document draft |
| POST | /api/import/validate | Validate reviewed draft |

The browser calls only same-origin Gatherly routes for authentication, database storage, and AI. The server derives ownership from the verified user, and Supabase row-level security remains enabled. Existing .env settings, SQL schema, Render commands, and saved event documents continue to work.

Sessions continue to use bearer tokens stored in the tab's sessionStorage. This refactor does not add cookie sessions. Rate limits remain per process and reset on restart; multiple server instances need a shared limiter. Configure HTTPS on the hosting platform. Passwords and tokens are not logged.

Live verification with your own account is still needed after refreshing the frontend. HTTP integration tests mock Supabase to verify validation, authentication, owner assignment, conflict handling, and config privacy without creating real accounts or changing user data.
