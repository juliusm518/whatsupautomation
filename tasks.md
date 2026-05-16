# Tasks: ReplyPilot WhatsApp Automation SaaS

## Completed MVP
- Build a responsive web dashboard.
- Add multi-business selector and demo business profiles.
- Add WhatsApp connection status and webhook simulator.
- Add automation engine for intent detection, FAQ matching, lead extraction, appointment handling, escalation, and business-hours checks.
- Add conversation history and lead summaries.
- Add basic analytics cards.
- Add server routes for health, workspace data, and WhatsApp webhook processing.
- Add optional OpenAI reply refinement adapter.
- Add environment variable documentation.
- Add focused engine tests.
- Add lint and build checks.

## Verification
- `npm run lint`
- `npm test`
- `npm run build`
- Browser dashboard smoke test
- Mobile viewport smoke test
- `/health` API smoke test
- `/api/whatsapp/webhook` smoke test

## Next Implementation Tasks
- Replace demo storage with a hosted database.
- Add managed authentication.
- Add real WhatsApp Cloud API webhook verification and outbound message delivery.
- Add production deployment config.
- Add pilot onboarding templates by business type.

## Explicitly Deferred
- Payment integration
- CRM integration
- Voice notes
- Calendar sync
- Mobile app
- Broadcast messaging
- Team inbox
- Customer tagging
- White-label or enterprise features
