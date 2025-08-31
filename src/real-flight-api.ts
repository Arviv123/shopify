import axios from 'axios';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class: string;
}

export interface FlightResult {
  success: boolean;
  flights?: any[];
  error?: string;
}

export interface BookingParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passengers: number;
}

export class RealFlightAPI {
  private amadeus: any;
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor() {
    // Initialize with environment variables
    this.initializeAmadeus();
  }

  private async initializeAmadeus() {
    // Amadeus credentials should be in environment variables
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    const isProduction = process.env.AMADEUS_ENVIRONMENT === 'production';

    if (!clientId || !clientSecret) {
      console.warn('⚠️ Amadeus API credentials not found. Using demo mode.');
      return;
    }

    // Get access token
    await this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      const baseUrl = process.env.AMADEUS_ENVIRONMENT === 'production' 
        ? 'https://api.amadeus.com' 
        : 'https://test.api.amadeus.com';

      if (!clientId || !clientSecret) {
        return false;
      }

      const response = await axios.post(`${baseUrl}/v1/security/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ Amadeus API token refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to refresh Amadeus token:', error.message);
      return false;
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      return await this.refreshAccessToken();
    }
    return true;
  }

  private getApiUrl(): string {
    return process.env.AMADEUS_ENVIRONMENT === 'production' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com';
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightResult> {
    console.log('🔍 Real Flight API search:', params);

    // Check if we have valid API credentials
    const hasValidToken = await this.ensureValidToken();
    if (!hasValidToken) {
      console.log('⚠️ No valid API token, falling back to demo data');
      return this.getDemoFlights(params);
    }

    try {
      const searchParams = {
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.passengers,
        travelClass: this.mapTravelClass(params.class),
        currencyCode: 'USD',
        max: 10
      };

      console.log('🌐 Calling Amadeus API with params:', searchParams);

      const response = await axios.get(`${this.getApiUrl()}/v2/shopping/flight-offers`, {
        params: searchParams,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ Amadeus API response received');
      
      const flights = this.transformAmadeusResponse(response.data);
      
      return {
        success: true,
        flights
      };

    } catch (error: any) {
      console.error('❌ Amadeus API error:', error.message);
      
      // If API fails, fallback to demo data
      console.log('🔄 Falling back to demo data');
      return this.getDemoFlights(params);
    }
  }

  private mapTravelClass(clientClass: string): string {
    const classMap: { [key: string]: string } = {
      'Economy': 'ECONOMY',
      'Business': 'BUSINESS',
      'First': 'FIRST'
    };
    return classMap[clientClass] || 'ECONOMY';
  }

  private transformAmadeusResponse(data: any): any[] {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((offer: any) => {
      const itinerary = offer.itineraries[0];
      const segment = itinerary.segments[0];
      
      return {
        id: offer.id,
        flightNumber: segment.carrierCode + segment.number,
        airline: this.getAirlineName(segment.carrierCode),
        origin: {
          code: segment.departure.iataCode,
          city: segment.departure.iataCode // You might want to map this to city names
        },
        destination: {
          code: segment.arrival.iataCode,
          city: segment.arrival.iataCode
        },
        departure: segment.departure.at,
        arrival: segment.arrival.at,
        duration: itinerary.duration.replace('PT', '').replace('H', 'ש ').replace('M', 'ד'),
        stops: itinerary.segments.length - 1,
        class: offer.travelerPricings[0].fareDetailsBySegment[0].cabin,
        price: {
          amount: parseFloat(offer.price.total),
          currency: offer.price.currency,
          formatted: `${offer.price.currency} ${offer.price.total}`
        },
        aircraft: segment.aircraft?.code || 'N/A',
        baggage: {
          carryOn: 'כבודה ידנית כלולה'
        },
        bookingUrl: '#',
        validatingAirlineCodes: offer.validatingAirlineCodes,
        originalOffer: offer // Keep original for booking
      };
    });
  }

  private getAirlineName(code: string): string {
    const airlines: { [key: string]: string } = {
      'LY': 'אל על',
      'TK': 'Turkish Airlines',
      'LH': 'Lufthansa',
      'BA': 'British Airways',
      'EK': 'Emirates',
      'AF': 'Air France',
      'KL': 'KLM',
      'AZ': 'Alitalia',
      'OS': 'Austrian Airlines',
      'LX': 'Swiss International'
    };
    return airlines[code] || `${code} Airlines`;
  }

  async getFlightDetails(flightId: string): Promise<any> {
    // In a real implementation, you would fetch specific flight details
    return {
      success: true,
      flight: {
        id: flightId,
        // ... other flight details
      }
    };
  }

  async bookFlight(flightId: string, passengerInfo: BookingParams): Promise<any> {
    console.log('📝 Booking flight:', flightId, passengerInfo);

    // This is a complex process with Amadeus that requires:
    // 1. Flight offer search
    // 2. Flight offer pricing
    // 3. Flight create order
    // 4. Payment processing

    // For now, return a simulated booking response
    return {
      success: true,
      booking: {
        bookingId: `BK${Date.now()}`,
        pnr: this.generatePNR(),
        totalPrice: Math.floor(Math.random() * 2000) + 500,
        status: 'confirmed',
        flightId,
        passenger: passengerInfo
      }
    };
  }

  private generatePNR(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
  }

  async getPopularDestinations(origin: string = 'TLV', limit: number = 10): Promise<any> {
    // In a real implementation, this would use Amadeus Airport & City Search
    // or Travel Recommendations API
    
    const destinations = [
      { code: 'JFK', city: 'ניו יורק', minPrice: 800 },
      { code: 'LHR', city: 'לונדון', minPrice: 350 },
      { code: 'CDG', city: 'פריז', minPrice: 280 },
      { code: 'FCO', city: 'רומא', minPrice: 220 },
      { code: 'IST', city: 'איסטנבול', minPrice: 180 },
      { code: 'DXB', city: 'דובאי', minPrice: 320 },
      { code: 'FRA', city: 'פרנקפורט', minPrice: 290 },
      { code: 'LAX', city: 'לוס אנג\'לס', minPrice: 900 }
    ];

    return {
      success: true,
      destinations: destinations.slice(0, limit)
    };
  }

  private getDemoFlights(params: FlightSearchParams): FlightResult {
    console.log('🎭 Using demo flight data for:', params);
    
    const destinations: { [key: string]: string } = {
      'JFK': 'ניו יורק',
      'LHR': 'לונדון',
      'CDG': 'פריז',
      'FCO': 'רומא',
      'IST': 'איסטנבול',
      'DXB': 'דובאי',
      'FRA': 'פרנקפורט',
      'LAX': 'לוס אנג\'לס'
    };

    const destinationName = destinations[params.destination] || params.destination;
    const departureDate = new Date(params.departureDate);
    
    const demoFlights = [
      {
        id: `DEMO_${params.destination}_001`,
        flightNumber: 'LY315',
        airline: 'אל על',
        origin: { code: params.origin, city: 'תל אביב' },
        destination: { code: params.destination, city: destinationName },
        departure: new Date(departureDate.getTime() + 8 * 3600000).toISOString(),
        arrival: new Date(departureDate.getTime() + 14 * 3600000).toISOString(),
        duration: '6ש 00ד',
        stops: 0,
        class: params.class,
        price: {
          amount: Math.floor(Math.random() * 1000) + 500,
          currency: 'USD',
          formatted: `$${Math.floor(Math.random() * 1000) + 500}`
        },
        aircraft: 'Boeing 787',
        baggage: { carryOn: 'כבודה ידנית 8 ק״ג' },
        bookingUrl: '#'
      },
      {
        id: `DEMO_${params.destination}_002`,
        flightNumber: 'TK1560',
        airline: 'Turkish Airlines',
        origin: { code: params.origin, city: 'תל אביב' },
        destination: { code: params.destination, city: destinationName },
        departure: new Date(departureDate.getTime() + 11 * 3600000).toISOString(),
        arrival: new Date(departureDate.getTime() + 19 * 3600000).toISOString(),
        duration: '8ש 00ד',
        stops: 1,
        class: params.class,
        price: {
          amount: Math.floor(Math.random() * 800) + 400,
          currency: 'USD',
          formatted: `$${Math.floor(Math.random() * 800) + 400}`
        },
        aircraft: 'Airbus A330',
        baggage: { carryOn: 'כבודה ידנית 8 ק״ג' },
        bookingUrl: '#'
      }
    ];

    return {
      success: true,
      flights: demoFlights.slice(0, Math.floor(Math.random() * 2) + 1)
    };
  }
}