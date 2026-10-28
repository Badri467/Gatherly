# Gatherly ✳

A GenAI-powered event planning assistant for weddings, birthdays, and community events. Built for a PromptWars project, using vanilla JavaScript, CSS, and the Node.js standard library. No npm packages, build step, paid subscription, or database server required.

## Start

Install Node.js 22.9 or newer (Node 24 recommended), then run in this directory:

```sh
node --env-file-if-exists=.env server.mjs
```

Open http://localhost:3000. Start with “Explore a sample wedding plan” or create your own event. Run tests with `node --test`.

## Features

- Multiple events, with editable dates, themes, location, currency, guests, and budgets.
- Deterministic budget allocations with editable actual spending, remaining amounts, and overspend indicators.
- Relative planning deadlines, completion tracking, and custom tasks. Changing the event date shifts deadlines.
- Vendor categories, contacts, and booking status. Vendor records are entered by the user, not invented listings.
- Personalized starter ideas and event-aware conversational assistance.
- Downloadable CSV budget and timeline, printable PDF view, SVG plan image, browser-local persistence, responsive layout, keyboard-accessible forms.
- Optional Ollama (local inference) or Gemini (Google API) integration. API keys stay on the server.

## Enable real GenAI

Default `demo` mode uses templates and keyword-based advice. **It is not an LLM.** For the GenAI challenge, connect one of the providers below before presenting. Provider failures are displayed, never silently replaced by demo responses.

Copy `.env.example` to `.env` and restart the server after changing configuration.

### Local Ollama — no per-request API charges

Install [Ollama](https://ollama.com), start its service, and download a suitable model:

```sh
ollama pull gemma3:4b
```

Set these values in `.env`:

```dotenv
AI_PROVIDER=ollama
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3:4b
```

Local model download, memory, storage, and runtime requirements depend on your hardware. Ollama is open source; model licenses are separate (Gemma has Google's model terms). You can select another installed model with a license appropriate for your use. Integration uses Ollama's native `/api/chat` endpoint.

### Gemini — optional Google integration

Create a key in [Google AI Studio](https://aistudio.google.com/apikey), then configure:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
```

This is a hosted proprietary API, not open source. Free-tier eligibility, model availability, region restrictions, and quotas can change; check [Google's current pricing](https://ai.google.dev/gemini-api/docs/pricing). This project does not require Gemini. Choose a model available to your account. Requests use the [generateContent REST API](https://ai.google.dev/api/generate-content).

## How the AI works

Creating an event first calculates its budget, task dates, and starter checklist in code. When a provider is connected, the server also asks the model for personalized planning notes, a run of show, and savings suggestions. Chat receives the event, its current edited plan, and the last eight conversation messages. All model output is rendered as text rather than HTML. AI advice does not automatically modify financial data or make bookings.

## Data and deployment

Events are stored in `localStorage` in the current browser; there is no user account or cross-device synchronization. Export important plans before clearing browser data. Event information is sent to the selected model when creating plans or chatting. Demo mode makes no model requests. Fonts optionally load from Google Fonts, with system fallbacks when offline.

This is a **local runnable project**, bound to `127.0.0.1`. It is not published. Public deployment would need authentication, rate limiting, durable per-user storage, and a deliberate hosting configuration. Do not expose the development server directly to the internet. The API has request limits and fixed provider configuration; users cannot supply arbitrary provider URLs.

## Challenge demonstration (about 3 minutes)

1. Start with Ollama or Gemini configured and show the provider badge.
2. Create a community event: 80 guests, INR 100,000, a date 60 days ahead, “zero-waste neighborhood arts evening.”
3. Show the generated notes in Ideas, the budget allocation, and relative timeline.
4. Enter a catering expense, complete a task, and save a shortlisted vendor.
5. Ask “How can we accommodate mixed ages and stay within this budget?” The model receives the current plan as context.
6. Export the plan and refresh to demonstrate persistence.

## Project structure

```text
server.mjs        HTTP server, provider integration, and API
planner.mjs       Validation, deterministic plans, and labeled demo advice
planner.test.mjs  Budget, deadline, validation, and advice tests
public/           Browser application, responsive styles, HTML
.env.example      Server-only provider configuration
```

MIT licensed project code. No external JavaScript dependencies.

## Import a budget and timeline with AI

Click **Import with AI**, choose a file under 8 MB, optionally add event context, then submit it to Gemini. Supported inputs: XLSX (cached cell values, not formula evaluation), CSV, TSV, TXT, PDF, PNG, JPEG, and WebP. Macro-enabled, password-protected, and legacy XLS files are not supported; save them as XLSX or CSV first. Worksheet formatting is not preserved. Excel serial dates are interpreted by Gemini.

Review and edit the extracted event details, budget lines, spending, and task dates. Assumptions are displayed explicitly. Save creates a new event; existing plans are preserved. A sample CSV is available in `examples/community-event.csv`.

Source files are processed in memory, not stored by the app. Their content is sent to Google Gemini only when you submit the import. Google provider terms and quotas apply. Imported data is validated before saving. Unknown source amounts and dates may be estimated by AI and require your review.

**Export plan** offers separate CSV budget/timeline spreadsheets, a browser print view (choose Save as PDF), and a scalable SVG overview image. PDF saving requires the browser print dialog. CSV text is escaped against spreadsheet formula injection.

Gemini is currently the default provider in your local `.env`. Set `AI_PROVIDER=ollama` and restart to use local chat again; file imports still require the Gemini key. No silent fallback occurs on Gemini failures.

## Guests, vendor payments, and reminders

**Guests & RSVPs:** add or edit guests/households, party sizes, contacts, dietary notes, invitation status, and Pending/Attending/Declined responses. Search and filter the list. Archive/restore preserves guest records. Totals count people rather than households; your original planned guest count stays separate. Set an RSVP deadline for pending-response reminders. RSVPs are manually maintained by the organizer; there is no public response link or invitation delivery.

**Vendors:** save each quote, agreed deposit, total paid, deposit deadline, and balance deadline. Partial payments reduce the deposit first, then the balance. Outstanding balances and installment reminders are calculated automatically. Vendor payments do not automatically change budget actuals, preventing double counting; update the budget separately when you record an expense. Deadlines stay fixed when the main event date changes so contractual due dates are preserved.

**Reminders:** overdue and next-14-day tasks, unpaid vendor installments, and pending RSVP follow-ups appear in Reminders and on the overview. The reminders view refreshes once a minute while open. There are no background notifications, emails, or payment transactions.

**Calendar export:** download an .ics snapshot from Reminders or Export plan. It contains the celebration, unfinished tasks, unpaid installments, and RSVP follow-up, with DISPLAY alarms one day before. Import into Google Calendar, Outlook, Apple Calendar, or another ICS-capable calendar; alarm support is controlled by that app. Re-export after changes; this is not a subscribed/live calendar. Stable item UIDs are included, but calendar apps can still duplicate repeated imports, so replace prior imports as appropriate. Guest names, contacts, and dietary details are excluded from calendars and automatic AI chat context.

Export plan also offers guest/RSVP and vendor-payment CSVs. Guest exports include the contact and dietary information you entered. All records remain in this browser’s localStorage and are not synchronized across devices.

## Interface validation and demo preparation
The studio includes inline field errors, visible keyboard focus, labeled mobile navigation, required-field and contact validation, shared event validation for creation and editing, RSVP deadline checks, vendor payment checks, and explicit AI generation states. Source-file imports check type and size before submission and validate AI drafts server-side. Read `DEMO-GUIDE.md` for the 3:45 submission walkthrough.

This is still a local-first application. UI polish does not add accounts, cloud backups, public RSVP links, background notifications, or production hosting.


## Node backend architecture update
Authentication, event persistence, and AI now run through the modular Node backend. The browser calls /api/auth/* and /api/events; Supabase settings are kept server-side. Existing environment variables and Render start commands remain valid. See backend/README.md for the current route reference and architecture. Earlier instructions describing direct browser-to-Supabase calls are superseded by this implementation.
