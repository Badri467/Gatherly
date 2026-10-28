# Free database and deployment guide

Recommended setup: Supabase Free for PostgreSQL + authentication, Render Free for this Node app, and your existing Gemini key. Accounts and hosting have not been provisioned. Supabase integration is implemented; add your project settings and run the SQL schema to enable it. Guest mode continues to use browser localStorage.

## 1. Create your database
1. Create a Free project at https://supabase.com. Choose a nearby region and store the database password securely.
2. Open SQL Editor and run database/supabase.sql once. It stores each full event document (budget, tasks, guests, vendors) in JSONB, matching the current app model.
3. Enable an authentication provider under Authentication. Email/password is sufficient for a first version. Configure the local site URL as http://localhost:3000; add your deployed URL when available.
4. Find your Project URL and publishable key in the project connection/API settings. The publishable key is intended for browser use with row-level security. Never put a secret/service-role key in frontend code or Git.

## 2. Connect the implemented application
Add these values to the local .env file (or Render Environment):

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
AI_REQUESTS_PER_HOUR=20
AI_TOTAL_REQUESTS_PER_HOUR=200

Restart the Node server after editing .env. Never use a secret/service-role key. The server returns only the public connection settings to the browser.

Click Sign in in Gatherly. Create an account, confirm your email if Supabase requires it, and then sign in. The app loads only that account's cloud events. Use My account → Import this device’s plans to copy guest-mode plans deliberately. It creates new event IDs and preserves your original guest plans. Repeated imports create additional copies.

Edits save after a short debounce. The header shows Unsaved changes / Saving / Cloud saved. On errors, open My account and Retry cloud save. Account-specific backups remain in localStorage. Restore unsaved backup lets you review a backup before retrying. Signing out restores the separate guest workspace. Sessions persist for the current browser tab, and expired tokens refresh automatically. Email confirmation links should be followed by returning to the app and signing in; password recovery and social login are not included.

Existing cloud rows use their updated_at values for conditional updates/deletes. A stale edit is rejected instead of silently overwriting another device. Importantly, review/merge conflicting edits manually; automatic merge is not implemented.

When Supabase is configured, AI requests require a token verified by the Node server. The default limits are 20 requests/user/hour and 200 total/hour per running Node instance. These counters reset on restart and do not coordinate between multiple instances. For a larger deployment, replace them with shared persistent quotas.

Test with two accounts before sharing: one user must never see or update the other's events. The SQL schema must have been applied; configuring keys alone does not create the table.

## 3. Deploy the current local-storage version on Render
1. Put the source in a GitHub repository. Confirm .env is ignored; do not commit Gemini keys or real guest data.
2. Sign in at https://render.com and create a Blueprint using render.yaml, or create a Web Service connected to the repository.
3. Select Free. Runtime Node. Build command: node --test. Start command: node server.mjs.
4. Set HOST=0.0.0.0, AI_PROVIDER=gemini, GEMINI_MODEL=gemini-3.1-flash-lite, GEMINI_API_KEY=your key, NODE_VERSION=24. Let Render supply PORT.
5. Deploy and open the generated HTTPS URL. Check /api/health and create a fictional event; test chat, imports, refresh, and exports.
6. Data in the current version is per browser and per origin. Your localhost plans will not automatically appear on the deployed URL. Sign in to enable cross-device access.
7. Before sharing broadly, configure and test the authentication and AI quota controls described above. Keep Gemini secrets in Render environment settings.

## Free-tier expectations
- Supabase Free currently includes a 500 MB database per project. Check current quotas and project lifecycle rules before relying on continuous availability: https://supabase.com/pricing
- Render Free sleeps after 15 minutes of inactivity, so the first request can be slow. Open the site before recording your live demo: https://render.com/docs/free
- Render requires the server to bind to 0.0.0.0 and its assigned PORT; HOST support has been added to server.mjs: https://render.com/docs/web-services
- Keep Gemini usage within the quotas shown for your model/key in Google AI Studio. Availability of free AI requests depends on model and account; hosting being free does not make model calls unlimited.

No accounts, database connection, or public deployment have been created by this guide.
