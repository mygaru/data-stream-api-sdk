import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_OTP = 'test-otp-token-123';
const TEST_BASE_URL = 'https://test.signals.mygaru.com';

describe('command queue', () => {
  const fetchSpy = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 200 })));
  let pending: Array<() => void>;

  beforeEach(() => {
    vi.resetModules();
    fetchSpy.mockClear();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(cb, 0));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    pending = [];
    vi.stubGlobal('window', { DataStreamApiClient: { cmd: pending } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setBool → init → setNum: both requests fire only after init', async () => {
    vi.stubGlobal('document', { cookie: `iuid=${TEST_OTP}` });

    pending.push(() => {
      window.DataStreamApiClient?.setBool('abandonedcart', true);
    });

    pending.push(() => {
      window.DataStreamApiClient?.init({ baseUrl: TEST_BASE_URL });
    });

    pending.push(() => {
      window.DataStreamApiClient?.setNum('carttotal', 42);
    });

    expect(fetchSpy).not.toHaveBeenCalled();

    await import('./browser');
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));

    const urls = fetchSpy.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain('/data-stream/set-boolean');
    expect(urls[0]).toContain('name=abandonedcart');
    expect(urls[0]).toContain('value=true');
    expect(urls[0]).toContain(`otp=${TEST_OTP}`);

    expect(urls[1]).toContain('/data-stream/set-number');
    expect(urls[1]).toContain('name=carttotal');
    expect(urls[1]).toContain('value=42');
    expect(urls[1]).toContain(`otp=${TEST_OTP}`);
  });

  it('waits for OTP via friendlyInterval when not immediately available', async () => {
    vi.stubGlobal('document', { cookie: '' });

    let otpAvailable = false;
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => {
        if (key === 'myg_otp' && otpAvailable) {
          return JSON.stringify({ id: TEST_OTP, ts: Date.now() });
        }
        return null;
      },
    });

    pending.push(() => {
      window.DataStreamApiClient?.init({ baseUrl: TEST_BASE_URL });
    });

    pending.push(() => {
      window.DataStreamApiClient?.setBool('abandonedcart', true);
    });

    await import('./browser');
    expect(fetchSpy).not.toHaveBeenCalled();

    otpAvailable = true;
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('/data-stream/set-boolean');
    expect(url).toContain(`otp=${encodeURIComponent(TEST_OTP)}`);
  });
});
