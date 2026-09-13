import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlightBoard } from './FlightBoard';
import { useFlightsStore } from '@/store/flightsStore';
import type { Flight } from '@/types';

const mockFlights: Flight[] = [
  {
    id: '1',
    flightNumber: 'LO123',
    airline: 'LOT',
    destination: 'Warsaw',
    departureTime: '10:00',
    terminal: 'T1',
    gate: 'A1',
    status: 'On Time',
  },
  {
    id: '2',
    flightNumber: 'FR456',
    airline: 'Ryanair',
    destination: 'Dublin',
    departureTime: '11:30',
    terminal: 'T2',
    gate: 'B3',
    status: 'Boarding',
  },
  {
    id: '3',
    flightNumber: 'LH789',
    airline: 'Lufthansa',
    destination: 'Frankfurt',
    departureTime: '12:15',
    terminal: 'T1',
    gate: 'A5',
    status: 'Delayed',
    delayMinutes: 20,
  },
];

function resetStore() {
  useFlightsStore.setState({
    flights: [],
    filters: { terminal: 'All', airline: 'All', status: 'All', destination: '' },
  });
}

describe('FlightBoard', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    resetStore();
  });

  it('renders the list of flights', () => {
    render(<FlightBoard initialFlights={mockFlights} />);

    expect(screen.getByText('LO123')).toBeInTheDocument();
    expect(screen.getByText('FR456')).toBeInTheDocument();
    expect(screen.getByText('LH789')).toBeInTheDocument();
    expect(screen.getByText('Warsaw')).toBeInTheDocument();
    expect(screen.getByText('Dublin')).toBeInTheDocument();
    expect(screen.getByText('Frankfurt')).toBeInTheDocument();
    expect(screen.getByText('3 flights')).toBeInTheDocument();
  });

  it('filters flights by terminal', async () => {
    const user = userEvent.setup();
    render(<FlightBoard initialFlights={mockFlights} />);

    const terminalSelect = screen.getByDisplayValue('All Terminals');
    await user.selectOptions(terminalSelect, 'T1');

    // Only T1 flights (LO123, LH789) remain visible
    expect(screen.getByText('LO123')).toBeInTheDocument();
    expect(screen.getByText('LH789')).toBeInTheDocument();
    expect(screen.queryByText('FR456')).not.toBeInTheDocument();
    expect(screen.getByText('2 flights')).toBeInTheDocument();
  });

  it('shows the empty state when no flights match the filters', async () => {
    const user = userEvent.setup();
    render(<FlightBoard initialFlights={mockFlights} />);

    const destinationInput = screen.getByPlaceholderText('Destination…');
    await user.type(destinationInput, 'Nowhere');

    expect(
      screen.getByText('No flights match the current filters.')
    ).toBeInTheDocument();
    expect(screen.queryByText('LO123')).not.toBeInTheDocument();
    expect(screen.getByText('0 flights')).toBeInTheDocument();
  });

  it('shows the empty state when there are no initial flights', () => {
    render(<FlightBoard initialFlights={[]} />);

    expect(
      screen.getByText('No flights match the current filters.')
    ).toBeInTheDocument();
    expect(screen.getByText('0 flights')).toBeInTheDocument();
  });

  it('filters flights by airline', async () => {
    const user = userEvent.setup();
    render(<FlightBoard initialFlights={mockFlights} />);

    const airlineSelect = screen.getByDisplayValue('All Airlines');
    await user.selectOptions(airlineSelect, 'Ryanair');

    expect(screen.getByText('FR456')).toBeInTheDocument();
    expect(screen.queryByText('LO123')).not.toBeInTheDocument();
    expect(screen.queryByText('LH789')).not.toBeInTheDocument();
    expect(screen.getByText('1 flight')).toBeInTheDocument();
  });

  it('filters flights by status', async () => {
    const user = userEvent.setup();
    render(<FlightBoard initialFlights={mockFlights} />);

    const statusSelect = screen.getByDisplayValue('All Statuses');
    await user.selectOptions(statusSelect, 'Delayed');

    expect(screen.getByText('LH789')).toBeInTheDocument();
    expect(screen.queryByText('LO123')).not.toBeInTheDocument();
    expect(screen.queryByText('FR456')).not.toBeInTheDocument();
    expect(screen.getByText('1 flight')).toBeInTheDocument();
  });

  it('filters flights by destination, case-insensitively and partially', async () => {
    const user = userEvent.setup();
    render(<FlightBoard initialFlights={mockFlights} />);

    const destinationInput = screen.getByPlaceholderText('Destination…');
    await user.type(destinationInput, 'frank');

    expect(screen.getByText('LH789')).toBeInTheDocument();
    expect(screen.queryByText('LO123')).not.toBeInTheDocument();
    expect(screen.queryByText('FR456')).not.toBeInTheDocument();
    expect(screen.getByText('1 flight')).toBeInTheDocument();
  });

  it('combines multiple active filters', async () => {
    const user = userEvent.setup();
    render(<FlightBoard initialFlights={mockFlights} />);

    const terminalSelect = screen.getByDisplayValue('All Terminals');
    await user.selectOptions(terminalSelect, 'T1');

    // T1 alone still matches LO123 and LH789
    expect(screen.getByText('2 flights')).toBeInTheDocument();

    const statusSelect = screen.getByDisplayValue('All Statuses');
    await user.selectOptions(statusSelect, 'Delayed');

    // T1 + Delayed narrows down to only LH789
    expect(screen.getByText('LH789')).toBeInTheDocument();
    expect(screen.queryByText('LO123')).not.toBeInTheDocument();
    expect(screen.getByText('1 flight')).toBeInTheDocument();
  });
});
