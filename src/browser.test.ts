import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_OTP = 'test-otp-token-123';
const TEST_BASE_URL = 'https://test.signals.mygaru.com';

describe('command queue', () => {
  const fetchSpy = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 200 })));
  let pending: Array<() => void>;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('document', { cookie: `iuid=${TEST_OTP}` });
    pending = [];
    vi.stubGlobal('window', { DataStreamApiClient: { cmd: pending } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('setBool → init → setNum: both requests fire only after init', async () => {
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

    expect(urls[1]).toContain('/data-stream/set-number');
    expect(urls[1]).toContain('name=carttotal');
    expect(urls[1]).toContain('value=42');
  });
});
