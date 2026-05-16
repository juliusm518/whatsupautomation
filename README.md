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

## Deploy on Render

This repo includes `render.yaml` for a Render web service.

Recommended Render settings:

- Runtime: Node
- Build command: `npm run build`
- Start command: `npm start`
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY` when ready
  - WhatsApp Cloud API values when ready

Do not add `.env` to GitHub. Put secrets directly into Render's environment variable settings.

## Meta test number setup

Use this path first before connecting BrightPath Tuition's real number.

1. In Meta for Developers, create or open a WhatsApp app and use the test phone number.
2. Add these Render environment variables:
   - `WHATSAPP_VERIFY_TOKEN`: any private phrase you invent, for example `brightpath-test-2026`.
   - `WHATSAPP_ACCESS_TOKEN`: the temporary access token from Meta's WhatsApp API setup page.
   - `WHATSAPP_PHONE_NUMBER_ID`: the phone number ID shown beside Meta's test number.
   - `WHATSAPP_BUSINESS_ID`: use `tuition-hub` for BrightPath Tuition.
3. In Meta's webhook settings, use:
   - Callback URL: `https://replypilot-whatsapp-automation.onrender.com/api/whatsapp/webhook`
   - Verify token: the exact same value as `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to WhatsApp `messages` webhook events.
5. Add your personal phone number as an allowed test recipient in Meta, then send a WhatsApp message to Meta's test number.

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
