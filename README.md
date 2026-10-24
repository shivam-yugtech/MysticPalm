# MysticPalm

A mobile-first, AI palmistry reading. Show or upload a palm, get a structured reading of the
lines, mounts, hand type and traits — every insight carrying an honest confidence score.
Readings are written in simple Hinglish (the default), English or हिंदी, and every problem the hand
shows comes with a practical solution.

## Run it

```bash
npm install
cp .env.example .env      # add ANTHROPIC_API_KEY, or leave it empty for demo mode
npm run dev               # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Express + Vite middleware on one origin (API under `/api`) |
| `npm run build` | Production SPA build into `dist/` |
| `npm start` | Serve the built SPA and API (`NODE_ENV=production`) |
| `npm run typecheck` | Strict TypeScript across client, server and tests |
| `npm test` | Contract tests (Vitest) |

### Demo mode

With no `ANTHROPIC_API_KEY`, `/api/analyze` returns a complete sample reading through the same
validation pipeline, and the report is labelled **Sample reading**. The whole flow — capture,
quality gate, scanning, report, share, chat — is usable without a key. The bundled sample is
written in simple Hinglish; live readings follow the chosen language.

## How it works

1. **Landing → hand choice** — right/left/both, dominant hand, optional name, date of birth, gender.
   The reading language is chosen in the header.
2. **Capture** — live `getUserMedia` camera with a glowing palm guide, gallery upload or drag-and-drop.
3. **Quality gate** — runs entirely in the browser on raw pixels (`src/lib/quality.ts`): exposure,
   focus (Laplacian variance measured on the palm itself), skin coverage/largest component for a
   hand in frame, plus a **non-blocking** heuristic for back-of-hand texture and framing. A failing
   photo is never uploaded; warnings need an explicit "use anyway".
4. **Reading** — the compressed photo (≤1024px JPEG) goes to `POST /api/analyze`. The server calls
   Claude vision with a palmist system prompt, a traditional rulebook and a JSON-schema
   `output_config`, validates the response against the contract, retries once on structural or
   safety failures, and redacts any remaining unsafe claim. The rulebook (`server/rules.ts`) fixes
   how hand type, mount prominence, line quality and marks are read, maps the fullest mount to its
   ruling planet for the lucky elements, and pairs each problem with one traditional upay.
5. **Report** — clarity score, annotated line map, animated trait radar, accordions with confidence
   badges, life phases, 12-month outlook, lucky elements, habits, both-hands comparison, and a
   solution beside every area to work on.
6. **Aftercare** — print-to-PDF (browser print dialog, full language support), a 1080×1920 share
   card, and "Ask the palmist" follow-up chat scoped to that report.

### Safety contract

`src/lib/report.ts` is the single contract used by both server and UI. It normalises model output,
fills every catalogued feature (marking omissions **not clearly visible**), clamps confidence,
requires the both-hands comparison only when two hands were supplied, and scans every string for
predictions of death/lifespan, disease/diagnosis, pregnancy/children and legal outcomes. Violations
trigger one corrective retry; a repeated violation is redacted with language-appropriate safe copy.
Health is framed as general lifestyle tendencies only.

The same guard runs on follow-up questions.

### Privacy

- The photo is analysed and held only in browser memory; it is discarded as soon as a reading exists
  and is **never** written to `sessionStorage`, `localStorage` or the server filesystem.
- Only the report JSON is persisted, per tab, so a reload keeps the reading (without the photo).
- The API key lives in the server environment and never reaches the browser.

## Structure

```
server/
  index.ts      entry (env + listen)
  app.ts        API routes, validation, SPA/Vite serving
  analyze.ts    Claude vision call, retries, redaction
  rules.ts      traditional rulebook + planetary correspondences
  prompt.ts     palmist system prompt + JSON schema
  demo.ts       contract-valid sample reading (Hinglish)
  chat.ts       report-scoped follow-up chat (+ offline replies)
src/
  screens/      Landing, Details, Capture, Scanning, Report
  components/   hand guide, palm overlay, radar, accordions, chat sheet, UI kit
  lib/          report contract, quality gate, i18n, API client, share card, session
tests/          executable contract (report, quality, copy, capture gating, chat)
```

## Known limits

- Back-of-hand detection is a heuristic (texture + highlight ratio), not a trained classifier, so it
  only ever warns; blur/exposure/“no hand” are the hard gates.
- Palm line positions in the annotated map are schematic — they guide the eye, they are not detected
  landmarks.
- PDF export uses the browser's print dialog (best fidelity for Devanagari); the visible label and
  print stylesheet are tuned for "Save as PDF".
- Camera requires a secure context (`localhost` or HTTPS) and user permission; upload always remains
  available.
