# City Care Clinic — Booking Agent

A single-clinic appointment booking app. Patients book through a friendly, **chat-driven** flow; staff manage doctors, schedules, exceptions, and appointments from an admin console.

The entire patient booking journey is driven by **one stateful endpoint** (`POST /api/chat`) — the client renders the assistant's `message` + `quickReplies` and echoes back the chosen value. Specialties, doctors, dates, and slots are never fetched separately.

- **Stack:** React 19 + Vite 8, zero routing/state dependencies
- **Design:** teal medical system (blended from the client mockups), Inter, WCAG AA
- **Surfaces:** public booking chat + real-time live chat with staff + role-gated admin / doctor / staff consoles

---

## Screenshots

### Public booking

Landing hero over a real clinic photo (scrim keeps copy AA-readable) with a **floating chat launcher** bottom-right — the booking chat lives in a popover, not in the page.

![Public landing with floating chat launcher](docs/screenshots/01-landing.png)

Tap the launcher (or "Chat with us") to open the booking chat: greeting, progress stepper, specialty quick-replies, and a free-text composer. Minimize returns to the launcher; the conversation persists.

![Landing with the booking chat open](docs/screenshots/06-landing-chat-open.png)

### Admin console

**Dashboard** — overview tiles and quick navigation.

![Admin dashboard](docs/screenshots/02-admin-dashboard.png)

**Doctors** — list and add doctors.

![Admin doctors](docs/screenshots/03-admin-doctors.png)

**Schedules** — per-doctor weekly availability rules.

![Admin schedules](docs/screenshots/04-admin-schedules.png)

### Live chat with staff

Patients can pick **Connect with staff** in the booking chat; after a short intake the bot hands off to a real staff member over a WebSocket. The widget shows the connection state, the live conversation, and a peer **typing** animation.

![Patient live chat handoff with typing indicator](docs/screenshots/08-patient-livechat.png)

Staff (and admins) work the queue from a two-pane **Live chat** console — Waiting / Active / Closed tabs on the left, the conversation on the right. Claim a waiting patient, reply in real time, and Complete to close the room for both sides.

![Staff live chat console — queue and active conversation](docs/screenshots/07-staff-livechat.png)

> Screenshots are generated headlessly with the network stubbed (see [Regenerating screenshots](#regenerating-screenshots)). Point the app at the real backend to use live data.

---

## Features

### Patient booking (public)
- **Floating chat launcher** (bottom-right) opens the booking chat as a popover over the landing page; minimize keeps the conversation alive (mockup's Default/Unread/Minimized launcher states).
- Full conversational flow: specialty → doctor → date → slot → name → phone → confirm → complete/cancelled.
- **Progress stepper** derived from the server `stage` — no duplicated client state.
- **Free-text input always available** beside the quick-reply chips (the API accepts either).
- **Confirmation card** built from `collectedEntities`; shows the booking reference on success.
- **Session persistence & rehydrate** — `sessionId` in `localStorage`; the transcript is restored on refresh via the history endpoint.
- **Resilient** — rate limits (`429`), network failures, and `SLOT_TAKEN` surface inline with recovery, never a crash.
- **Accessible** — `aria-live` assistant turns, focus/scroll management, 44px targets, AA contrast.

### Admin console (token-gated)
- **Dashboard** — doctor count, booking-flow status, quick nav.
- **Doctors** — list + create (`GET`/`POST /api/admin/doctors`).
- **Schedules** — per-doctor weekly rules (`GET`/`POST /api/admin/schedules`).
- **Exceptions** — block a whole day or a window (`POST /api/admin/schedule-exceptions`).
- **Appointments** — bookings by doctor + date (`GET /api/admin/bookings`).
- Admin token stored in `localStorage`, sent as `x-admin-token`. UI branches on error `code`, not message strings.

### Live chat with staff
- **Patient handoff** — the bot's *Connect with staff* purpose collects name → title → phone, then returns `liveChat: { sessionId, patientKey, wsPath }`; the widget switches from `POST /api/chat` to a WebSocket at `/ws?role=patient&key=…`. The `patientKey` is issued once, so it's persisted (`localStorage`) to survive a reload.
- **Staff/admin console** — a shared two-pane inbox (`components/livechat/LiveChatSection.jsx`): Waiting / Active / Closed tabs, **Claim** a waiting session, live room over `/ws?role=staff&token&session`, and **Complete** (with confirm) to close for both sides.
- **Realtime frames** — `history`, `message` (echoed to the sender → deduped by id, no optimistic append), **`typing`** (relayed to the peer → drives the typing animation, auto-expires), `idle_warning` (patient countdown), `session_closed`, plus a dashboard `new_session` toast socket.
- **One active session per staff** — claiming while busy surfaces `STAFF_BUSY`; losing the race surfaces `SLOT_TAKEN`. Outgoing `typing` is throttled (keepalive that also resets the 3-min idle auto-close).
- Realtime logic lives in one hook, `hooks/useLiveChat.js` (a WebSocket is a genuine external system — the sanctioned use of `useEffect` + cleanup).

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api → http://localhost:3000
```

Point at a different backend origin:

```bash
VITE_API_TARGET=http://your-backend:PORT npm run dev   # dev proxy target
# or, for a built app hitting an absolute origin:
VITE_API_BASE=https://api.example.com npm run build
```

Other scripts:

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build
npm run lint       # eslint
```

---

## Architecture

Dependency-free by design — no router or state library.

| Concern | Approach |
|---|---|
| Routing | Hash router via `useSyncExternalStore` (`src/lib/router.js`); URL is the single source of truth. `#/` public, `#/admin/<section>` admin. |
| Booking state | `useChat` state machine (`src/hooks/useChat.js`) owns the conversation and talks to `POST /api/chat`. |
| API layer | `src/api/client.js` — thin `fetch` wrapper, `ApiError` carrying the domain `code`, session + admin helpers. |
| Admin reads | `useAsync` (`src/hooks/useAsync.js`) — minimal fetch hook with `AbortController` (no request leaks). |

### Project structure

```
src/
├── api/client.js               # fetch layer (chat + admin), ApiError, session
├── lib/router.js               # hash router (useSyncExternalStore)
├── hooks/
│   ├── useChat.js              # booking conversation state machine
│   └── useAsync.js             # admin fetch-state helper
├── components/chat/            # ChatWidget, ProgressStepper, MessageList,
│                               # QuickReplies, Composer, ConfirmationCard, …
├── pages/
│   ├── PublicApp.jsx           # landing hero + chat
│   └── admin/                  # AdminApp shell, Login, sections/*
└── styles/                     # tokens.css (design system) + global.css
```

---

## Design system

Blended from the client mockups (CareFlow + City Care Clinic). Tokens live in `src/styles/tokens.css`.

| Role | Value |
|---|---|
| Primary | `#0f766e` (hover `#115e59`) |
| Accent | `#0284c7` |
| Semantic | success `#16a34a` · warning `#f59e0b` · error `#dc2626` |
| Text / muted / border | `#0f172a` · `#64748b` · `#e2e8f0` |
| Surface / page | `#ffffff` · `#f8fafc` |
| Type | Inter — 28/20/17/16/14/12 scale |
| Radius | 8 / 12 / 16 / 24 / full |

Every choice was validated against UI/UX rules before implementation (WCAG AA contrast, 60-30-10, one primary action per screen, standard patterns). Responsive down to mobile — the hero stacks and the chat/tables reflow.

---

## API contract

Full contract in [`mockups/API_CONTRACT.md`](mockups/API_CONTRACT.md). Key points the frontend relies on:

- `POST /api/chat` returns `{ sessionId, stage, message, quickReplies, collectedEntities, errors }`. Send `{ message: "" }` with no `sessionId` to start.
- `GET /api/chat/:sessionId/history` rehydrates the transcript.
- `POST /api/booking/cancel` verifies by reference + phone.
- Admin endpoints require `x-admin-token`; branch on error `code` (`NOT_FOUND`, `SLOT_TAKEN`, `PHONE_MISMATCH`, `ALREADY_CANCELLED`, `INVALID_INPUT`).

---

## Regenerating screenshots

Screenshots are captured with **Puppeteer** (`scripts/screenshots.mjs`). No backend required — the script stubs `fetch` and `WebSocket` in-page (`evaluateOnNewDocument`) with a seeded conversation, so captures are deterministic (including the live-chat room and typing animation).

```bash
npm run dev          # in one terminal (http://localhost:5173)
npm run screenshots  # in another — writes docs/screenshots/*.png
```

Override the target with `SCREENSHOT_BASE=http://host:port npm run screenshots`. To shoot against a **real** backend instead of the stubs, edit the `install()` stub out of the script and log in normally.
