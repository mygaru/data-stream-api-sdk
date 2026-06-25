# Data Stream API SDK

Browser SDK for collecting real-time user behavior signals on partner websites.

## Key Files

- `src/browser.ts` — Browser entry point, command queue, OTP monitor, global exposure
- `src/services/client.ts` — Core API client (setText, addText, setNum, stepNum, setBool)
- `src/services/client-request.ts` — HTTP request layer (Fetch API)
- `src/utils/friendly-interval.ts` — rAF-based polling service (setInterval + requestAnimationFrame)
- `src/types/browser.types.ts` — BrowserDataStreamApi interface, Window augmentation
- `tsup.config.ts` — Dual build: ESM (`dist/index.js`) + IIFE (`dist/dsa.global.js`)

## Requirements (see REQUIREMENTS.md)

- **OTP is a stop factor** — no requests go out until OTP is resolved from cookie (`iuid`) or localStorage (`myg_otp`). OTP is resolved once per session and cached.
- **All public methods must be called via `cmd.push`** — this is the integration contract. Direct calls are deferred internally but `cmd.push` is the supported pattern.
- **No Proxy** — the init snippet is a plain `<script async>` tag. Queue uses the GA-style `cmd.push` callback pattern.

## Build

```bash
yarn build          # tsup --minify → dist/
yarn test           # vitest run
yarn typecheck      # tsc --noEmit
yarn lint           # biome check src --write
```

IIFE artifact is `dist/dsa.global.js` (served from `https://dsalib.mgaru.dev/dsa.global.js`).

## Architecture

1. **Before SDK loads**: `DataStreamApiClient.cmd` is a plain array, callbacks accumulate
2. **SDK script loads (IIFE)**: replaces global, overrides `cmd.push` to execute immediately, drains pending queue
3. **`init()` called (via queue)**: creates client instance, probes OTP → if found, locks + resolves ready; if absent, polls via `friendlyInterval`
4. **`ready` promise resolves**: all deferred method calls proceed, OTP is cached for the session

## Code Style

- Linter: Biome (camelCase for locals, no `as any`)
- Commit prefix: `feat(MYG-XXXX):`, `fix(MYG-XXXX):`, `test(MYG-XXXX):`
- No runtime dependencies — browser-native APIs only (Fetch, URL, localStorage, requestAnimationFrame)
- Field names: Latin chars + spaces only (`/^[A-Za-z ]+$/`)
