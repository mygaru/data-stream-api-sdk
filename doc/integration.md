# Integration Guide

Integration reference for the myGaru **Data Stream API SDK** and **Ident SDK**.

The Data Stream API collects first-party behavioural signals from your website and attaches them to known customer profiles. Ident resolves the user session and provides the OTP token; Data Stream API reads it automatically — no manual token handling is required on the client side.



## Integration scripts

A complete integration requires the **[Ident script](#ident-script)** and **[Data Stream API script](#data-stream-api-script)** pasted into your page `<head>`. They load independently and communicate through shared browser storage — you never pass tokens between them manually.

Only the **Data Stream API** install snippet is generated on the myGaru platform. The **Ident SDK** uses a standard install — see [Ident script](#ident-script) and the [Ident integration guide](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone/-/blob/main/docs/integration.md).

| | **Ident SDK** | **Data Stream API SDK** |
|---|---------------|-------------------------|
| **Purpose** | Resolve user identity; provide OTP token | Send behavioural signals to myGaru |
| **Script URL** | `https://cdn.mgaru.dev/static/myGaruStandalone.js` | `https://dsalib.mgaru.dev/dsa.global.js` |
| **Install source** | Standard snippet (Ident docs) | Generated on myGaru platform |
| **Global object** | `window.mygaru` | `window.DataStreamApiClient` |
| **Command queue** | `mygaru.cmd.push(...)` | `DataStreamApiClient.cmd.push(...)` |
| **Init call** | `mygaru.init()` | `DataStreamApiClient.init({ baseUrl })` |
| **Primary method** | `identV2()` | `setText` / `addText` / `setNum` / `stepNum` / `setBool` |
| **Repository** | [fe-ident-standalone](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone) | [data-stream-api-sdk](https://github.com/mygaru/data-stream-api-sdk) |

The integration scripts use the same **command queue pattern**: calls made before a script file loads are queued and executed in order once the SDK is ready.

---

<a id="ident-script"></a>

## Ident script (`myGaruStandalone.js`)

**Repository:** [fe-ident-standalone](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone)

Ident resolves the current user and stores an OTP token that downstream myGaru services consume. This is a **standard install** — add the script and call `identV2()` as documented in [fe-ident-standalone](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone). It is not generated on the myGaru platform.

### What it does

1. Loads asynchronously and exposes `window.mygaru`
2. `mygaru.init()` creates a singleton app instance
3. `identV2()` calls `GET https://ident.mygaru.com/v2/id` and returns OTP + carrier
4. Caches the result in `localStorage` under key `myg_otp`

### Install snippet

Add to `<head>` on every page (standard Ident integration):

```html
<script src="https://cdn.mgaru.dev/static/myGaruStandalone.js" async></script>
<script>
  var mygaru = window.mygaru || {};
  mygaru.cmd = mygaru.cmd || [];
  mygaru.cmd.push(function () {
    var app = mygaru.init();
    app.identV2({ timeout: 1000, cacheTTL: 7 * 24 * 60 * 60 * 1000 }).then(function (result) {
      console.log('OTP:', result.otp, 'Carrier:', result.carrier);
    });
  });
</script>
```

### `identV2()` API

Returns `Promise<{ otp: string, carrier: string }>`.

- **`otp`** — session token written to `myg_otp` and sent with every Data Stream API signal request. See [OTP — what it is and how it is used](#otp).
- **`carrier`** — user identification within the telecom operator perimeter; stored in `myg_otp` and used by Data Stream API to confirm the user is identified before sending signals. See [Carrier — what it is and how it is used](#carrier).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `0` (disabled) | Max wait in ms; falls back to cached value on timeout |
| `cacheTTL` | `number` | `604800000` (7 days) | How long cached values remain valid |

When `timeout` is set, the SDK races the network request against the timer. If the network is slow, a cached value from `localStorage` is returned (if within TTL). If no cache exists, the promise rejects.

```javascript
var WEEK = 7 * 24 * 60 * 60 * 1000;

app.identV2({ timeout: 1000, cacheTTL: WEEK }).then(function (result) {
  console.log('OTP:', result.otp, 'Carrier:', result.carrier);
}).catch(function (err) {
  console.error('No identity available:', err.message);
});
```

For Prebid, Google Secure Signals, and full option reference see the [Ident integration guide](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone/-/blob/main/docs/integration.md).

---

<a id="data-stream-api-script"></a>

## Data Stream API script (`dsa.global.js`)

**Repository:** [data-stream-api-sdk](https://github.com/mygaru/data-stream-api-sdk)

Data Stream API sends behavioural signals (text, numbers, booleans) to your myGaru signals endpoint. It reads the OTP token written by Ident automatically — no OTP parameter in `init()`.

The install snippet for this script is **generated on the myGaru platform** — copy it as-is into your `<head>`.

### What it does

1. Loads asynchronously and exposes `window.DataStreamApiClient`
2. `init({ baseUrl })` creates the client and begins OTP resolution
3. Reads `localStorage` key `myg_otp` (written by Ident)
4. Polls every **100 ms** for up to **60 seconds** if OTP is not yet available
5. Once OTP is locked, executes queued commands and sends signals via `GET` requests

### Install snippet

Copy from the **myGaru platform** and paste into `<head>`:

```html
<script async src="https://dsalib.mgaru.dev/dsa.global.js"></script>
<script>
  var DataStreamApiClient = window.DataStreamApiClient || {};
  DataStreamApiClient.cmd = DataStreamApiClient.cmd || [];
  DataStreamApiClient.cmd.push(function () {
    DataStreamApiClient.init({ baseUrl: "https://YOUR_CLIENT_ID.signals.mygaru.com" });
  });
</script>
```

### Init config

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `baseUrl` | `string` | yes | Signals endpoint — provided in the platform install snippet |

### Signal methods

All methods **must** be called via `DataStreamApiClient.cmd.push(...)`. Each returns `Promise<void>`.

**`setText(name, value)`** — sets the value of a field, where `name` is the name of the column created by the administrator on the portal and `value` is the attribute in text format.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setText('destinations of interest', 'France,Greece');
});
```

**`addText(name, value)`** — adds a specified text to the column identified by the parameter `name`; `value` is the attribute in text format. For example, if the column already contains `"France,Greece"`, calling `addText('destinations of interest', 'Thailand')` results in `"France,Greece,Thailand"`.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.addText('destinations of interest', 'Thailand');
});
```

**`setNum(name, value)`** — sets the column value, where `value` is a numeric attribute representing a measurable quantity.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setNum('cart total amount', 89.99);
});
```

**`stepNum(name, step)`** — changes the column value by the specified `step`. A positive step increments the value; a negative step decrements the value.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.stepNum('page views', 1);
  DataStreamApiClient.stepNum('stock', -1);
});
```

**`setBool(name, value)`** — sets the field value, where `value` is boolean.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setBool('abandoned cart', true);
});
```

| Method | HTTP endpoint |
|--------|---------------|
| `setText(name, value)` | `/data-stream/set-text` |
| `addText(name, value)` | `/data-stream/add-text` |
| `setNum(name, value)` | `/data-stream/set-number` |
| `stepNum(name, step)` | `/data-stream/step-number` |
| `setBool(name, value)` | `/data-stream/set-boolean` |

Field `name` must match a column created in the myGaru portal (Latin characters and spaces only).

---

## How the integration scripts connect

Ident and Data Stream API do **not** call each other directly. The link is through browser storage:

```
Ident identV2()
  → writes localStorage["myg_otp"] = { id, ts, carrier }
  → Data Stream API init()
  → reads localStorage myg_otp
  → locks OTP for session
  → cmd.push callbacks execute → GET {baseUrl}/data-stream/...
```

| Storage key | Written by | Read by | Format |
|-------------|------------|---------|--------|
| `myg_otp` | Ident | Data Stream API | `{ "id": "<otp>", "ts": <timestamp>, "carrier": "<carrier>" }` |

<a id="otp"></a>

### OTP — what it is and how it is used

**OTP** (One-Time Pass) is a token returned by Ident via `identV2()`. It represents the currently identified user session on myGaru.

| Aspect | Detail |
|--------|--------|
| **Source** | `GET https://ident.mygaru.com/v2/id` — returned as `result.otp` |
| **Storage** | Written by Ident to `localStorage` key `myg_otp` (field `id`) |
| **Who reads it** | Data Stream API SDK reads `myg_otp` automatically on `init()` |
| **Your code** | You do **not** pass OTP manually — no OTP parameter in `init()` or signal methods |

Once OTP is resolved, Data Stream API **locks it for the page session** and attaches it as the `otp` query parameter on every signal request:

```
GET {baseUrl}/data-stream/set-text?otp=...&name=...&label=...
GET {baseUrl}/data-stream/set-number?otp=...&name=...&value=...
```

The signals API uses OTP to **associate each signal with the correct customer profile** in myGaru. Without a valid OTP, no requests are sent — OTP absence is a **stop factor**.

If Ident has not resolved yet, Data Stream API polls `myg_otp` every **100 ms** for up to **60 seconds**.

<a id="myg-otp-cache"></a>

### `myg_otp` cache and expiry (`id`, `ts`)

Ident caches the identity in `localStorage` under key `myg_otp`:

```json
{ "id": "<otp>", "ts": 1719234567890, "carrier": "<carrier>" }
```

| Field | Role |
|-------|------|
| **`id`** | The OTP token — sent with every Data Stream API signal request |
| **`ts`** | Timestamp (Unix ms) when Ident last wrote or refreshed this entry |
| **`carrier`** | User identification within the telecom operator perimeter (see [Carrier](#carrier)) |

Both Ident and Data Stream API treat the cache as valid for **7 days** (default `cacheTTL` on `identV2()`). See [`myg_otp` cache and expiry](#myg-otp-cache). Data Stream API checks expiry on read:

```
Date.now() - ts > 7 days  →  entry ignored (treated as no OTP)
```

When `myg_otp` is **expired**:

1. Data Stream API **does not use** the stale `id` — signals stay blocked until a fresh entry appears
2. Ident **refreshes** on the next `identV2()` call — fetches a new identity from `/v2/id` and overwrites `myg_otp` with a new `id`, updated `ts`, and current `carrier`
3. Data Stream API picks up the new entry and can unlock the signal queue

If you change `cacheTTL` in `identV2()`, keep Ident and Data Stream API aligned — Data Stream API currently applies a fixed **7-day** TTL when reading `myg_otp`.

<a id="carrier"></a>

### Carrier — what it is and how it is used

**Carrier** is **user identification within the telecom operator perimeter**. It is returned alongside OTP from `identV2()` as `result.carrier`.

| Aspect | Detail |
|--------|--------|
| **Source** | Same Ident response as OTP — `identV2()` returns `{ otp, carrier }` |
| **Storage** | Stored in `myg_otp` under field `carrier` |
| **Your code** | You do **not** pass carrier to Data Stream API — it is read internally |

If the user **is not identified** within the telecom operator perimeter, Ident returns a guest carrier:

```
00000000-0000-0000-0000-000000000000
```

Data Stream API treats this value as **unidentified** and **does not send signals** until the user is identified within the perimeter. Any other carrier value means identification succeeded and the SDK can unlock the signal queue (together with a valid OTP).

In practice:

- **`result.otp`** — the token sent with every signal request to link data to a profile
- **`result.carrier`** — user identification within the telecom operator perimeter; guest (`00000000-0000-0000-0000-000000000000`) blocks signals until identification succeeds

Both values are cached together in `myg_otp` and shared between Ident and Data Stream API without any manual wiring on your side.

| Scenario | Expected behaviour |
|----------|---------------------|
| Ident completes before DSA `init()` | OTP available immediately |
| Ident completes after DSA `init()` | DSA polls until `myg_otp` is written |
| Ident fails / user unidentified | Signals remain blocked |
| Cached OTP within TTL | Ident may serve cache on slow network (see Ident docs) |
| `myg_otp` expired (`ts` older than 7 days) | Data Stream API ignores stale `id`; Ident refreshes on next `identV2()` |

---

## Pre-integration checklist

Complete these steps before deploying to production:

| Step | Owner | Action |
|------|-------|--------|
| 1 | Business / Data | Define signal fields (columns) in the myGaru portal |
| 2 | Platform admin | Configure Data Stream API integration on the myGaru platform |
| 3 | Engineering | Add Ident script to site `<head>` (see [Ident script](#ident-script)) |
| 4 | Engineering | Copy [Data Stream API script](#data-stream-api-script) from the platform into site `<head>` |
| 5 | Engineering | Map site events to portal column names (exact match required) |
| 6 | QA | Verify OTP resolution and signal delivery in staging |

**Field naming rule:** column names must contain **Latin characters (A–Z, a–z) and spaces only**. No underscores, digits, or special characters.

---

## Combined installation — page `<head>`

Add the **[Ident script](#ident-script)** and the **[Data Stream API script](#data-stream-api-script)** (from the myGaru platform) into `<head>`:

```html
<head>
  <meta charset="UTF-8">
  <title>Your Site</title>

  <!-- Ident script (standard install — not from platform) -->
  <script src="https://cdn.mgaru.dev/static/myGaruStandalone.js" async></script>
  <script>
    var mygaru = window.mygaru || {};
    mygaru.cmd = mygaru.cmd || [];
    mygaru.cmd.push(function () {
      var app = mygaru.init();
      app.identV2({ timeout: 1000, cacheTTL: 7 * 24 * 60 * 60 * 1000 }).then(function (result) {
        console.log('OTP:', result.otp, 'Carrier:', result.carrier);
      });
    });
  </script>

  <!-- Data Stream API script (from myGaru platform) -->
  <script async src="https://dsalib.mgaru.dev/dsa.global.js"></script>
  <script>
    var DataStreamApiClient = window.DataStreamApiClient || {};
    DataStreamApiClient.cmd = DataStreamApiClient.cmd || [];
    DataStreamApiClient.cmd.push(function () {
      DataStreamApiClient.init({ baseUrl: "https://YOUR_CLIENT_ID.signals.mygaru.com" });
    });
  </script>
</head>
```

Signal calls (`setText`, `setNum`, etc.) go in `<body>` or your application code — always wrapped in `DataStreamApiClient.cmd.push(...)`.

---

## Production patterns

### Page context on load

Send session-level context once the page is ready. Place in `<body>` or your application bootstrap:

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setText('entry page', window.location.pathname);
  DataStreamApiClient.setText('page category', 'checkout');
});
```

### Business events (clicks, form submissions)

Bind signals to user actions. Always wrap in `cmd.push`:

```javascript
document.getElementById('checkout-submit').addEventListener('click', function () {
  DataStreamApiClient.cmd.push(function () {
    DataStreamApiClient.setBool('completed checkout', true);
    DataStreamApiClient.setNum('order total', 149.99);
    DataStreamApiClient.addText('purchase categories', 'electronics');
  });
});
```

---

## Full page example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Site</title>

  <script src="https://cdn.mgaru.dev/static/myGaruStandalone.js" async></script>
  <script>
    var mygaru = window.mygaru || {};
    mygaru.cmd = mygaru.cmd || [];
    mygaru.cmd.push(function () {
      var app = mygaru.init();
      app.identV2({ timeout: 1000, cacheTTL: 7 * 24 * 60 * 60 * 1000 }).then(function (result) {
        console.log('OTP:', result.otp, 'Carrier:', result.carrier);
      });
    });
  </script>

  <!-- Data Stream API script (from myGaru platform) -->
  <script async src="https://dsalib.mgaru.dev/dsa.global.js"></script>
  <script>
    var DataStreamApiClient = window.DataStreamApiClient || {};
    DataStreamApiClient.cmd = DataStreamApiClient.cmd || [];
    DataStreamApiClient.cmd.push(function () {
      DataStreamApiClient.init({ baseUrl: "https://YOUR_CLIENT_ID.signals.mygaru.com" });
    });
  </script>
</head>
<body>

  <button id="btn-add-to-cart">Add to cart</button>

  <script>
    DataStreamApiClient.cmd.push(function () {
      DataStreamApiClient.setText('last page', 'product detail');
      DataStreamApiClient.setBool('is returning visitor', true);
    });

    document.getElementById('btn-add-to-cart').addEventListener('click', function () {
      DataStreamApiClient.cmd.push(function () {
        DataStreamApiClient.stepNum('add to cart clicks', 1);
        DataStreamApiClient.setBool('abandoned cart', false);
      });
    });
  </script>

</body>
</html>
```

---

## Go-live verification

Run this checklist in staging before production release:

- [ ] Ident script present in `<head>` on all target pages
- [ ] Data Stream API script present in `<head>` on all target pages
- [ ] `identV2()` completes — `myg_otp` entry appears in Application → Local Storage
- [ ] `DataStreamApiClient.init()` called via `cmd.push`
- [ ] Network tab shows `GET` requests to `/data-stream/set-text`, `/set-number`, etc.
- [ ] Column names in requests match portal definitions exactly
- [ ] Signals blocked when Ident is disabled (expected — OTP is required)

---

## Support

| Resource | Link |
|----------|------|
| Ident SDK | [fe-ident-standalone](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone) |
| Ident integration guide | [docs/integration.md](https://gitlab.adtelligent.com/mygaru/fe-ident-standalone/-/blob/main/docs/integration.md) |
| Data Stream API SDK | [data-stream-api-sdk](https://github.com/mygaru/data-stream-api-sdk) |

Contact your myGaru account team for platform access, Data Stream API snippet provisioning, and column configuration.
