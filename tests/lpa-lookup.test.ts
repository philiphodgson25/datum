import { describe, expect, it, vi } from 'vitest';
import { lpaLookupRequestSchema } from '../lib/schemas/lpa';
import { LpaLookupError, performLpaLookup } from '../lib/services/lpa-lookup';

describe('lpaLookupRequestSchema', () => {
  it('rejects empty address strings', () => {
    const result = lpaLookupRequestSchema.safeParse({ address: '' });
    expect(result.success).toBe(false);
  });
});

describe('performLpaLookup', () => {
  it('returns LPA data for a happy path lookup', async () => {
    const address = '10 Downing Street';

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ lat: '51.5034', lon: '-0.1276', display_name: '10 Downing Street' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const supabaseMock = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'lpa-123',
            name: 'Westminster City Council',
            reference: 'E09000033',
            entity: 'local-authority-eng',
            is_active: true
          }
        ],
        error: null
      })
    };

    const result = await performLpaLookup(address, {
      supabase: supabaseMock as any,
      fetchImpl: fetchMock,
      nominatimUserAgent: 'test-agent',
      referer: 'http://localhost:3030'
    });

    expect(result.coordinates.lat).toBeCloseTo(51.5034, 4);
    expect(result.lpa?.name).toBe('Westminster City Council');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(supabaseMock.rpc).toHaveBeenCalledWith('get_lpa_by_point', {
      lat: 51.5034,
      lng: -0.1276
    });
  });

  it('throws a not found error when geocoder returns no results', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const supabaseMock = {
      rpc: vi.fn()
    };

    await expect(
      performLpaLookup('Unknown address', {
        supabase: supabaseMock as any,
        fetchImpl: fetchMock
      })
    ).rejects.toMatchObject({
      status: 404
    });
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it('throws when Supabase RPC fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ lat: '1', lon: '1' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const supabaseMock = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'boom' }
      })
    };

    await expect(
      performLpaLookup('Somewhere', {
        supabase: supabaseMock as any,
        fetchImpl: fetchMock
      })
    ).rejects.toBeInstanceOf(LpaLookupError);
  });
});

