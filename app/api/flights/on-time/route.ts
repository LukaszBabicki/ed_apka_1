import { NextResponse } from 'next/server';
import { readFlights } from '@/lib/flights';

// GET /api/flights/on-time — flights with status "On Time"
export async function GET() {
  console.log('[API]', 'flights/on-time');

  const flights = readFlights();
  const onTimeFlights = flights.filter((f) => f.status === 'On Time');

  return NextResponse.json(onTimeFlights);
}
