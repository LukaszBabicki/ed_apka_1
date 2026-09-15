import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { readFlights, writeFlights, resetToSeed, formatDepartureTime12h } from '@/lib/flights';
import type { Flight } from '@/types';

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}));

const mockedFs = vi.mocked(fs);

const dataPath = path.join(process.cwd(), 'data', 'flights.json');
const seedPath = path.join(process.cwd(), 'data', 'flights.seed.json');

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: '1',
    flightNumber: 'LO123',
    airline: 'LOT',
    destination: 'Warsaw',
    departureTime: '12:00',
    terminal: 'T1',
    gate: 'A1',
    status: 'On Time',
    ...overrides,
  };
}

describe('readFlights', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // "aktualny czas" ustawiony na 10:00, żeby statusy lotów były deterministyczne
    vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    mockedFs.readFileSync.mockReset();
    mockedFs.writeFileSync.mockReset();
  });

  it('wczytuje loty z pliku i przelicza status na podstawie aktualnego czasu (happy path)', () => {
    const flights = [makeFlight({ id: '1', departureTime: '09:00', status: 'On Time' })];
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(flights));

    const result = readFlights();

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(dataPath, 'utf-8');
    // 10:00 jest ponad 10 minut po 09:00, więc lot powinien być "Departed"
    expect(result).toEqual([expect.objectContaining({ id: '1', status: 'Departed' })]);
  });

  it('zwraca pustą tablicę, gdy plik zawiera pustą listę lotów (edge case)', () => {
    mockedFs.readFileSync.mockReturnValue('[]');

    const result = readFlights();

    expect(result).toEqual([]);
  });

  it('oznacza lot jako "Boarding", gdy odlot jest w ciągu najbliższych 25 minut', () => {
    const flights = [makeFlight({ departureTime: '10:20' })];
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(flights));

    const result = readFlights();

    expect(result[0].status).toBe('Boarding');
  });

  it('oznacza lot jako "Delayed", gdy ma delayMinutes i nie jest jeszcze boarding/departed', () => {
    const flights = [makeFlight({ departureTime: '11:00', delayMinutes: 15 })];
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(flights));

    const result = readFlights();

    expect(result[0].status).toBe('Delayed');
  });

  it('nie zmienia statusu lotu odwołanego, nawet jeśli czas odlotu już minął (brakujące/nietypowe pole)', () => {
    const flights = [
      makeFlight({ departureTime: '01:00', status: 'Cancelled', delayMinutes: undefined }),
    ];
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(flights));

    const result = readFlights();

    expect(result[0].status).toBe('Cancelled');
  });

  it('przelicza status na poprawną wartość z enum, nawet jeśli dane wejściowe mają nieprawidłowy status', () => {
    const flights = [
      // status spoza FlightStatus - dane z zewnątrz mogą być nieściśle typowane (np. z pliku JSON)
      makeFlight({ departureTime: '12:00', status: 'Unknown' as Flight['status'] }),
    ];
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(flights));

    const result = readFlights();

    expect(result[0].status).toBe('On Time');
  });
});

describe('writeFlights', () => {
  afterEach(() => {
    mockedFs.writeFileSync.mockReset();
  });

  it('zapisuje listę lotów jako sformatowany JSON do pliku danych (happy path)', () => {
    const flights = [makeFlight()];

    writeFlights(flights);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      dataPath,
      JSON.stringify(flights, null, 2),
      'utf-8'
    );
  });

  it('zapisuje pustą listę lotów bez błędu (edge case)', () => {
    writeFlights([]);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(dataPath, '[]', 'utf-8');
  });
});

describe('formatDepartureTime12h', () => {
  it('formatuje czas przedpołudniowy do formatu 12-godzinnego (happy path)', () => {
    expect(formatDepartureTime12h('09:05')).toBe('9:05 AM');
  });

  it('formatuje czas popołudniowy do formatu 12-godzinnego (happy path)', () => {
    expect(formatDepartureTime12h('13:45')).toBe('1:45 PM');
  });

  it('formatuje północ (00:00) jako 12:00 AM (edge case)', () => {
    expect(formatDepartureTime12h('00:00')).toBe('12:00 AM');
  });

  it('formatuje południe (12:00) jako 12:00 PM (edge case)', () => {
    expect(formatDepartureTime12h('12:00')).toBe('12:00 PM');
  });

  it('formatuje ostatnią minutę doby (23:59) jako 11:59 PM (edge case)', () => {
    expect(formatDepartureTime12h('23:59')).toBe('11:59 PM');
  });
});

describe('resetToSeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    mockedFs.readFileSync.mockReset();
    mockedFs.writeFileSync.mockReset();
  });

  it('wczytuje dane z pliku seed i zapisuje je do pliku danych, nigdy nie modyfikując seeda (happy path)', () => {
    const seed = [makeFlight({ departureTime: '12:00' })];
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(seed));

    const result = resetToSeed();

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(seedPath, 'utf-8');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      dataPath,
      JSON.stringify(seed, null, 2),
      'utf-8'
    );
    // resetToSeed nigdy nie powinien zapisywać do pliku seed danych
    expect(mockedFs.writeFileSync).not.toHaveBeenCalledWith(
      seedPath,
      expect.anything(),
      expect.anything()
    );
    expect(result[0].status).toBe('On Time');
  });

  it('obsługuje pusty plik seed bez błędu (edge case)', () => {
    mockedFs.readFileSync.mockReturnValue('[]');

    const result = resetToSeed();

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(dataPath, '[]', 'utf-8');
    expect(result).toEqual([]);
  });
});
