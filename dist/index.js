// src/utils/cookie.utils.ts
var parseCookies = () => {
  const cookie = globalThis.document?.cookie;
  if (!cookie) return {};
  return cookie.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};
var readCookie = (name) => {
  try {
    const cookies = parseCookies();
    return cookies[name];
  } catch {
    return void 0;
  }
};

// src/services/errors.ts
var DataStreamApiError = class extends Error {
  constructor(code, message) {
    super(`[${code}] - ${message}`);
    this.code = code;
    this.name = "DataStreamApiError";
  }
};

// src/utils/validation.utils.ts
var FIELD_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;
var normalizeBaseUrl = (url) => {
  const baseUrl = url.trim();
  if (baseUrl === "") {
    throw new DataStreamApiError("CONFIGURATION_ERROR", "Provide a non-empty baseUrl");
  }
  return baseUrl.replace(/\/+$/, "");
};
var validateOtp = (value) => {
  if (typeof value !== "string") {
    throw new DataStreamApiError("VALIDATION_ERROR", "Pass a non-empty otp value");
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DataStreamApiError("VALIDATION_ERROR", "Pass a non-empty otp value");
  }
  return trimmed;
};
var validateFieldName = (name) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed === "" || !FIELD_NAME_PATTERN.test(trimmed)) {
    throw new DataStreamApiError(
      "VALIDATION_ERROR",
      "Field name must be non-empty and contain only alphanumeric characters of the English alphabet and the underscore character"
    );
  }
  return trimmed;
};

// src/utils/errors.utils.ts
var handleAPIError = (response) => {
  const message = response.statusText || "Unknown API error";
  if (response.status >= 500) {
    throw new DataStreamApiError("SERVER_ERROR", message);
  }
  switch (response.status) {
    case 400:
      throw new DataStreamApiError("VALIDATION_ERROR", message);
    case 401:
    case 403:
      throw new DataStreamApiError("AUTHENTICATION_ERROR", message);
    case 404:
      throw new DataStreamApiError("NOT_FOUND", message);
    case 405:
      throw new DataStreamApiError("METHOD_NOT_ALLOWED", message);
    case 429:
      throw new DataStreamApiError("RATE_LIMIT_ERROR", message);
    default:
      throw new DataStreamApiError("HTTP_ERROR", message);
  }
};
var handleNetworkError = (error) => {
  const originalMessage = error.message || "Unknown network error";
  const normalizedMessage = originalMessage.toLowerCase();
  if (error.name === "AbortError" || normalizedMessage.includes("timeout")) {
    throw new DataStreamApiError("TIMEOUT_ERROR", originalMessage);
  }
  if (normalizedMessage.includes("fetch") || normalizedMessage.includes("network")) {
    throw new DataStreamApiError("NETWORK_ERROR", originalMessage);
  }
  throw new DataStreamApiError("UNKNOWN_ERROR", originalMessage);
};

// src/utils/helpers.utils.ts
var trimSlashes = (value) => value.replace(/^\/+|\/+$/g, "");

// src/utils/query.utils.ts
var buildQuery = (baseUrl, normalizedRelativePath, query) => {
  const base = baseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}${normalizedRelativePath}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
};

// src/services/client-request.ts
var DEFAULT_REQUEST_TIMEOUT_MS = 15e3;
var ClientRequest = class {
  constructor(config) {
    this.config = config;
    if (typeof fetch !== "function") {
      throw new DataStreamApiError("CONFIGURATION_ERROR", "Fetch API is not available");
    }
  }
  async get(relativePath, query = {}) {
    return await this.request("GET", relativePath, query);
  }
  async request(method, relativePath, query) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
    try {
      const path = `/data-stream/${trimSlashes(relativePath)}`;
      const url = buildQuery(this.config.baseUrl, path, query ?? {});
      const response = await fetch(url, {
        method,
        signal: controller.signal
      });
      if (!response.ok) {
        handleAPIError(response);
      }
      return Promise.resolve();
    } catch (error) {
      handleNetworkError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

// src/services/client.ts
var DataStreamApiClient = class {
  constructor(config) {
    if (!config.baseUrl) {
      throw new DataStreamApiError("CONFIGURATION_ERROR", "Base URL is required");
    }
    const baseUrl = normalizeBaseUrl(config.baseUrl);
    this.requestClient = new ClientRequest({
      baseUrl
    });
  }
  resolveOtp() {
    const otp = readCookie("iuid");
    if (otp) {
      return validateOtp(otp);
    }
    throw new DataStreamApiError("VALIDATION_ERROR", "OTP is required");
  }
  async setText(name, value) {
    const fieldName = validateFieldName(name);
    if (typeof value !== "string" || value.trim() === "") {
      throw new DataStreamApiError(
        "VALIDATION_ERROR",
        "Invalid value for setText - expected a non-empty string"
      );
    }
    const otp = this.resolveOtp();
    return await this.requestClient.get("/set-label", {
      otp,
      name: fieldName,
      label: value
    });
  }
  async addText(name, value, delimiter) {
    const fieldName = validateFieldName(name);
    if (typeof value !== "string") {
      throw new DataStreamApiError(
        "VALIDATION_ERROR",
        "Invalid value for addText - expected a string"
      );
    }
    if (typeof delimiter !== "string" || delimiter.length === 0) {
      throw new DataStreamApiError(
        "VALIDATION_ERROR",
        "Invalid delimiter for addText - expected a non-empty string"
      );
    }
    const otp = this.resolveOtp();
    return await this.requestClient.get("/add-label", {
      otp,
      name: fieldName,
      label: value
    });
  }
  async setNum(name, value) {
    const fieldName = validateFieldName(name);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new DataStreamApiError(
        "VALIDATION_ERROR",
        "Invalid value for setNum - expected a finite number"
      );
    }
    const otp = this.resolveOtp();
    return await this.requestClient.get("/set-number", {
      otp,
      name: fieldName,
      value
    });
  }
  async stepNum(name, step) {
    const fieldName = validateFieldName(name);
    if (typeof step !== "number" || !Number.isFinite(step)) {
      throw new DataStreamApiError(
        "VALIDATION_ERROR",
        "Invalid step for stepNum - expected a finite number"
      );
    }
    const otp = this.resolveOtp();
    return await this.requestClient.get("/step-number", {
      otp,
      name: fieldName,
      value: step
    });
  }
  async setBool(name, value) {
    const fieldName = validateFieldName(name);
    if (typeof value !== "boolean") {
      throw new DataStreamApiError(
        "VALIDATION_ERROR",
        "Invalid value for setBool - expected a boolean"
      );
    }
    const otp = this.resolveOtp();
    return await this.requestClient.get("/set-boolean", {
      otp,
      name: fieldName,
      value
    });
  }
};
export {
  DataStreamApiClient,
  DataStreamApiError
};
//# sourceMappingURL=index.js.map