declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SHOPIFY_STORE_URL?: string;
      SHOPIFY_ACCESS_TOKEN?: string;
      FLIGHT_API_KEY?: string;
      AMADEUS_API_KEY?: string;
      KIWI_API_KEY?: string;
      AMADEUS_CLIENT_ID?: string;
      AMADEUS_CLIENT_SECRET?: string;
      AMADEUS_ENVIRONMENT?: string;
      AI_PROVIDER?: string;
      AI_API_KEY?: string;
      AI_MODEL?: string;
      WEB_PORT?: string;
      NODE_ENV?: string;
    }
  }
}

export {};
