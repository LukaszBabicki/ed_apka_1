import { NextResponse } from 'next/server';
import { readFlights } from '@/lib/flights';
import type { Airline } from '@/types';

// GET /api/airlines — list of unique airlines present in the flight data
export async function GET() {
  console.log('[API]', 'airlines');

  const flights = readFlights();
  const airlines = Array.from(new Set(flights.map((f) => f.airline))) as Airline[];

  return NextResponse.json(airlines);
}
