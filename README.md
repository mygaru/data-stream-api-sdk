# @mygaru/data-stream-api-sdk

The myGaru Data Stream API is a mechanism provided to myGaru partners for collecting real-time data signals about user behavior on their website and adding the gathered information to the profiles of existing customers. The collected data can later be used to build audience segments for both targeting and analytics purposes.

**Requirements:** Node.js ≥ 20.

## Init

Add the loader snippet inside `<head>`. It creates the command queue, loads the SDK asynchronously, and calls `init` once the script is ready:

```html
<script>
(function(w,d,n,u,c){
  w[n]=w[n]||{};w[n].cmd=w[n].cmd||[];
  var e=d.createElement("script");e.async=true;e.src=u;
  e.onload=function(){w[n].init(c);};
  var f=d.getElementsByTagName("script")[0];f.parentNode.insertBefore(e,f);
})(window,document,"DataStreamApiClient","https://dsalib.mgaru.dev/dsa.global.js",{baseUrl:"https://[client_id].signals.mygaru.com"});
</script>
```

## Quick start

All SDK calls should be wrapped in `cmd.push`. Commands pushed before `init` are queued and executed in order once the SDK is ready. Commands pushed after `init` execute immediately.

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
