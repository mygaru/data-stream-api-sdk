# @mygaru/data-stream-api-sdk

The myGaru Data Stream API is a mechanism provided to myGaru partners for collecting real-time data signals about user behavior on their website and adding the gathered information to the profiles of existing customers. The collected data can later be used to build audience segments for both targeting and analytics purposes.

**Requirements:** Node.js ≥ 20.

## Install

```bash
# npm
npm install @mygaru/data-stream-api-sdk

# Yarn
yarn add @mygaru/data-stream-api-sdk
```

or use the init script in the `<head>`
```bash
<script>(function(w,d,n,u,c){var t=w[n]||{};t.q=t.q||[];w[n]=new Proxy(t,{get:function(o,k){if(k==="q")return o.q;if(k==="then"||typeof k==="symbol"||k==="Error")return;if(Object.prototype.hasOwnProperty.call(o,k))return o[k];return function(){var a=[k];for(var i=0;i<arguments.length;i++)a.push(arguments[i]);o.q.push(a);}}});var e=d.createElement("script");e.async=true;e.src=u;e.onload=function(){w[n].init(c);};var f=d.getElementsByTagName("script")[0];f.parentNode.insertBefore(e,f);})(window,document,"DataStreamApiClient","[../dist/browser.global.js](https://test/data-stream-api-sdk/dist/browser.global.js)",{baseUrl:"[client_id].signals.mygaru.com"});</script>
```

## Quick start

ESM
```typescript
import { DataStreamApiClient } from "@mygaru/data-stream-api-sdk";

const dsClient = new DataStreamApiClient({ baseUrl: "https://[client_id].signals.mygaru.com" });

await dsClient.setText("destinations_of_interest", "France,Greece");

```

IIFE

```typescript
await window.DataStreamApiClient.setText("destinations_of_interest", "France,Greece");
```





### Text operations

- **`setText(name, value)`** — sets the value of a field, where **`name`** — the name of the column created by the administrator on the portal and **`value`** is attribute in a text format
```typescript
await dsClient.setText("destinations_of_interest", "France,Greece"); 

 ```
- **`addText(name, value, delimeter)`** — adds a specified text to the column identified by the parameter name; **`value`** is attribute in a text format and **`"delimiter"`** - parameter defines how values are separated in a text column.

- For example, calling **`addText("destinations_of_interest", "Thailand", ",")`** will update the column so that if it already contains "France,Greece", the resulting value becomes "France,Greece,Thailand".
```typescript
await dsClient.addText("destinations_of_interest", "Thailand", ","); 
 ```

### Numeric operations

- **`setNum(name, value)`** — sets the column value, where **`value`** is attribute in a numeric format representing a measurable quantity.

```typescript
await dsClient.setNum("cart_total_amount", 89.99);
```
- **`stepNum(name, step)`** — changes the column value by the specified **`"step"`**. Positive step increments the value, negative step decrements the value.

```typescript
await dsClient.stepNum("electronics_page_views", 1);
```

### Boolean operations

- **`setBool(name, value)`** — sets the field value, where **`"value"`** is boolean.

```typescript
await dsClient.setBool("abandoned_cart", true);
```

## Scripts
| Script | Command | Description |
| --- | --- | --- |
| `build` | `tsup` | Builds `dist/index.js` (ESM) and `dist/browser.global.js` (IIFE). |
| `typecheck` | `tsc --noEmit` + `tsc -p tsconfig.node.json` | Validates TypeScript without emitting files. |
| `lint` | `biome check src --write` | Runs Biome linter/formatter. |
| `clean` | `rm -rf dist` | Deletes the build output directory. |
| `prepublishOnly` | `clean` → `typecheck` → `lint` → `build` | Runs automatically before `npm publish`. |
