#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { ShopifyClient } from "./shopify-client.js";

class ShopifyMCPServer {
  private server: Server;
  private shopifyClient: ShopifyClient;

  constructor() {
    this.server = new Server(
      {
        name: "shopify-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get Shopify configuration from environment variables
    const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
      console.error("Missing required environment variables: SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN");
      process.exit(1);
    }

    this.shopifyClient = new ShopifyClient(SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN);
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "search_products":
            return await this.handleSearchProducts(request.params.arguments);
          
          case "get_product":
            return await this.handleGetProduct(request.params.arguments);
          
          case "create_order":
            return await this.handleCreateOrder(request.params.arguments);
          
          case "list_orders":
            return await this.handleListOrders(request.params.arguments);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleSearchProducts(args: any) {
    const { query, limit = 10 } = args;
    try {
      const products = await this.shopifyClient.searchProducts(query, limit);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(products, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching products: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  private async handleGetProduct(args: any) {
    const { productId } = args;
    try {
      const product = await this.shopifyClient.getProduct(productId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(product, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting product: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  private async handleCreateOrder(args: any) {
    const { lineItems, customer, shippingAddress } = args;
    try {
      const order = await this.shopifyClient.createOrder(lineItems, customer, shippingAddress);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(order, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating order: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  private async handleListOrders(args: any) {
    const { limit = 10, status } = args;
    try {
      const orders = await this.shopifyClient.listOrders(limit, status);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(orders, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing orders: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Shopify MCP server running on stdio");
  }
}

async function main() {
  const server = new ShopifyMCPServer();
  await server.run();
}

main().catch(console.error);