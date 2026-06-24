# Integration Guide

The Data Stream API SDK works in conjunction with the **myGaru Ident** SDK. Ident identifies the user and stores the OTP token in localStorage. The Data Stream API SDK reads that token and uses it to send data signals.

## Flow

```
1. myGaruStandalone.js loads → mygaru.init(partnerId)
2. app.identV2() → GET https://ident.mygaru.com/v2/id
3. Response: { otp: "..." }
4. saveCachedId(otp) → localStorage.setItem("myg_otp", JSON.stringify({ id: otp, ts: Date.now() }))
5. dsa.global.js loads → polls for OTP in cookie (iuid) or localStorage (myg_otp)
6. OTP found → queue releases → data signals are sent
```

## Full Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>myGaru Integration</title>

    <!-- 1. myGaru Ident SDK -->
    <script src="https://cdn.mgaru.dev/static/myGaruStandalone.js" async></script>
    <script>
      var mygaru = window.mygaru || {};
      mygaru.cmd = mygaru.cmd || [];
      mygaru.cmd.push(function () {
        var app = mygaru.init();
        app.identV2({ timeout: 1000, cacheTTL: 7 * 24 * 60 * 60 * 1000 }).then(function (id) {
          console.log('myGaru ID resolved:', id);
        });
      });
    </script>

    <!-- 2. Data Stream API SDK -->
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

<script>
  // Queue data signals — these execute after both SDKs are ready and OTP is resolved
  DataStreamApiClient.cmd.push(function () {
    DataStreamApiClient.setText("destinations", "France,Greece");
    DataStreamApiClient.setNum("carttotal", 89.99);
    DataStreamApiClient.setBool("abandonedcart", true);
  });
</script>

</body>
</html>
```

## How the Two SDKs Connect

### myGaru Ident (`myGaruStandalone.js`)

1. `mygaru.init(partnerId)` creates a partner context
2. `app.identV2(opts)` calls `GET https://ident.mygaru.com/v2/id` with credentials
3. On success, stores the OTP in localStorage:
   ```javascript
   localStorage.setItem("myg_otp", JSON.stringify({ id: otp, ts: Date.now() }));
   ```

### Data Stream API (`dsa.global.js`)

1. On `init()`, probes for OTP:
   - **Cookie** `iuid` (primary)
   - **localStorage** `myg_otp` (fallback) — reads `{ id, ts }` JSON, checks 1 week TTL
2. If OTP is not yet available (ident hasn't resolved), polls via `requestAnimationFrame` every 100ms (up to 60s)
3. Once OTP is found, it's locked (cached for the session) and the command queue releases

### Timing

The two SDKs load independently. The Data Stream API SDK does **not** depend on Ident being loaded first. The `friendlyInterval` polling bridges the gap:

| Scenario | What happens |
|----------|-------------|
| Ident resolves before DSA init | OTP is in localStorage, DSA finds it immediately |
| Ident resolves after DSA init | DSA polls, finds OTP when ident writes it to localStorage |
| Ident fails / user not identified | DSA queue stays blocked (OTP is a stop factor) |

## localStorage Format

Key: `myg_otp`

```json
{
  "id": "ZL84q2tnC163ya4s++RDUGPAbk9eWxHZ2fkEdeKQl8rL7NXpQufk1J9/4MZjxq8HdxXBUQIdXgiOG06AhxlRScnNQKiPVy7PUZw==",
  "ts": 1719216000000
}
```

- `id` — OTP token returned by `/v2/id`
- `ts` — timestamp of when it was cached (`Date.now()`)
- TTL: 7 days (entries older than `7 * 24 * 60 * 60 * 1000` ms are ignored)
