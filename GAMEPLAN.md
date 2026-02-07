# 🎯 Hacklahoma 2026 — 24-Hour Game Plan

## Pre-Start Checklist (Do This First!)
- [ ] Get all API keys ready:
  - [ ] MongoDB Atlas cluster created + connection string
  - [ ] Google Gemini API key
  - [ ] ElevenLabs API key + voice ID selected
  - [ ] Google OAuth credentials (Client ID/Secret)
  - [ ] Todoist API token (optional)
  - [ ] Expo account created
- [ ] Install dependencies:
  - [ ] Node.js, Python 3.11+, Expo CLI
  - [ ] MongoDB Compass (for debugging)
  - [ ] Postman/Thunder Client (API testing)
- [ ] Clone/init repo structure

---

## Phase 1: Foundation (Hours 0-2)
**Goal**: Get basic auth working end-to-end (register → login → protected route)

### Backend Setup (Hour 0-1)
- [ ] Initialize FastAPI project structure
  ```bash
  mkdir backend && cd backend
  python -m venv venv && source venv/bin/activate
  pip install fastapi uvicorn motor pydantic-settings python-jose passlib python-multipart
  ```
- [ ] Create `app/main.py` with FastAPI app + CORS
- [ ] Create `app/config.py` with Settings (load .env)
- [ ] Create `app/core/database.py` with MongoDB connection (motor)
- [ ] Create `app/models/user.py` (Pydantic model)
- [ ] Create `app/core/auth.py` (JWT create/verify functions)
- [ ] Create `app/api/auth.py` endpoints:
  - `POST /auth/register` (hash password, insert user, return token)
  - `POST /auth/login` (verify password, return token)
  - `GET /auth/me` (protected test route)
- [ ] Test in Postman: register → login → /me with token

### Frontend Setup (Hour 1-2)
- [ ] Initialize Expo project
  ```bash
  npx create-expo-app frontend --template blank
  cd frontend && npm install axios @react-navigation/native @react-navigation/stack
  ```
- [ ] Create `services/api.ts` (axios instance with base URL + token handling)
- [ ] Create `screens/Auth/LoginScreen.tsx` (email, password, submit button)
- [ ] Create `screens/Auth/RegisterScreen.tsx` (name, email, password)
- [ ] Create `screens/Main/HomeScreen.tsx` (placeholder "Welcome {name}")
- [ ] Test end-to-end: register → login → see home screen

**Checkpoint 1** (Hour 2): Can register, login, and see authenticated home screen ✓

---

## Phase 2: Backend Core (Hours 2-6)
**Goal**: Onboarding flow + knowledge graph + AI engine working

### Onboarding API (Hour 2-3)
- [ ] Create `app/models/knowledge.py` (Node, Edge schemas)
- [ ] Create `app/api/onboarding.py`:
  - `POST /onboarding/answers` (save nickname, goals, wake/bed times)
  - `POST /onboarding/chat` (Gemini extracts entities from user message)
- [ ] Create `app/services/ai_engine.py`:
  - `extract_entities_from_text()` (Gemini API call with structured output)
  - Basic Gemini API wrapper with error handling
- [ ] Test: send onboarding answers → verify user doc updated

### Knowledge Graph + Seed Data (Hour 3-4)
- [ ] Create `app/services/knowledge_graph.py`:
  - `create_node()`, `create_edge()`, `get_user_graph()`, `get_relevant_context()`
- [ ] Create `app/api/knowledge.py`:
  - `GET /knowledge/graph` (returns all user nodes + edges)
  - `POST /knowledge/nodes` (manual node creation)
- [ ] Create `scripts/seed_demo_data.py`:
  - Seed "Alex" demo user with full knowledge graph (from SPEC.md §10)
  - 10 nodes, 5 edges, 4 calendar events, 4 tasks
- [ ] Run seed script, verify in MongoDB Compass

### AI Prompt System (Hour 4-5)
- [ ] Create `app/core/prompts.py` with templates:
  - `MORNING_BRIEF_PROMPT`, `NUDGE_GENERATION_PROMPT`, `EVENING_CHECKIN_PROMPT`
- [ ] Update `app/services/ai_engine.py`:
  - `generate_morning_brief(user_id)` (pull knowledge graph + format prompt)
  - `generate_nudge(user_id, nudge_type)` (context-aware nudge)
  - `chat_evening_checkin(conversation_id, user_message)` (multi-turn conversation)
- [ ] Test each function with demo user Alex

### Morning Brief + Nudges (Hour 5-6)
- [ ] Create `app/models/conversation.py` (Conversation schema)
- [ ] Create `app/models/nudge.py` (Nudge schema)
- [ ] Create `app/api/brief.py`:
  - `GET /brief/today` (return generated brief or generate on-the-fly)
  - `POST /brief/generate` (scheduler endpoint)
- [ ] Create `app/api/nudges.py`:
  - `GET /nudges` (return today's nudges)
  - `POST /nudges/{id}/respond` (save response, AI reply)
  - `POST /nudges/{id}/snooze`
- [ ] Test: generate brief for Alex, verify calendar events referenced

**Checkpoint 2** (Hour 6): Can generate AI morning brief with knowledge graph context ✓

---

## Phase 3: Integrations + Voice (Hours 6-10)
**Goal**: Voice pipeline working (TTS for brief, STT+TTS for check-in)

### ElevenLabs Voice (Hour 6-8) — **PRIORITY P0**
- [ ] Create `app/services/voice.py`:
  - `text_to_speech(text)` → returns audio URL or base64
  - `speech_to_text(audio_file)` → returns transcript
- [ ] Pick ElevenLabs voice (Rachel or Adam)
- [ ] Update `generate_morning_brief()` to also generate audio via TTS
- [ ] Test: generate brief → get back text + audio URL
- [ ] Update `GET /brief/today` response to include `audio_url`
- [ ] Create test endpoint `POST /voice/test` (send text, get audio back)
- [ ] Test full STT → Gemini → TTS pipeline:
  - `POST /voice/test-conversation` (upload audio, get AI audio response)

### Evening Check-in Voice Flow (Hour 8-9)
- [ ] Create `app/api/checkin.py`:
  - `POST /checkin/start` (create conversation, return opening prompt + audio)
  - `POST /checkin/message` (accept text OR audio_base64, return AI response + audio)
  - After 3-5 exchanges, return `complete: true` with insights summary
- [ ] Update `ai_engine.py`:
  - `extract_insights_from_conversation()` (mood, accomplishments, blockers)
  - Store insights in conversation doc
- [ ] Test full voice conversation flow in Postman with audio files

### Google OAuth (Hour 9-10) — **PRIORITY P1** (can fallback to seed data)
- [ ] Install `google-auth-oauthlib`, `google-api-python-client`
- [ ] Create `app/services/google_integration.py`:
  - `get_auth_url()`, `handle_callback()`, `sync_calendar()`, `scan_gmail()`
- [ ] Create `app/api/integrations.py`:
  - `GET /integrations/google/auth-url`
  - `GET /integrations/google/callback`
  - `POST /integrations/google/sync`
- [ ] Test: complete OAuth flow, sync calendar events to knowledge graph
- [ ] **If time is tight**: skip and rely on seed data fallback

**Checkpoint 3** (Hour 10): Voice pipeline working (can speak brief, have voice check-in) ✓

---

## Phase 4: Frontend (Hours 10-16)
**Goal**: All main screens built with working API integration

### Navigation + Auth Screens (Hour 10-11)
- [ ] Install `expo-secure-store` for token storage
- [ ] Create `AuthContext.tsx` (login, logout, token management)
- [ ] Create tab navigator (Brief | Nudges | Check-in)
- [ ] Polish login/register screens (add logo, better styling)
- [ ] Test: login persists across app restarts

### Onboarding Screens (Hour 11-12)
- [ ] Create `screens/Onboarding/QuestionsScreen.tsx`:
  - Swipeable cards for: nickname, goals, motivation style, wake/bed times
  - Save via `POST /onboarding/answers`
- [ ] Create `screens/Onboarding/ChatScreen.tsx`:
  - Chat bubble UI
  - Send messages to `POST /onboarding/chat`
  - After 3-5 exchanges, auto-navigate to home
- [ ] Test full onboarding flow

### Morning Brief Screen (Hour 12-13) — **PRIORITY P0**
- [ ] Install `expo-av` for audio playback
- [ ] Create `screens/Main/MorningBriefScreen.tsx`:
  - Large greeting header with user's name
  - Play button for audio (ElevenLabs TTS)
  - Scrollable brief text
  - Calendar event cards
  - Task priority cards
- [ ] Fetch from `GET /brief/today`
- [ ] Auto-play audio on screen open
- [ ] Test with demo user Alex

### Evening Check-in Screen (Hour 13-15) — **PRIORITY P0**
- [ ] Install `expo-av` for audio recording
- [ ] Create `screens/Main/EveningCheckinScreen.tsx`:
  - Chat bubble UI (user on right, AI on left)
  - Microphone button (hold-to-record)
  - Text input fallback
  - Audio playback for AI responses
  - "End session" button → show insights summary
- [ ] On mount: call `POST /checkin/start`
- [ ] On send: call `POST /checkin/message` with text or audio
- [ ] Display returned AI text + play audio
- [ ] Test full voice conversation

### Nudge Feed Screen (Hour 15-16)
- [ ] Create `screens/Main/NudgeFeedScreen.tsx`:
  - Timeline/card layout
  - Fetch from `GET /nudges`
  - Tap to expand, show detail card
  - Quick response input
  - Swipe actions (complete, snooze)
- [ ] Test with mock nudges from backend

**Checkpoint 4** (Hour 16): All core screens working with API ✓

---

## Phase 5: Integration + Polish (Hours 16-20)
**Goal**: End-to-end flows working, push notifications, error handling

### Push Notifications (Hour 16-17)
- [ ] Install `expo-notifications`
- [ ] Request notification permissions on app start
- [ ] Get Expo push token, send to backend
- [ ] Backend: store push token in user doc
- [ ] Create `app/services/push.py`:
  - `send_push(user_id, title, body, data)`
- [ ] Test: send notification from backend → receive on device
- [ ] Set up deep linking (notification tap → open relevant screen)

### Scheduler Setup (Hour 17-18)
- [ ] Install `apscheduler`
- [ ] Create `app/services/scheduler.py`:
  - `schedule_morning_brief(user_id)` (user's wake time)
  - `schedule_nudges(user_id)` (3x daily)
  - `schedule_evening_prompt(user_id)` (bed time - 1hr)
- [ ] For demo: trigger manually via test endpoints
  - `POST /admin/trigger-brief/{user_id}`
  - `POST /admin/trigger-nudge/{user_id}`
- [ ] Test: trigger brief → receive push → open app → see brief

### UI Polish (Hour 18-19)
- [ ] Implement design system (colors from SPEC.md §5.3)
  - Primary: #6C63FF, Secondary: #FF6584
- [ ] Add loading states (spinners during API calls)
- [ ] Add error handling (toast messages for failures)
- [ ] Add pull-to-refresh on all list screens
- [ ] Polish typography (Inter font)
- [ ] Add icons (expo-icons)

### Testing + Bug Fixes (Hour 19-20)
- [ ] Walk through full user journey:
  1. Register → Onboarding (questions + chat) → Home
  2. Trigger morning brief → receive push → view brief with audio
  3. View nudges → respond to one
  4. Evening check-in → voice conversation → see insights
- [ ] Fix any crashes or UI issues
- [ ] Test on both iOS and Android (if time)
- [ ] Verify seed data loads correctly

**Checkpoint 5** (Hour 20): Complete end-to-end flow working ✓

---

## Phase 6: Demo Prep + Deployment (Hours 20-24)
**Goal**: Deployed backend, polished demo, presentation ready

### Backend Deployment (Hour 20-22)
- [ ] Create `Dockerfile` for FastAPI app
- [ ] Test Docker build locally
- [ ] Deploy to DigitalOcean App Platform:
  - Connect GitHub repo
  - Set environment variables
  - Deploy backend
  - Get production URL
- [ ] Update frontend API base URL to production
- [ ] Test production API with Postman
- [ ] **Fallback**: If deployment issues, demo on localhost with ngrok

### Demo Preparation (Hour 22-23)
- [ ] Reset demo user (Alex) to clean state
- [ ] Prepare demo script:
  1. Show onboarding flow (2 min)
  2. Show morning brief with voice (1 min)
  3. Show nudge with context awareness (1 min)
  4. **MAIN DEMO**: Evening check-in with live voice input (3 min)
  5. Show knowledge graph visualization (1 min)
- [ ] Record backup demo video (in case of WiFi issues)
- [ ] Prepare 2-3 slides:
  - Problem statement
  - Solution overview (architecture diagram)
  - Sponsor tech integration (Gemini + ElevenLabs + DigitalOcean)
- [ ] Practice demo 2-3 times

### Devpost Submission (Hour 23-24)
- [ ] Write Devpost description:
  - Inspiration (why we built this)
  - What it does (4-5 bullet points)
  - How we built it (tech stack)
  - Challenges (voice latency, knowledge graph design)
  - Accomplishments (end-to-end voice, contextual awareness)
  - What we learned
  - What's next (ElevenLabs conversational agent, more integrations)
- [ ] Take screenshots/screen recordings
- [ ] Upload demo video
- [ ] Submit before deadline
- [ ] Final test run

**Checkpoint 6** (Hour 24): Submitted + ready to present ✓

---

## Priority Labels

### P0 — Must Have (Core Demo)
- Auth (register/login)
- Onboarding (questions + AI chat)
- Morning brief with ElevenLabs TTS audio
- Evening check-in with voice input (STT + TTS)
- Knowledge graph populated with seed data
- Basic push notification (at least in-app)

### P1 — Should Have (Strengthens Demo)
- Nudge system with 3x daily prompts
- Google Calendar/Gmail integration (or fallback to seed data)
- Full push notification deep linking
- Deployed to DigitalOcean

### P2 — Nice to Have (Stretch Goals)
- Todoist integration
- Knowledge graph visualization screen
- Dark mode toggle
- Conversation history view
- Analytics dashboard

---

## Parallel Work Strategy

If you have multiple team members:

**Backend Dev**:
- Hours 0-6: Auth + AI engine + knowledge graph
- Hours 6-10: Voice integration + Google OAuth
- Hours 10-16: Scheduler + push notifications
- Hours 16-20: Testing + bug fixes
- Hours 20-24: Deployment

**Frontend Dev**:
- Hours 0-2: Project setup + auth screens
- Hours 2-10: Wait for backend auth (work on UI mockups/design system)
- Hours 10-16: Main screens (brief, check-in, nudges)
- Hours 16-20: Polish + testing
- Hours 20-24: Demo prep + Devpost

**Solo Dev**:
- Follow timeline sequentially
- Focus on P0 items first
- Skip P2 items if behind schedule

---

## Emergency Shortcuts (If Behind Schedule)

At Hour 12 (halfway point), if you're behind:
- [ ] Skip Google OAuth → use seed data only
- [ ] Skip Todoist → use seed data only
- [ ] Skip nudge screen → focus on brief + check-in
- [ ] Skip push notifications → demo all in-app
- [ ] Skip deployment → demo on localhost with ngrok

At Hour 18 (6 hours left), if you're behind:
- [ ] Skip all integrations (seed data only)
- [ ] Skip scheduler (manual trigger endpoints)
- [ ] Skip onboarding chat (just questions screen)
- [ ] Focus on: brief with audio + evening check-in with voice

**Remember**: A working demo of 2 features is better than a broken demo of 10 features.

---

## Final Pre-Demo Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend .apk/.app built or Expo Go ready
- [ ] Demo user (Alex) has clean state
- [ ] Seed data loaded
- [ ] All API keys working
- [ ] Audio files play correctly
- [ ] Demo script practiced
- [ ] Backup demo video ready
- [ ] Laptop charged + WiFi tested
- [ ] Devpost submitted

**LET'S BUILD THIS! 🚀**
