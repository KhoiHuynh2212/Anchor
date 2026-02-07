# 🧭 Accountability AI — Project Specification

> **Voice-first AI accountability & wellness companion** that helps users check in daily, reflect on how they're feeling, and stay on track with goals.

**Hackathon**: Hacklahoma 2026 (24 hours)
**Target Prize Tracks**: Overall, Google Gemini (AI), ElevenLabs (Voice), DigitalOcean (Deployment)
**Stack**: React Native (Expo) + FastAPI + MongoDB + Google Gemini API + ElevenLabs (Voice Chat) + DigitalOcean (Deployment)

---

## Judging Criteria Alignment

| Criteria | Our Strategy |
|----------|-------------|
| **Creativity** | Voice-first AI companion that synthesizes across calendar, tasks, email into a single "life awareness" layer — no one else is building this |
| **Technical Difficulty** | Real OAuth integrations, knowledge graph in MongoDB, Gemini prompt chaining, ElevenLabs voice chat, push notifications — serious engineering across 3 sponsor APIs |
| **Overall Execution** | Tight 3-screen app with clear UX flow: onboard → morning brief → nudges → evening journal |
| **Presentation** | Live demo: show AI connecting dots across a user's life in real-time with voice output |

---

## 1. User Flows

### 1.1 Onboarding Flow
```
[App Open] → [Sign Up / Login (email + password)]
    → [Onboarding Questions Screen]
        - "What should I call you?"
        - "What are your top 3 goals right now?"
        - "How do you prefer to be motivated?" (gentle / balanced / direct)
        - "What time do you usually wake up?"
        - "What time do you go to bed?"
    → [AI Chat Onboarding]
        - Gemini asks 3-5 follow-up questions conversationally
        - Extracts: contacts, deadlines, skills, aspirations
        - Populates the knowledge graph from this conversation
    → [Connect Integrations (optional)]
        - Google Calendar
        - Gmail
        - Todoist
    → [Home / Morning Brief]
```

### 1.2 Morning Brief Flow
```
[Push Notification at user's wake time]
    → "Good morning {name}! Your day is ready 🌅"
    → [User taps] → [Morning Brief Screen]
        - AI-generated voice summary (ElevenLabs Voice Chat)
        - Today's calendar events
        - Pending tasks & deadlines
        - Motivational framing ("You've got 3 things today — here's how to crush them")
        - Audio auto-plays on screen open (ElevenLabs conversational voice)
```

### 1.3 Smart Nudges Flow (3x daily)
```
[Mid-morning nudge] → Goal check-in
    - "How's progress on {goal}? Quick update?"

[Afternoon nudge] → Task/deadline reminder
    - "Your {deadline} is in 2 days — want to block time for it?"

[Pre-evening nudge] → Reflection prompt
    - "Wrapping up the day? Take 2 min to check in with yourself"

[User taps any nudge] → [In-app nudge detail card]
    - AI explanation of why this nudge matters
    - Quick action buttons (mark done / snooze / respond)
```

### 1.4 Evening Check-in Flow
```
[Push Notification at user's bedtime - 1hr]
    → "Time for your evening reflection 🌙"
    → [User taps] → [Evening Check-in Screen]
        - Varied AI prompts each day:
            - "How are you feeling right now?"
            - "What's one thing you're proud of today?"
            - "What drained your energy today?"
            - "Rate your day 1-10 and tell me why"
            - "What would you do differently?"
        - Voice input (ElevenLabs Voice Chat) or text
        - AI responds conversationally (supportive friend tone)
        - Multi-turn journaling conversation (3-5 exchanges)
        - AI summarizes & stores insights in knowledge graph
```

---

## 2. AI Personality & Prompt Design

### 2.1 Personality Profile
```
Name: "Sage" (working name — can be customized)
Archetype: Supportive friend meets mindful coach
Inspirations: Jay Shetty (warmth + wisdom), Sadhguru (perspective shifts), Mel Robbins (action-oriented encouragement)

Voice characteristics:
- Warm but not saccharine
- Asks reflective questions, doesn't lecture
- Celebrates small wins genuinely
- Gently holds user accountable without guilt
- Uses metaphors and reframes
- Never robotic or generic
```

### 2.2 System Prompt Structure (Gemini)
```
[Base personality prompt]
    +
[User profile from knowledge graph]
    - Name, goals, preferences, motivation style
    +
[Today's context]
    - Calendar events, pending tasks, recent journal entries
    +
[Conversation history]
    - Last 3 evening check-ins for continuity
    +
[Task-specific instructions]
    - Morning brief generation / Nudge generation / Evening check-in
```

### 2.3 Prompt Templates

**Morning Brief Generation:**
```
You are Sage, a supportive AI accountability companion.
Given the user's profile, today's calendar, and pending tasks,
generate a warm, energizing morning briefing that:
1. Greets them by name
2. Acknowledges how yesterday went (reference last journal)
3. Previews today's schedule naturally (not a list dump)
4. Highlights 1-2 priority items with encouragement
5. Ends with a motivational framing for the day
Keep it conversational, 60-90 seconds when read aloud.
```

**Nudge Generation:**
```
You are Sage. Generate a push notification nudge (max 100 chars)
and a detail card (2-3 sentences) for the following context:
- Nudge type: {goal_check_in | deadline_reminder | reflection_prompt}
- Relevant data: {context from knowledge graph}
Make it feel personal, not automated. Reference specific goals/tasks by name.
```

**Evening Check-in:**
```
You are Sage, having an evening reflection conversation.
- Ask one thoughtful prompt to start
- Listen actively, reflect back what you hear
- Ask 1-2 follow-up questions naturally
- After 3-5 exchanges, offer a gentle summary
- Extract: mood, accomplishments, blockers, insights
- Return structured data for knowledge graph update
```

---

## 3. Data Architecture (MongoDB)

### 3.1 Collections

**`users`**
```json
{
  "_id": "ObjectId",
  "email": "string",
  "password_hash": "string",
  "name": "string",
  "nickname": "string",
  "motivation_style": "gentle | balanced | direct",
  "wake_time": "07:00",
  "bed_time": "23:00",
  "timezone": "America/Chicago",
  "integrations": {
    "google": { "access_token": "...", "refresh_token": "...", "scopes": [...] },
    "todoist": { "api_key": "..." }
  },
  "onboarding_complete": true,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**`knowledge_graph`** — Nodes
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "node_type": "goal | contact | deadline | skill | interest | value",
  "label": "Get Google internship",
  "properties": {
    "priority": "high",
    "status": "in_progress",
    "target_date": "2026-05-01",
    "notes": "Applied to SWE intern role, need referral"
  },
  "edges": [
    { "target_id": "ObjectId", "relationship": "requires", "weight": 0.9 },
    { "target_id": "ObjectId", "relationship": "related_to", "weight": 0.5 }
  ],
  "source": "onboarding_chat | gmail_scan | calendar_event | manual",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**`conversations`**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "type": "onboarding | morning_brief | evening_checkin | nudge_response",
  "messages": [
    {
      "role": "assistant | user",
      "content": "string",
      "timestamp": "datetime",
      "audio_url": "string | null",
      "metadata": {
        "mood": "string | null",
        "extracted_entities": []
      }
    }
  ],
  "summary": "AI-generated conversation summary",
  "insights": {
    "mood": "positive | neutral | negative",
    "accomplishments": [],
    "blockers": [],
    "action_items": []
  },
  "created_at": "datetime"
}
```

**`nudges`**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "type": "goal_check_in | deadline_reminder | reflection_prompt",
  "title": "Push notification text (100 chars)",
  "body": "Detail card content",
  "related_nodes": ["ObjectId"],
  "status": "pending | delivered | opened | responded | snoozed",
  "scheduled_for": "datetime",
  "delivered_at": "datetime | null",
  "opened_at": "datetime | null",
  "response": "string | null",
  "created_at": "datetime"
}
```

### 3.2 Knowledge Graph Design
```
Node types:
  - goal (user's objectives)
  - contact (people in their network)
  - deadline (time-bound commitments)
  - skill (things they know/are learning)
  - interest (hobbies, passions)
  - value (what matters to them)

Edge types (relationship field):
  - requires (goal → skill)
  - knows (contact → contact)
  - has_deadline (goal → deadline)
  - can_help_with (contact → goal)
  - related_to (any → any)
  - blocks (any → goal)
  - supports (any → goal)

Traversal: Gemini API reasons over the graph by receiving
a JSON dump of relevant nodes + edges as prompt context.
No graph DB needed — MongoDB queries + Gemini reasoning.
```

---

## 4. API Design (FastAPI)

### 4.1 Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, lifespan
│   ├── config.py               # Settings (env vars)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py             # POST /auth/register, /auth/login
│   │   ├── onboarding.py       # POST /onboarding/answers, /onboarding/chat
│   │   ├── brief.py            # GET /brief/today, POST /brief/generate
│   │   ├── nudges.py           # GET /nudges, POST /nudges/{id}/respond
│   │   ├── checkin.py          # POST /checkin/start, /checkin/message
│   │   ├── knowledge.py        # GET /knowledge/graph, CRUD nodes/edges
│   │   └── integrations.py     # OAuth callbacks, sync triggers
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── knowledge.py
│   │   ├── conversation.py
│   │   └── nudge.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_engine.py        # Gemini API prompt chain orchestration
│   │   ├── voice.py            # ElevenLabs TTS + STT
│   │   ├── knowledge_graph.py  # Graph operations, context building
│   │   ├── scheduler.py        # APScheduler for nudges/briefs
│   │   ├── google_integration.py  # Calendar + Gmail
│   │   └── todoist_integration.py
│   └── core/
│       ├── __init__.py
│       ├── database.py         # MongoDB connection (motor async driver)
│       ├── auth.py             # JWT token handling
│       └── prompts.py          # All prompt templates
├── requirements.txt
├── .env.example
└── Dockerfile
```

### 4.2 Endpoints

**Auth**
```
POST /auth/register        → { email, password, name }
POST /auth/login           → { email, password } → { access_token }
```

**Onboarding**
```
POST /onboarding/answers   → { nickname, goals[], motivation_style, wake_time, bed_time }
POST /onboarding/chat      → { message } → { ai_response, extracted_entities[], complete: bool }
```

**Morning Brief**
```
GET  /brief/today          → { text, audio_url, calendar_events[], tasks[], generated_at }
POST /brief/generate       → Triggers brief generation (called by scheduler)
```

**Nudges**
```
GET  /nudges               → { nudges[] } (today's nudges for user)
POST /nudges/{id}/respond  → { response_text } → { ai_reply }
POST /nudges/{id}/snooze   → { snooze_minutes }
```

**Evening Check-in**
```
POST /checkin/start         → { ai_prompt, conversation_id }
POST /checkin/message       → { conversation_id, message, audio_base64? }
                            → { ai_response, audio_url?, complete: bool, insights? }
```

**Knowledge Graph**
```
GET  /knowledge/graph       → { nodes[], edges[] }
POST /knowledge/nodes       → { node_type, label, properties }
PUT  /knowledge/nodes/{id}  → { updates }
DELETE /knowledge/nodes/{id}
```

**Integrations**
```
GET  /integrations/google/auth-url   → { url }
GET  /integrations/google/callback   → OAuth callback
POST /integrations/google/sync       → Trigger calendar + email sync
POST /integrations/todoist/connect   → { api_key }
POST /integrations/todoist/sync      → Trigger task sync
```

---

## 5. Frontend Design (React Native / Expo)

### 5.1 Screens

```
screens/
├── Auth/
│   ├── LoginScreen.tsx
│   └── RegisterScreen.tsx
├── Onboarding/
│   ├── QuestionsScreen.tsx      # Swipeable cards for initial questions
│   └── ChatScreen.tsx           # AI conversation for deeper profiling
├── Main/
│   ├── MorningBriefScreen.tsx   # Voice + text summary, calendar preview
│   ├── NudgeFeedScreen.tsx      # Card-based nudge timeline
│   └── EveningCheckinScreen.tsx # Chat interface with voice input
├── Settings/
│   └── SettingsScreen.tsx       # Integrations, preferences, times
└── Navigation/
    └── AppNavigator.tsx         # Tab nav (Brief | Nudges | Check-in)
```

### 5.2 Screen Details

**Morning Brief Screen**
- Large greeting header with user's name
- Play button for ElevenLabs audio
- Scrollable brief text below audio
- Calendar event cards
- Task priority cards
- "Let's go" dismissal button

**Nudge Feed Screen**
- Timeline-style feed (today's nudges)
- Each nudge is a card: icon + short text + timestamp
- Tap to expand detail + quick response
- Swipe actions: complete / snooze
- Status indicators (pending, delivered, responded)

**Evening Check-in Screen**
- Chat bubble UI
- Microphone button for voice input (hold-to-record)
- Text input fallback
- AI messages with optional audio playback
- "End session" → summary card with mood/insights

### 5.3 Design Language
```
Theme: Calm, warm, minimal
Colors:
  - Primary: #6C63FF (soft purple — trust, calm)
  - Secondary: #FF6584 (warm coral — energy, warmth)
  - Background: #F8F9FA (light) / #1A1A2E (dark)
  - Surface: #FFFFFF / #16213E
  - Text: #2D3436 / #EAEAEA
  - Success: #00B894
  - Warning: #FDCB6E

Typography:
  - Headers: Inter Bold
  - Body: Inter Regular
  - AI messages: Inter Medium (slightly distinct)

Spacing: 8px grid system
Border radius: 16px (cards), 24px (buttons), 50% (avatars)
```

---

## 6. Voice Integration (ElevenLabs)

### 6.1 ElevenLabs Voice Chat (Conversational AI)
```
ElevenLabs handles BOTH directions — voice-in and voice-out.
This is the core differentiator and ElevenLabs prize track play.

Used for:
  - Morning brief narration (TTS)
  - Evening check-in full voice conversation
  - Nudge audio previews (stretch goal)
  - Onboarding chat voice mode (stretch goal)

Architecture options:
  Option A — ElevenLabs Conversational AI Agent
    - Use ElevenLabs' built-in agent with custom knowledge base
    - Agent connects to our backend for context (knowledge graph)
    - Handles STT + LLM + TTS in one pipeline
    - Lowest latency, best voice experience

  Option B — Gemini + ElevenLabs TTS/STT pipeline
    - ElevenLabs STT for voice → text
    - Gemini for reasoning/response generation
    - ElevenLabs TTS for text → voice
    - More control over AI logic, slightly higher latency

Recommended: Option B for hackathon
  - Gives us full control over Gemini prompts + knowledge graph context
  - Still showcases ElevenLabs voice quality heavily
  - Can demo Option A as "what's next" in presentation

Voice selection:
  - Choose a warm, friendly voice from ElevenLabs library
  - "Rachel" or "Adam" work well for supportive tone

Implementation:
  - Backend orchestrates: ElevenLabs STT → Gemini → ElevenLabs TTS
  - Returns audio URL + text with each response
  - Frontend plays via expo-av, records via expo-av
  - Real-time streaming for lower perceived latency (stretch)
```

### 6.2 Voice Flow (Evening Check-in)
```
[User holds mic button]
  → expo-av records audio
  → Audio sent to backend as base64
  → Backend → ElevenLabs STT → transcript
  → Transcript + knowledge graph context → Gemini API
  → Gemini response → ElevenLabs TTS → audio
  → Backend returns { text, audio_url, insights }
  → Frontend plays audio + shows text bubbles
```

---

## 7. Integration Details

### 7.1 Google Calendar
```
OAuth 2.0 scopes:
  - https://www.googleapis.com/auth/calendar.readonly

Sync:
  - On connect: pull next 7 days of events
  - Daily: refresh today + tomorrow
  - Store events as knowledge graph nodes (type: "deadline")

Data extracted:
  - Event title, time, location, description
  - Recurring patterns
```

### 7.2 Gmail
```
OAuth 2.0 scopes:
  - https://www.googleapis.com/auth/gmail.readonly

Sync:
  - Scan last 50 emails for deadlines/action items
  - Gemini extracts: dates, commitments, people mentioned

Data extracted:
  - Deadlines mentioned in emails
  - Action items / promises made
  - Key contacts and their context
```

### 7.3 Todoist
```
Auth: API token (simpler than OAuth)

Sync:
  - Pull all active tasks
  - Pull projects for categorization
  - Map to knowledge graph goals

Data extracted:
  - Task name, due date, priority, project
  - Completion patterns (for encouragement)
```

---

## 8. Scheduler Design (APScheduler)

```
Jobs:
  1. morning_brief_generator
     - Runs at user's wake_time (per user)
     - Generates brief via Gemini
     - Generates audio via ElevenLabs
     - Sends push notification

  2. nudge_generator
     - Runs 3x daily: wake+2hrs, wake+6hrs, bed-2hrs
     - Queries knowledge graph for relevant nudges
     - Gemini generates personalized nudge
     - Sends push notification

  3. evening_checkin_prompt
     - Runs at bed_time - 1hr
     - Sends push notification with varied prompt

  4. integration_sync
     - Runs every 6 hours
     - Refreshes calendar, email, tasks
     - Updates knowledge graph with new data
```

---

## 9. Push Notifications (Expo)

```
Setup:
  - expo-notifications
  - Expo push token stored in user document
  - Backend sends via Expo Push API

Notification types:
  - morning_brief: "Good morning {name}! Your day is ready 🌅"
  - nudge: Dynamic content from Gemini (max 100 chars)
  - evening_checkin: "Time for your evening reflection 🌙"

Deep linking:
  - Each notification type opens corresponding screen
  - Notification payload includes { type, conversation_id?, nudge_id? }
```

---

## 10. Demo Scenario & Seed Data

### 10.1 Demo User Profile
```json
{
  "name": "Alex",
  "nickname": "Alex",
  "motivation_style": "balanced",
  "wake_time": "07:30",
  "bed_time": "23:00",
  "goals": [
    "Land a software engineering internship at Google by May 2026",
    "Finish AI/ML course on Coursera by March 2026",
    "Run a half marathon in April 2026"
  ]
}
```

### 10.2 Seed Knowledge Graph
```json
{
  "nodes": [
    { "type": "goal", "label": "Google SWE Internship", "priority": "high", "target_date": "2026-05-01" },
    { "type": "goal", "label": "Complete AI/ML Coursera Course", "priority": "medium", "target_date": "2026-03-15" },
    { "type": "goal", "label": "Run Half Marathon", "priority": "medium", "target_date": "2026-04-20" },
    { "type": "deadline", "label": "AI4All Application Due", "date": "2026-02-10" },
    { "type": "deadline", "label": "Coursera Week 5 Quiz", "date": "2026-02-09" },
    { "type": "contact", "label": "James Park", "company": "Google", "role": "SWE", "relationship": "LinkedIn connection" },
    { "type": "contact", "label": "Prof. Sarah Chen", "role": "AI/ML Professor", "relationship": "course instructor" },
    { "type": "skill", "label": "Python", "level": "intermediate" },
    { "type": "skill", "label": "React Native", "level": "beginner" },
    { "type": "interest", "label": "Running", "frequency": "3x/week" }
  ],
  "edges": [
    { "from": "Google SWE Internship", "to": "James Park", "type": "can_help_with" },
    { "from": "Google SWE Internship", "to": "Python", "type": "requires" },
    { "from": "AI/ML Course", "to": "Prof. Sarah Chen", "type": "related_to" },
    { "from": "AI4All Application", "to": "Google SWE Internship", "type": "supports" },
    { "from": "Half Marathon", "to": "Running", "type": "requires" }
  ]
}
```

### 10.3 Demo Calendar Events (for Feb 7-8, 2026)
```json
[
  { "title": "Team standup", "time": "10:00 AM", "duration": "30m" },
  { "title": "AI/ML Coursera - Week 5 lecture", "time": "2:00 PM", "duration": "1h" },
  { "title": "5K training run", "time": "6:00 PM", "duration": "45m" },
  { "title": "Study group - Algorithms", "time": "8:00 PM", "duration": "1.5h" }
]
```

### 10.4 Demo Todoist Tasks
```json
[
  { "task": "Submit AI4All application", "due": "2026-02-10", "priority": "high", "project": "Career" },
  { "task": "Complete Coursera Week 5 quiz", "due": "2026-02-09", "priority": "medium", "project": "Learning" },
  { "task": "Update resume with hackathon project", "due": "2026-02-15", "priority": "low", "project": "Career" },
  { "task": "Message James about Google referral", "due": "2026-02-08", "priority": "high", "project": "Career" }
]
```

---

## 11. Hackathon Timeline (24 hours)

### Hour 0-2: Foundation
- [ ] Initialize Expo React Native project
- [ ] Initialize FastAPI project with MongoDB connection
- [ ] Set up auth (register/login with JWT)
- [ ] Create MongoDB collections and models
- [ ] Set up .env with all API keys

### Hour 2-6: Backend Core
- [ ] Onboarding endpoints (questions + AI chat)
- [ ] Knowledge graph CRUD + seed data loader
- [ ] Gemini AI engine service (prompt templates + chain logic)
- [ ] Morning brief generation endpoint
- [ ] Nudge generation endpoint
- [ ] Evening check-in conversation endpoint

### Hour 6-10: Integrations + Voice
- [ ] Google OAuth flow (Calendar + Gmail)
- [ ] Todoist API integration
- [ ] ElevenLabs TTS integration (morning brief audio)
- [ ] ElevenLabs STT + TTS integration (voice chat)
- [ ] APScheduler setup (mock schedules for demo)

### Hour 10-16: Frontend
- [ ] Auth screens (login/register)
- [ ] Onboarding flow (questions → AI chat)
- [ ] Morning Brief screen with audio playback
- [ ] Nudge Feed screen with card UI
- [ ] Evening Check-in screen with chat UI + voice input
- [ ] Tab navigation + deep linking from notifications

### Hour 16-20: Integration + Polish
- [ ] Connect all frontend screens to backend API
- [ ] Push notification setup (Expo)
- [ ] End-to-end flow testing
- [ ] Seed data for demo
- [ ] Error handling + loading states

### Hour 20-24: Demo Prep
- [ ] Record demo video / prepare live demo script
- [ ] Deploy backend (DigitalOcean)
- [ ] Final bug fixes
- [ ] Write Devpost submission
- [ ] Practice presentation

---

## 12. Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB=accountability_ai

# Auth
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=72

# Google Gemini API
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# ElevenLabs (Voice Chat — TTS + STT)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/integrations/google/callback

# Todoist
TODOIST_CLIENT_ID=...
TODOIST_CLIENT_SECRET=...

# Expo Push
EXPO_ACCESS_TOKEN=...

# DigitalOcean (deployment)
DO_APP_PLATFORM=true
```

---

## 13. Fallback Strategy

For the hackathon demo, if any integration fails:

| Component | Fallback |
|-----------|----------|
| Google Calendar | Pre-seeded calendar events in MongoDB |
| Gmail | Pre-seeded email extractions in knowledge graph |
| Todoist | Pre-seeded tasks in MongoDB |
| ElevenLabs TTS | Text-only morning brief (no audio) |
| ElevenLabs STT | Text-only input (no voice) |
| Push Notifications | In-app notification feed |
| Gemini API | Cached responses for demo scenario |

All fallbacks should be **invisible to the audience** — the app should look the same whether using real or mock data.

---

## 14. Key Technical Decisions

1. **MongoDB over SQL**: Flexible schema for rapid iteration during hackathon. Knowledge graph stored as documents with embedded edges (no need for Neo4j).

2. **Gemini over Claude/GPT**: Targets the Google Gemini sponsor prize track directly. Strong multimodal capabilities, generous free tier, and fast inference. `gemini-2.0-flash` for speed during the hackathon.

3. **ElevenLabs for full voice pipeline**: Both STT and TTS through one provider = simpler integration, targets the ElevenLabs prize track, dramatically better voice quality than native TTS = "wow factor" for judges.

4. **Expo over bare React Native**: Push notifications, audio recording, and builds all handled. Worth the tradeoff.

5. **APScheduler over Celery**: Lightweight, no Redis dependency, sufficient for hackathon scale. Runs in-process with FastAPI.

6. **JWT auth over OAuth**: Simpler for hackathon. No session management needed.

7. **DigitalOcean App Platform for deployment**: Targets the DigitalOcean prize track. Docker-based deploy, managed MongoDB or Atlas connection, simple scaling. Free $200 credits available.

---

*Ready to build. Let's go.* 🚀
