import { NextResponse } from 'next/server';

interface NHTSAResponse {
  Results: Array<Record<string, string>>;
  Count: number;
  Message: string;
  SearchCriteria: string;
}

const vinCache: Record<string, { data: NHTSAResponse, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const vin = url.searchParams.get('vin');

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required' }, { status: 400 });
    }

    // Check if we have this VIN in our short-term cache
    if (vinCache[vin] && (Date.now() - vinCache[vin].timestamp) < CACHE_DURATION) {
      return NextResponse.json({ data: vinCache[vin].data, source: 'cache' });
    }
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();

    vinCache[vin] = {
      data,
      timestamp: Date.now()
    };

    if (Object.keys(vinCache).length > 100) {
      cleanupCache();
    }

    return NextResponse.json({ data, source: 'api' });
  } catch (error) {
    console.error('Error decoding VIN:', error);
    return NextResponse.json(
      { error: 'Failed to decode VIN', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Function to clean up expired cache entries
function cleanupCache() {
  const now = Date.now();
  Object.keys(vinCache).forEach(key => {
    if ((now - vinCache[key].timestamp) > CACHE_DURATION) {
      delete vinCache[key];
    }
  });
}