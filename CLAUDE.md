# 🧭 Accountability AI — Claude Context

## Project Overview
Voice-first AI accountability & wellness companion for **Hacklahoma 2026** (24-hour hackathon).

**Goal**: Help users check in daily, reflect on feelings, and stay on track with goals through conversational AI.

**Target Prizes**: Overall, Google Gemini (AI), ElevenLabs (Voice), DigitalOcean (Deployment)

## Tech Stack
- **Frontend**: React Native (Expo) — fast setup, push notifications, audio recording
- **Backend**: FastAPI (Python) — async, fast, clean API
- **Database**: MongoDB (motor async driver) — flexible schema, embedded knowledge graph
- **AI**: Google Gemini API (`gemini-2.0-flash`) — fast inference, sponsor prize target
- **Voice**: ElevenLabs (TTS + STT) — high-quality voice, conversational AI, sponsor prize target
- **Scheduler**: APScheduler — lightweight, in-process with FastAPI
- **Auth**: JWT tokens — simple, no session management
- **Deployment**: DigitalOcean App Platform — Docker-based, sponsor prize target
- **Push Notifications**: Expo Push API

## Architecture Principles

### Knowledge Graph Design
- Stored as MongoDB documents with embedded edges (no Neo4j needed)
- Node types: `goal`, `contact`, `deadline`, `skill`, `interest`, `value`
- Edge types: `requires`, `knows`, `has_deadline`, `can_help_with`, `related_to`, `blocks`, `supports`
- Gemini reasons over JSON dump of relevant nodes/edges as prompt context

### AI Personality ("Sage")
- Supportive friend meets mindful coach
- Inspirations: Jay Shetty (warmth), Sadhguru (perspective), Mel Robbins (action)
- Warm but not saccharine, asks reflective questions, celebrates small wins
- Never robotic or generic

### Voice Integration Strategy
- **Option B** (recommended for hackathon): Gemini + ElevenLabs pipeline
  - ElevenLabs STT (voice → text)
  - Gemini reasoning with knowledge graph context
  - ElevenLabs TTS (text → voice)
- Full control over prompts + knowledge graph context
- Showcases ElevenLabs voice quality heavily

## Core User Flows
1. **Onboarding**: Questions → AI chat → optional integrations → home
2. **Morning Brief**: Push notification → voice summary + calendar/tasks
3. **Smart Nudges**: 3x daily contextual reminders with AI reasoning
4. **Evening Check-in**: Multi-turn voice conversation → mood extraction → insights

## Coding Standards

### Backend (FastAPI)
- Use async/await throughout (motor, httpx)
- Pydantic models for all request/response validation
- Centralize prompts in `app/core/prompts.py`
- Environment variables via `app/config.py` (Pydantic Settings)
- Error handling: try/except with HTTPException, log all AI failures
- JWT auth via dependency injection

### Frontend (React Native/Expo)
- TypeScript preferred but not required for speed
- Component structure: screens/ components/ navigation/ services/
- API calls via axios with centralized base URL
- Audio: expo-av for recording/playback
- Notifications: expo-notifications with deep linking
- State: React Context (no Redux for hackathon speed)

### Database
- All times stored in UTC, convert in backend
- User IDs always ObjectId references
- Index on: `user_id`, `created_at`, `scheduled_for`
- Soft delete approach for conversations (never hard delete user data)

## Critical Paths (Must Work for Demo)
1. Auth (register/login) → working JWT flow
2. Onboarding → knowledge graph populated
3. Morning Brief → Gemini generates + ElevenLabs TTS plays
4. Evening Check-in → voice input + AI conversation + insights extraction
5. Push notifications → at least show in-app feed

## Fallback Strategy (If Integrations Fail)
- Google Calendar → pre-seeded events in MongoDB
- Gmail → pre-seeded extractions in knowledge graph
- Todoist → pre-seeded tasks
- ElevenLabs TTS → text-only (no audio)
- ElevenLabs STT → text-only input
- Push notifications → in-app notification feed
- Gemini API → cached responses for demo scenario

**All fallbacks must be invisible to judges.**

## Demo Data (Seed User: Alex)
- Goals: Google SWE internship, AI/ML course, half marathon
- Calendar: Feb 7-8, 2026 with 4 events/day
- Tasks: AI4All app (due 2/10), Coursera quiz (2/9), resume update, message James
- Knowledge graph: 10 nodes, 5 edges connecting goals/skills/contacts
- See SPEC.md §10 for full seed data

## Environment Variables (Critical)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
GOOGLE_CLIENT_ID/SECRET=...
EXPO_ACCESS_TOKEN=...
```

## Key Files to Know
- `app/core/prompts.py` — all AI prompt templates
- `app/services/ai_engine.py` — Gemini orchestration + knowledge graph context
- `app/services/voice.py` — ElevenLabs STT/TTS wrappers
- `app/services/knowledge_graph.py` — graph operations, context building
- `app/services/scheduler.py` — APScheduler jobs (briefs, nudges)
- Frontend: `screens/Main/EveningCheckinScreen.tsx` — voice chat UI

## Things to Avoid
- Over-engineering: build for demo, not production scale
- Feature creep: stick to core flows (onboarding, brief, nudges, check-in)
- Heavy dependencies: keep it lean for hackathon deploy speed
- Complex state management: React Context is enough
- Perfect error handling: focus on happy path, basic fallbacks

## Quick Wins for Judges
- **Voice quality**: ElevenLabs makes this feel premium
- **Contextual awareness**: Gemini connecting calendar + tasks + goals = "wow"
- **Live demo**: show evening check-in with voice input in real-time
- **Visual polish**: clean UI with calm color scheme (purple + coral)
- **Sponsor integration depth**: show all 3 APIs working together

## When Claude Should Ask Questions
- Unclear prompt templates (specific personality tone needed?)
- Integration scope (how deep should Gmail scan go?)
- UI design decisions (wireframes needed?)
- Deployment details (DigitalOcean specific config?)

## When Claude Should Just Build
- CRUD endpoints (standard patterns)
- MongoDB models (spec is detailed)
- Basic UI screens (design language is specified)
- Gemini prompt chains (templates provided)
- Auth flow (JWT standard)

---

**Hackathon Mode**: Prioritize working demo over perfect code. Ship fast, iterate if time allows.
