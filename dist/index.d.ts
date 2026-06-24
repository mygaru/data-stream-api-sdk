interface DataStreamApi {
    setText(name: string, value: string): Promise<void>;
    addText(name: string, value: string): Promise<void>;
    setNum(name: string, value: number): Promise<void>;
    stepNum(name: string, step: number): Promise<void>;
    setBool(name: string, value: boolean): Promise<void>;
}

type DataStreamApiErrorCode = 'CONFIGURATION_ERROR' | 'VALIDATION_ERROR' | 'AUTHENTICATION_ERROR' | 'NOT_FOUND' | 'METHOD_NOT_ALLOWED' | 'RATE_LIMIT_ERROR' | 'SERVER_ERROR' | 'HTTP_ERROR' | 'TIMEOUT_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
declare class DataStreamApiError extends Error {
    readonly code: DataStreamApiErrorCode;
    constructor(code: DataStreamApiErrorCode, message: string);
}

interface DataStreamApiConfig {
    baseUrl: string;
}

interface BrowserDataStreamApi extends DataStreamApi {
    cmd: Array<() => void>;
    init(config: DataStreamApiConfig): DataStreamApiClient;
    Error: typeof DataStreamApiError;
}
declare global {
    interface Window {
        DataStreamApiClient?: BrowserDataStreamApi;
    }
}

declare class DataStreamApiClient implements DataStreamApi {
    private readonly requestClient;
    private cachedOtp;
    constructor(config: DataStreamApiConfig);
    probeOtp(): string | null;
    lockOtp(otp: string): void;
    private resolveOtp;
    private readLocalStorageOtp;
    setText(name: string, value: string): Promise<void>;
    addText(name: string, value: string): Promise<void>;
    setNum(name: string, value: number): Promise<void>;
    stepNum(name: string, step: number): Promise<void>;
    setBool(name: string, value: boolean): Promise<void>;
}

export { type DataStreamApi, DataStreamApiClient, type DataStreamApiConfig, DataStreamApiError };
