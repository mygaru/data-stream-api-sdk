# Requirements

## OTP (One-Time Pass)

OTP absence is a **stop factor**. The SDK must not send any requests until a valid OTP is resolved. The resolution chain is:

1. Cookie `iuid`
2. localStorage `myg_otp` (JSON `{id, ts, carrier}`, 1 week TTL)

If neither source yields  a value, the SDK polls via `friendlyInterval` (100ms inside, 60s timeout). The queue remains blocked until OTP is found.

OTP is resolved **once** per session and cached — it must not change mid-session.

## Command Queue

All public SDK methods (`setText`, `addText`, `setNum`, `stepNum`, `setBool`) **must** be called through the `cmd.push` queue. This is a hard requirement for all integrations.

```javascript
DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.init({ baseUrl: "https://[client_id].signals.mygaru.com" });
});

DataStreamApiClient.cmd.push(function () {
  DataStreamApiClient.setText("field", "value");
});
```

- Commands pushed before `init()` are queued and executed in order once the SDK is ready (OTP resolved).
- Commands pushed after `init()` execute immediately.
- Direct method calls (without `cmd.push`) are internally deferred until init + OTP resolution, but the `cmd.push` pattern is the supported integration contract.

## Init

The SDK loads via a plain `<script async>` tag. No IIFE wrapper, no Proxy. The `init()` call itself goes through `cmd.push`.

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

## Field Names

Field names must contain only Latin characters (A-Z, a-z) and spaces. No underscores, digits, or special characters.
