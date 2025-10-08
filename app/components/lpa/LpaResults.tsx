'use client';

import React, { useMemo } from 'react';
import { useLpaLookup } from '../../../lib/hooks/useLpaLookup';

type Props = {
  address: string;
  onUseCurrentAddress?: () => void;
  showTestButtons?: boolean;
};

export default function LpaResults({ address, onUseCurrentAddress, showTestButtons = false }: Props) {
  const { lookupByAddress, lookupByPoint, loading, error, data, stats, statsLoading, statsError } = useLpaLookup();

  const status = useMemo(() => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (!data) return 'idle';
    if (!data?.lpa) return 'empty';
    return 'success';
  }, [loading, error, data]);

  const activeText =
    data?.lpa?.is_active === true ? 'Active' : data?.lpa?.is_active === false ? 'Historical' : 'Unknown';
  const activeClass =
    data?.lpa?.is_active === true ? 'text-green-700' : data?.lpa?.is_active === false ? 'text-yellow-700' : 'text-gray-600';

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => lookupByAddress(address)}
          disabled={!address || loading}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Check Local Planning Authority'}
        </button>
        {onUseCurrentAddress ? (
          <button
            type="button"
            onClick={onUseCurrentAddress}
            className="text-xs text-blue-700 underline"
          >
            Use current address
          </button>
        ) : null}
      </div>

      {/* Results card */}
      <div className="mt-3">
        {status === 'idle' ? null : null}
        {status === 'loading' ? (
          <div className="rounded border border-gray-200 bg-white p-3 text-sm">Looking up LPA…</div>
        ) : null}
        {status === 'error' ? (
          <div className="rounded border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : null}
        {status === 'empty' ? (
          <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">No LPA found for this address.</p>
          </div>
        ) : null}
        {status === 'success' ? (
          <div className="rounded border border-green-200 bg-green-50 p-3">
            <div className="text-sm">
              <div className="font-medium text-green-900">Local Planning Authority</div>
              <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1">
                <div>
                  <span className="text-gray-500">Name:</span> <span className="text-gray-900">{data?.lpa?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Reference:</span> <span className="text-gray-900">{data?.lpa?.reference}</span>
                </div>
                <div>
                  <span className="text-gray-500">Entity:</span> <span className="text-gray-900">{data?.lpa?.entity}</span>
                </div>
                <div>
                  <span className={`text-gray-500`}>Status:</span>{' '}
                  <span className={activeClass}>{activeText}</span>
                </div>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-green-800">Show raw boundary</summary>
                <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs text-gray-800">
{JSON.stringify(data?.lpa?.boundary, null, 2)}
                </pre>
              </details>

              {data?.coordinates ? (
                <div className="mt-2 text-xs text-gray-600">
                  Coordinates: lat {data.coordinates.lat}, lng {data.coordinates.lng}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Stats grid */}
      <div className="mt-3">
        {statsLoading ? (
          <div className="text-xs text-gray-600">Loading LPA stats…</div>
        ) : null}
        {statsError ? (
          <div className="rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">{statsError}</div>
        ) : null}
      </div>

      {stats ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4">
          <div className="rounded border border-gray-200 bg-white p-2">
            <div className="text-gray-500">Total</div>
            <div className="font-medium text-gray-900">{stats.total_lpas}</div>
          </div>
          <div className="rounded border border-gray-200 bg-white p-2">
            <div className="text-gray-500">Active</div>
            <div className="font-medium text-gray-900">{stats.active_lpas}</div>
          </div>
          <div className="rounded border border-gray-200 bg-white p-2">
            <div className="text-gray-500">Historical</div>
            <div className="font-medium text-gray-900">{stats.historical_lpas}</div>
          </div>
          <div className="rounded border border-gray-200 bg-white p-2">
            <div className="text-gray-500">With Boundaries</div>
            <div className="font-medium text-gray-900">{stats.with_boundaries}</div>
          </div>
        </div>
      ) : null}

      {showTestButtons ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
            onClick={() => lookupByPoint(51.5072, -0.1276)}
          >
            Test London lat/lng
          </button>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
            onClick={() => lookupByPoint(53.4808, -2.2426)}
          >
            Test Manchester lat/lng
          </button>
        </div>
      ) : null}
    </div>
  );
}

