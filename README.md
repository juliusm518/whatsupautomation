# WhatsApp Auto Reply SaaS MVP

A lean SaaS MVP for Singapore SMEs that automates WhatsApp customer interactions with AI-style replies, FAQ matching, lead capture, appointment handling, human escalation, business-hours rules, conversation history, multi-business support, and basic analytics.

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## Verify

```bash
npm run check
```

The project intentionally has no runtime package dependencies. The local automation engine is deterministic and tested, while the server includes adapter points for OpenAI and WhatsApp Cloud API credentials.

## Supabase

Apply `supabase/migrations/001_initial_schema.sql` to create isolated `replypilot_*` tables for tuition centers and aircon servicing businesses. Then set:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

When those values are present, `/api/workspace` reads businesses, FAQs, conversations, messages, and leads from Supabase, and `/api/whatsapp/webhook` stores new conversations there. Without them, the app stays in local demo mode.

## MVP Scope

Included:

- Multi-business dashboard
- WhatsApp connection setup and webhook simulator
- AI auto-reply workflow with optional OpenAI server adapter
- FAQ answering
- Lead extraction
- Appointment request detection
- Human escalation routing
- Business-hours automation
- Conversation history
- Basic analytics

Deferred from v1:

- Voice notes, CRM, payment integration, calendar sync, mobile apps, website chat, broadcast messaging, team inbox, customer tagging, white-labeling, and enterprise workflows.
