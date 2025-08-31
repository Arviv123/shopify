#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { ShopifyClient } from "./shopify-client.js";
import { FlightAPI } from "./flight-api.js";
// Get Shopify configuration from environment variables
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    console.error("Missing required environment variables: SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN");
    process.exit(1);
}
const shopifyClient = new ShopifyClient(SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN);
const flightAPI = new FlightAPI();
const server = new Server({
    name: "shopify-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_products",
                description: "Search for products in the Shopify store",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query for products"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of products to return",
                            default: 10
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_product",
                description: "Get detailed information about a specific product",
                inputSchema: {
                    type: "object",
                    properties: {
                        productId: {
                            type: "string",
                            description: "The product ID"
                        }
                    },
                    required: ["productId"]
                }
            },
            {
                name: "create_order",
                description: "Create a new order in the Shopify store",
                inputSchema: {
                    type: "object",
                    properties: {
                        lineItems: {
                            type: "array",
                            description: "Array of line items for the order",
                            items: {
                                type: "object",
                                properties: {
                                    variantId: {
                                        type: "string",
                                        description: "Product variant ID"
                                    },
                                    quantity: {
                                        type: "number",
                                        description: "Quantity to order"
                                    }
                                },
                                required: ["variantId", "quantity"]
                            }
                        },
                        customer: {
                            type: "object",
                            description: "Customer information",
                            properties: {
                                email: {
                                    type: "string",
                                    description: "Customer email"
                                },
                                firstName: {
                                    type: "string",
                                    description: "Customer first name"
                                },
                                lastName: {
                                    type: "string",
                                    description: "Customer last name"
                                }
                            },
                            required: ["email"]
                        },
                        shippingAddress: {
                            type: "object",
                            description: "Shipping address",
                            properties: {
                                address1: {
                                    type: "string",
                                    description: "Address line 1"
                                },
                                address2: {
                                    type: "string",
                                    description: "Address line 2"
                                },
                                city: {
                                    type: "string",
                                    description: "City"
                                },
                                province: {
                                    type: "string",
                                    description: "Province/State"
                                },
                                country: {
                                    type: "string",
                                    description: "Country"
                                },
                                zip: {
                                    type: "string",
                                    description: "ZIP/Postal code"
                                }
                            },
                            required: ["address1", "city", "country"]
                        }
                    },
                    required: ["lineItems", "customer", "shippingAddress"]
                }
            },
            {
                name: "list_orders",
                description: "List recent orders from the Shopify store",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            description: "Maximum number of orders to return",
                            default: 10
                        },
                        status: {
                            type: "string",
                            description: "Filter by order status",
                            enum: ["open", "closed", "cancelled", "any"]
                        }
                    }
                }
            },
            {
                name: "compare_products",
                description: "Compare products by category with price analysis",
                inputSchema: {
                    type: "object",
                    properties: {
                        searchTerm: {
                            type: "string",
                            description: "Search term to find similar products for comparison"
                        }
                    },
                    required: ["searchTerm"]
                }
            },
            {
                name: "find_best_deals",
                description: "Find the best deals across all products",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            description: "Maximum number of deals to return",
                            default: 10
                        }
                    }
                }
            },
            {
                name: "search_by_vendor",
                description: "Search products from a specific vendor with price sorting",
                inputSchema: {
                    type: "object",
                    properties: {
                        vendor: {
                            type: "string",
                            description: "Vendor name to search for"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of products to return",
                            default: 20
                        }
                    },
                    required: ["vendor"]
                }
            },
            {
                name: "products_by_price_range",
                description: "Find products within a specific price range",
                inputSchema: {
                    type: "object",
                    properties: {
                        minPrice: {
                            type: "number",
                            description: "Minimum price in currency"
                        },
                        maxPrice: {
                            type: "number",
                            description: "Maximum price in currency"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of products to return",
                            default: 20
                        }
                    },
                    required: ["minPrice", "maxPrice"]
                }
            },
            {
                name: "search_flights",
                description: "Search for flights between airports with dates and preferences",
                inputSchema: {
                    type: "object",
                    properties: {
                        origin: {
                            type: "string",
                            description: "Origin airport code (e.g., TLV, JFK) or city name",
                            default: "TLV"
                        },
                        destination: {
                            type: "string",
                            description: "Destination airport code or city name"
                        },
                        departureDate: {
                            type: "string",
                            description: "Departure date in YYYY-MM-DD format"
                        },
                        returnDate: {
                            type: "string",
                            description: "Return date in YYYY-MM-DD format (optional)"
                        },
                        passengers: {
                            type: "number",
                            description: "Number of passengers",
                            default: 1
                        },
                        class: {
                            type: "string",
                            description: "Travel class preference",
                            enum: ["Economy", "Business", "First"],
                            default: "Economy"
                        },
                        maxStops: {
                            type: "number",
                            description: "Maximum number of stops (0 for direct flights)",
                            default: 2
                        },
                        maxPrice: {
                            type: "number",
                            description: "Maximum price in ILS"
                        }
                    },
                    required: ["destination", "departureDate"]
                }
            },
            {
                name: "get_flight_details",
                description: "Get detailed information about a specific flight",
                inputSchema: {
                    type: "object",
                    properties: {
                        flightId: {
                            type: "string",
                            description: "The flight ID"
                        }
                    },
                    required: ["flightId"]
                }
            },
            {
                name: "get_popular_destinations",
                description: "Get list of popular flight destinations from an origin airport",
                inputSchema: {
                    type: "object",
                    properties: {
                        origin: {
                            type: "string",
                            description: "Origin airport code",
                            default: "TLV"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of destinations to return",
                            default: 10
                        }
                    }
                }
            },
            {
                name: "search_airports",
                description: "Search for airports by city name or airport code",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query (city name, airport code, or airport name)"
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "book_flight",
                description: "Book a flight with passenger information",
                inputSchema: {
                    type: "object",
                    properties: {
                        flightId: {
                            type: "string",
                            description: "The flight ID to book"
                        },
                        passenger: {
                            type: "object",
                            description: "Passenger information",
                            properties: {
                                firstName: {
                                    type: "string",
                                    description: "Passenger first name"
                                },
                                lastName: {
                                    type: "string",
                                    description: "Passenger last name"
                                },
                                email: {
                                    type: "string",
                                    description: "Passenger email address"
                                },
                                phone: {
                                    type: "string",
                                    description: "Passenger phone number"
                                }
                            },
                            required: ["firstName", "lastName", "email"]
                        }
                    },
                    required: ["flightId", "passenger"]
                }
            }
        ]
    };
});
// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        switch (request.params.name) {
            case "search_products": {
                const { query, limit = 10 } = request.params.arguments;
                try {
                    const products = await shopifyClient.searchProducts(query, limit);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(products, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error searching products: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "get_product": {
                const { productId } = request.params.arguments;
                try {
                    const product = await shopifyClient.getProduct(productId);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(product, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error getting product: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "create_order": {
                const { lineItems, customer, shippingAddress } = request.params.arguments;
                try {
                    const order = await shopifyClient.createOrder(lineItems, customer, shippingAddress);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(order, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error creating order: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "list_orders": {
                const { limit = 10, status } = request.params.arguments;
                try {
                    const orders = await shopifyClient.listOrders(limit, status);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(orders, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error listing orders: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "compare_products": {
                const { searchTerm } = request.params.arguments;
                try {
                    const comparison = await shopifyClient.compareProducts(searchTerm);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(comparison, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error comparing products: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "find_best_deals": {
                const { limit = 10 } = request.params.arguments;
                try {
                    const deals = await shopifyClient.findBestDeals(limit);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(deals, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error finding best deals: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "search_by_vendor": {
                const { vendor, limit = 20 } = request.params.arguments;
                try {
                    const products = await shopifyClient.searchByVendor(vendor, limit);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(products, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error searching by vendor: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "products_by_price_range": {
                const { minPrice, maxPrice, limit = 20 } = request.params.arguments;
                try {
                    const products = await shopifyClient.getProductsInPriceRange(minPrice, maxPrice, limit);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(products, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error finding products in price range: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            // ===== FLIGHT API TOOLS =====
            case "search_flights": {
                const searchParams = request.params.arguments;
                try {
                    const flights = await flightAPI.searchFlights(searchParams);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(flights, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error searching flights: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "get_flight_details": {
                const { flightId } = request.params.arguments;
                try {
                    const flightDetails = await flightAPI.getFlightDetails(flightId);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(flightDetails, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error getting flight details: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "get_popular_destinations": {
                const { origin = "TLV", limit = 10 } = request.params.arguments;
                try {
                    const destinations = await flightAPI.getPopularDestinations(origin, limit);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(destinations, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error getting popular destinations: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "search_airports": {
                const { query } = request.params.arguments;
                try {
                    const airports = await flightAPI.searchAirports(query);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(airports, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error searching airports: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            case "book_flight": {
                const { flightId, passenger } = request.params.arguments;
                try {
                    const booking = await flightAPI.bookFlight(flightId, passenger);
                    return {
                        content: [{
                                type: "text",
                                text: JSON.stringify(booking, null, 2)
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error booking flight: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }]
                    };
                }
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
    }
    catch (error) {
        throw new McpError(ErrorCode.InternalError, `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Shopify MCP server running on stdio");
}
main().catch(console.error);
//# sourceMappingURL=index.js.map