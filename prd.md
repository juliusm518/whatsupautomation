# PRD: ReplyPilot WhatsApp Automation SaaS

## Summary
ReplyPilot helps Singapore small businesses automate WhatsApp customer interactions without technical setup. The MVP gives business owners a responsive dashboard for auto-replies, FAQ answering, lead collection, appointment requests, human escalation, business-hour handling, conversation history, basic analytics, and multi-business management.

## Target Users
- Small business owners and operators
- Tuition center admins
- Aircon servicing companies
- Plumbers and renovation contractors
- Hawker stall owners and home bakeries
- Staff who monitor inbound customer inquiries

## Problem
SMEs lose customers when they reply slowly, miss WhatsApp messages, repeat the same answers manually, and fail to collect lead details in a structured way. After-hours inquiries are especially easy to lose.

## MVP Goals
- Let an operator view multiple businesses from one dashboard.
- Simulate and process inbound WhatsApp messages through a webhook endpoint.
- Produce fast, useful AI-style replies with a deterministic fallback engine.
- Match FAQs, detect intent, capture leads, handle appointment requests, and escalate urgent cases.
- Show conversation history and basic operating metrics.
- Keep the implementation deployable on a low budget.

## Included Scope
- WhatsApp webhook adapter and simulator
- AI auto-reply workflow with optional OpenAI adapter
- FAQ answering
- Lead extraction for name, phone, service, and preferred timing
- Appointment request handling
- Human escalation for urgent or sensitive messages
- Business-hours automation using Singapore time
- Admin dashboard
- Conversation history
- Basic analytics
- Multi-business support

## Deferred Scope
- Voice note transcription
- Multi-language workflows
- CRM integration
- Payment integration
- AI quotation generation
- Calendar synchronization
- Native mobile app
- Website chat widget
- Broadcast messaging
- AI follow-up reminders
- Team inbox
- Customer tagging
- Enterprise permissions and white-labeling

## Success Criteria
- A user can load the dashboard, select a business, run a WhatsApp message through automation, and see the resulting conversation.
- Urgent inquiries are routed to human escalation.
- FAQ and appointment messages receive appropriate replies.
- Lead details are extracted when present.
- The dashboard remains usable on mobile.
- Lint, tests, build, API smoke checks, and browser smoke checks pass.
