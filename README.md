# @mygaru/data-stream-api-sdk

The myGaru Data Stream API is a mechanism provided to myGaru partners for collecting real-time data signals about user behavior on their website and adding the gathered information to the profiles of existing customers. The collected data can later be used to build audience segments for both targeting and analytics purposes.

This repository contains the **browser SDK** (`dsa.global.js`) and the **ESM package** for programmatic use. The SDK sends behavioural signals (`setText`, `addText`, `setNum`, `stepNum`, `setBool`) to the partner’s myGaru signals endpoint. It reads the OTP token from Ident automatically — no manual token handling on the client.

**Requirements:** Node.js ≥ 20, Yarn.

## Repository

| Path | Description |
|------|-------------|
| `src/browser.ts` | Browser entry point — command queue, OTP polling, global `DataStreamApiClient` |
| `src/services/client.ts` | Core API client and signal methods |
| `src/services/client-request.ts` | HTTP layer (Fetch API) |
| `src/utils/` | Validation, polling (`friendly-interval`), helpers |
| `dist/dsa.global.js` | **Browser bundle** (IIFE) — deployed to CDN / copied from myGaru platform |
| `dist/index.js` | **ESM build** — Node / bundler imports |
| `doc/integration.md` | [Enterprise integration guide](./doc/integration.md) (Ident + Data Stream API) |
| `REQUIREMENTS.md` | [SDK behaviour contract](./REQUIREMENTS.md) (OTP, command queue, field naming) |

### Build outputs

`yarn build` produces two artifacts via [tsup](https://tsup.egoist.dev/):

- **`dist/index.js`** + **`dist/index.d.ts`** — ESM module with TypeScript types
- **`dist/dsa.global.js`** — minified IIFE for `<script async>` installation in the browser

The browser bundle exposes `window.DataStreamApiClient` with the command-queue pattern (`cmd.push`).

## Scripts

Install dependencies first:

```bash
yarn install
```

| Command | Description |
|---------|-------------|
| `yarn build` | Build ESM + browser IIFE to `dist/` (minified, source maps) |
| `yarn test` | Run unit tests ([Vitest](https://vitest.dev/)) |
| `yarn typecheck` | Type-check app and Node config (`tsc --noEmit`) |
| `yarn lint` | Lint and auto-fix `src/` with [Biome](https://biomejs.dev/) |
| `yarn clean` | Remove `dist/` |
| `yarn prepublishOnly` | Full release check: clean → typecheck → lint → build |

## Integration with myGaru Ident

For the full browser setup (Ident SDK + Data Stream API), see [doc/integration.md](./doc/integration.md).  
Ident SDK reference: [fe-ident-standalone/docs/integration.md](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone/-/blob/main/docs/integration.md).

**Two scripts on the partner site:**

1. **[Ident script](./doc/integration.md#ident-script)** (`myGaruStandalone.js`) — standard install; resolves user identity and writes OTP to `localStorage` (`myg_otp`)
2. **[Data Stream API script](./doc/integration.md#data-stream-api-script)** (`dsa.global.js`) — generated on the myGaru platform; reads OTP automatically and sends signals

## Init

Add the SDK script and initialize via the command queue:

```html
<script async src="https://dsalib.mgaru.dev/dsa.global.js"></script>
<script>
  var DataStreamApiClient = window.DataStreamApiClient || {};
  DataStreamApiClient.cmd = DataStreamApiClient.cmd || [];
  DataStreamApiClient.cmd.push(function () {
    DataStreamApiClient.init({ baseUrl: "https://[client_id].signals.mygaru.com" });
  });
</script>
```

Commands pushed before the SDK loads are queued and executed in order once the script is ready. Commands pushed after load execute immediately.

## Quick start

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setText("destinations_of_interest", "France,Greece");
});
```

## Operations

### Text operations

- **`setText(name, value)`** — sets the value of a field, where **`name`** — the name of the column created by the administrator on the portal and **`value`** is attribute in a text format
```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setText("destinations_of_interest", "France,Greece");
});
```
- **`addText(name, value)`** — adds a specified text to the column identified by the parameter name; **`value`** is attribute in a text format.

- For example, calling **`addText("destinations_of_interest", "Thailand")`** will update the column so that if it already contains "France,Greece", the resulting value becomes "France,Greece,Thailand".
```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.addText("destinations_of_interest", "Thailand");
});
```

### Numeric operations

- **`setNum(name, value)`** — sets the column value, where **`value`** is attribute in a numeric format representing a measurable quantity.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setNum("cart_total_amount", 89.99);
});
```
- **`stepNum(name, step)`** — changes the column value by the specified **`"step"`**. Positive step increments the value, negative step decrements the value.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.stepNum("electronics_page_views", 1);
});
```

### Boolean operations

- **`setBool(name, value)`** — sets the field value, where **`"value"`** is boolean.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setBool("abandoned_cart", true);
});
```
