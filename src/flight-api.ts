// Flight API Integration Module

interface Airport {
  code: string;
  name: string;
  city: string;
  country?: string;
}

interface Price {
  amount: number;
  currency: string;
  formatted: string;
}

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: Price;
  class: string;
  available: boolean;
  bookingUrl: string;
  searchRelevance?: number;
}

interface FlightSearchParams {
  origin?: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  class?: string;
  maxStops?: number;
  maxPrice?: number;
}

interface FlightSearchResult {
  success: boolean;
  searchParams?: FlightSearchParams;
  totalFlights?: number;
  flights?: Flight[];
  searchId?: string;
  timestamp?: string;
  error?: string;
}

interface FlightBooking {
  bookingId: string;
  flight: Flight;
  passenger: any;
  status: string;
  pnr: string;
  totalPrice: number;
  bookingDate: string;
  ticketNumber: string;
}

interface PopularDestination {
  code: string;
  city: string;
  country: string;
  minPrice: number;
}

export class FlightAPI {
    private apiKey: string;
    private baseURL: string;
    private fallbackProviders: any[];
    private mockFlights: Flight[];
    private airports: Record<string, Airport>;

    constructor() {
        // Configuration - these should be set via environment variables
        this.apiKey = process.env.FLIGHT_API_KEY || 'demo_key';
        this.baseURL = 'https://api.skyscanner.net/flights/v3'; // Using Skyscanner as example
        this.fallbackProviders = [
            {
                name: 'Amadeus',
                baseURL: 'https://test.api.amadeus.com/v2/shopping/flight-offers',
                key: process.env.AMADEUS_API_KEY
            },
            {
                name: 'Kiwi',
                baseURL: 'https://api.tequila.kiwi.com/v2/search',
                key: process.env.KIWI_API_KEY
            }
        ];
        
        // Mock data for demonstration
        this.mockFlights = [
            {
                id: 'FL001',
                airline: 'El Al',
                flightNumber: 'LY315',
                origin: { code: 'TLV', name: 'בן גוריון', city: 'תל אביב' },
                destination: { code: 'JFK', name: 'John F. Kennedy', city: 'ניו יורק' },
                departure: '2025-01-15T10:30:00Z',
                arrival: '2025-01-15T16:45:00Z',
                duration: '11h 15m',
                stops: 0,
                price: {
                    amount: 2850,
                    currency: 'ILS',
                    formatted: '₪2,850'
                },
                class: 'Economy',
                available: true,
                bookingUrl: 'https://booking.elal.com/flight/FL001'
            },
            {
                id: 'FL002',
                airline: 'Lufthansa',
                flightNumber: 'LH686',
                origin: { code: 'TLV', name: 'בן גוריון', city: 'תל אביב' },
                destination: { code: 'FRA', name: 'Frankfurt', city: 'פרנקפורט' },
                departure: '2025-01-15T14:20:00Z',
                arrival: '2025-01-15T18:30:00Z',
                duration: '5h 10m',
                stops: 0,
                price: {
                    amount: 1650,
                    currency: 'ILS',
                    formatted: '₪1,650'
                },
                class: 'Economy',
                available: true,
                bookingUrl: 'https://booking.lufthansa.com/flight/FL002'
            },
            {
                id: 'FL003',
                airline: 'Turkish Airlines',
                flightNumber: 'TK864',
                origin: { code: 'TLV', name: 'בן גוריון', city: 'תל אביב' },
                destination: { code: 'IST', name: 'Istanbul Airport', city: 'איסטנבול' },
                departure: '2025-01-15T23:55:00Z',
                arrival: '2025-01-16T02:45:00Z',
                duration: '3h 50m',
                stops: 0,
                price: {
                    amount: 980,
                    currency: 'ILS',
                    formatted: '₪980'
                },
                class: 'Economy',
                available: true,
                bookingUrl: 'https://booking.turkishairlines.com/flight/FL003'
            },
            {
                id: 'FL004',
                airline: 'British Airways',
                flightNumber: 'BA165',
                origin: { code: 'TLV', name: 'בן גוריון', city: 'תל אביב' },
                destination: { code: 'LHR', name: 'Heathrow', city: 'לונדון' },
                departure: '2025-01-15T08:15:00Z',
                arrival: '2025-01-15T12:20:00Z',
                duration: '5h 05m',
                stops: 0,
                price: {
                    amount: 2200,
                    currency: 'ILS',
                    formatted: '₪2,200'
                },
                class: 'Economy',
                available: true,
                bookingUrl: 'https://booking.ba.com/flight/FL004'
            },
            {
                id: 'FL005',
                airline: 'Emirates',
                flightNumber: 'EK927',
                origin: { code: 'TLV', name: 'בן גוריון', city: 'תל אביב' },
                destination: { code: 'DXB', name: 'Dubai International', city: 'דובאי' },
                departure: '2025-01-15T16:40:00Z',
                arrival: '2025-01-15T22:15:00Z',
                duration: '4h 35m',
                stops: 0,
                price: {
                    amount: 1800,
                    currency: 'ILS',
                    formatted: '₪1,800'
                },
                class: 'Economy',
                available: true,
                bookingUrl: 'https://booking.emirates.com/flight/FL005'
            }
        ];

        // Popular airports in Israel and worldwide
        this.airports = {
            'TLV': { code: 'TLV', name: 'בן גוריון', city: 'תל אביב', country: 'ישראל' },
            'VDA': { code: 'VDA', name: 'עובדה', city: 'אילת', country: 'ישראל' },
            'JFK': { code: 'JFK', name: 'John F. Kennedy', city: 'ניו יורק', country: 'ארה״ב' },
            'LAX': { code: 'LAX', name: 'Los Angeles International', city: 'לוס אנג\'לס', country: 'ארה״ב' },
            'LHR': { code: 'LHR', name: 'Heathrow', city: 'לונדון', country: 'בריטניה' },
            'CDG': { code: 'CDG', name: 'Charles de Gaulle', city: 'פריז', country: 'צרפת' },
            'FRA': { code: 'FRA', name: 'Frankfurt', city: 'פרנקפורט', country: 'גרמניה' },
            'IST': { code: 'IST', name: 'Istanbul Airport', city: 'איסטנבול', country: 'טורקיה' },
            'DXB': { code: 'DXB', name: 'Dubai International', city: 'דובאי', country: 'איחוד האמירויות' },
            'FCO': { code: 'FCO', name: 'Leonardo da Vinci', city: 'רומא', country: 'איטליה' }
        };
    }

    // Search flights with comprehensive parameters
    async searchFlights(searchParams: FlightSearchParams): Promise<FlightSearchResult> {
        try {
            console.log('🛫 Flight search request:', searchParams);
            
            const {
                origin = 'TLV',
                destination,
                departureDate,
                returnDate = null,
                passengers = 1,
                class: travelClass = 'Economy',
                maxStops = 2,
                maxPrice = null
            } = searchParams;

            // Validate required parameters
            if (!destination || !departureDate) {
                throw new Error('Origin, destination, and departure date are required');
            }

            // For demo purposes, we'll use mock data
            // In production, this would call the actual API
            let flights = this.mockFlights.filter(flight => {
                const matchesDestination = !destination || 
                    flight.destination.code === destination.toUpperCase() ||
                    flight.destination.city.includes(destination) ||
                    flight.destination.name.toLowerCase().includes(destination.toLowerCase());
                
                const matchesOrigin = flight.origin.code === origin.toUpperCase();
                
                const matchesClass = !travelClass || flight.class === travelClass;
                
                const matchesPrice = !maxPrice || flight.price.amount <= maxPrice;
                
                const matchesStops = flight.stops <= maxStops;

                return matchesDestination && matchesOrigin && matchesClass && matchesPrice && matchesStops;
            });

            // Sort by price
            flights = flights.sort((a, b) => a.price.amount - b.price.amount);

            // Add search metadata
            const result = {
                success: true,
                searchParams,
                totalFlights: flights.length,
                flights: flights.map(flight => ({
                    ...flight,
                    searchRelevance: this.calculateRelevance(flight, searchParams)
                })),
                searchId: `search_${Date.now()}`,
                timestamp: new Date().toISOString()
            };

            console.log(`✈️ Found ${flights.length} flights`);
            return result;

        } catch (error) {
            console.error('❌ Flight search error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                flights: []
            };
        }
    }

    // Calculate relevance score for flights
    private calculateRelevance(flight: Flight, searchParams: FlightSearchParams): number {
        let score = 1;
        
        // Boost direct flights
        if (flight.stops === 0) score += 0.3;
        
        // Boost cheaper flights
        if (flight.price.amount < 2000) score += 0.2;
        
        // Boost popular airlines
        const popularAirlines = ['El Al', 'Lufthansa', 'Emirates', 'British Airways'];
        if (popularAirlines.includes(flight.airline)) score += 0.1;
        
        return Math.min(score, 2.0);
    }

    // Get flight details by ID
    async getFlightDetails(flightId: string): Promise<any> {
        try {
            const flight = this.mockFlights.find(f => f.id === flightId);
            if (!flight) {
                throw new Error('Flight not found');
            }

            return {
                success: true,
                flight: {
                    ...flight,
                    baggage: {
                        carryOn: '8kg חינם',
                        checked: 'תיק 23kg - ₪150'
                    },
                    amenities: ['WiFi', 'ארוחה', 'בידור'],
                    cancellation: 'ביטול בתשלום עד 24 שעות לפני הטיסה',
                    aircraft: 'Boeing 737-800'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Get popular destinations from a specific origin
    async getPopularDestinations(origin: string = 'TLV', limit: number = 10): Promise<any> {
        try {
            // Mock popular destinations from Tel Aviv
            const popularDestinations = [
                { code: 'JFK', city: 'ניו יורק', country: 'ארה״ב', minPrice: 2800 },
                { code: 'LHR', city: 'לונדון', country: 'בריטניה', minPrice: 2200 },
                { code: 'CDG', city: 'פריז', country: 'צרפת', minPrice: 1900 },
                { code: 'FRA', city: 'פרנקפורט', country: 'גרמניה', minPrice: 1650 },
                { code: 'IST', city: 'איסטנבול', country: 'טורקיה', minPrice: 980 },
                { code: 'DXB', city: 'דובאי', country: 'איחוד האמירויות', minPrice: 1800 },
                { code: 'FCO', city: 'רומא', country: 'איטליה', minPrice: 1750 },
                { code: 'LAX', city: 'לוס אנג\'לס', country: 'ארה״ב', minPrice: 3200 }
            ];

            return {
                success: true,
                origin,
                destinations: popularDestinations.slice(0, limit)
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Search airports by query
    async searchAirports(query: string): Promise<any> {
        try {
            const results = Object.entries(this.airports)
                .filter(([code, airport]) => 
                    code.toLowerCase().includes(query.toLowerCase()) ||
                    airport.name.toLowerCase().includes(query.toLowerCase()) ||
                    airport.city.toLowerCase().includes(query.toLowerCase()) ||
                    airport.city.includes(query) // Hebrew search
                )
                .map(([code, airport]) => ({
                    ...airport
                }));

            return {
                success: true,
                query,
                airports: results
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Mock booking function
    async bookFlight(flightId: string, passengerInfo: any): Promise<any> {
        try {
            const flight = this.mockFlights.find(f => f.id === flightId);
            if (!flight) {
                throw new Error('Flight not found');
            }

            const bookingId = `BK${Date.now()}`;
            const booking = {
                bookingId,
                flight,
                passenger: passengerInfo,
                status: 'Confirmed',
                pnr: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                totalPrice: flight.price.amount,
                bookingDate: new Date().toISOString(),
                ticketNumber: `226-${Math.random().toString().substr(2, 10)}`
            };

            return {
                success: true,
                booking,
                message: 'Flight booked successfully!'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}