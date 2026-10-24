# MysticPalm ✋

A mobile-first AI palm reading **made for students**. Snap your palm and get your **palm persona**,
**study style + power hour**, **career matches**, **superpower**, **lucky colour/number/day**, level-up
tips — and a story-ready card to share with friends. Readings are written in simple Hinglish
(default), English or हिंदी.

## Run it

```bash
npm install
cp .env.example .env      # add ANTHROPIC_API_KEY, or leave it empty for demo mode
npm run dev               # http://localhost:5173
```

On Windows you can also double-click `start.bat`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Express + Vite (with hot reload) on one origin, API under `/api` |
| `npm run build` | Production SPA build into `dist/` |
| `npm start` | Serve the built SPA and API (run `npm run build` first) |
| `npm run typecheck` | Strict TypeScript across client, server and tests |
| `npm test` | Contract tests (Vitest) |

### Demo mode

With no `ANTHROPIC_API_KEY`, `/api/analyze` returns a complete sample student reading through the same
validation pipeline, labelled **Sample reading**. The whole flow — capture, quality check, scanning,
report, share card, chat with Maya — works without a key.

## Pandit Ji's voice

On the start page students can paste their own Gemini API key. Pandit Ji then speaks through Gemini's
natural text-to-speech (`gemini-3.8-flash-tts`, Indian male voice when available, playful style).
The key is stored only in that browser and sent with each voice request through `/api/tts`; the
server never stores or logs it. Without a key, Hindi/Hinglish use the recorded greeting and English
uses the browser's built-in voice.

## How it works

1. **Landing** — what you'll unlock, how it works, and a sample reading.
2. **Details** — which hand, writing hand, and optional name, school/college and interests
   (science, commerce, arts, tech, medical, creative…), used to tune study tips and career matches.
3. **Capture** — live camera with a palm guide, gallery upload or drag-and-drop. A browser-side
   quality gate (`src/lib/quality.ts`) checks light, focus and that a palm is in frame before upload.
   **On-device hand tracking** (MediaPipe Hand Landmarker, `src/lib/handTracker.ts`) finds the 21
   hand landmarks — live on the camera feed and on each photo — and the app animates them: scan beam,
   points, connecting bones, then the life, head, heart and fate lines placed from the hand's own
   landmarks (`src/lib/palmGeometry.ts`, `src/components/HandMesh.tsx`). The model and runtime are
   downloaded from Google/jsDelivr on first use; the photo itself never leaves the browser for this
   step. If tracking cannot load, everything still works with the illustrated guide.
4. **Reading** — the compressed photo goes to `POST /api/analyze`; the server calls Claude vision with
   a palmist prompt, a traditional rulebook and a JSON schema, validates the result and retries once.
5. **Report** — persona card, superpower, lucky stuff, study style, career matches, stats radar,
   level-up zones with a fix for each, line map, and deep-dive sections (vibe, studies, career,
   friends, wellbeing, year ahead, daily habits, journey, lines, mounts).
6. **Aftercare** — Save PDF, a 1080×1920 share card for stories, and "Ask Maya" chat scoped to the reading.

### Safety

`src/lib/report.ts` is the single contract for server and UI. Every string is scanned for predictions
of death/lifespan, disease, pregnancy, legal outcomes and guarantees; violations trigger a corrective
retry and are redacted if repeated. Readings never predict marriage or exam results, and wellbeing is
framed as lifestyle only. The same guard runs on chat questions and answers.

### Privacy

- The photo lives only in browser memory and is dropped as soon as the reading exists; it is never
  written to storage or to the server's disk.
- Only the reading JSON is kept, per tab, so a reload keeps it.
- The API key stays on the server.

## Structure

```
server/   index (http server) · app (routes) · analyze (Claude vision) · prompt · rules · demo · chat
src/      screens/ (Landing, Details, Capture, Scanning, Report) · components/ · lib/
tests/    report contract, quality gate, copy, capture gating, chat
```
