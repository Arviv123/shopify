#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ShopifyClient } from './shopify-client.js';

// Initialize Shopify client - will be null if credentials not provided
const STORE_URL = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

let shopifyClient: ShopifyClient | null = null;

if (STORE_URL && ACCESS_TOKEN) {
  try {
    shopifyClient = new ShopifyClient(STORE_URL, ACCESS_TOKEN);
    console.error('✅ Shopify client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Shopify client:', error);
  }
} else {
  console.error('⚠️ Shopify credentials not provided - some tools will not be available');
  console.error('Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN environment variables');
}

const server = new Server(
  {
    name: 'shopify-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const shopifyTools = shopifyClient ? [
    {
      name: 'search_products',
      description: 'Search for products in the Shopify store by query term',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for products (title, description, tags, etc.)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of products to return (default: 10, max: 250)',
            default: 10
          }
        },
        required: ['query']
      }
    },
    {
      name: 'get_product_details',
      description: 'Get detailed information about a specific product by ID',
      inputSchema: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The Shopify product ID'
          }
        },
        required: ['productId']
      }
    },
    {
      name: 'list_products',
      description: 'List all products in the store with optional limit',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of products to return (default: 10, max: 250)',
            default: 10
          }
        }
      }
    },
    {
      name: 'create_order',
      description: 'Create a new order with specified line items and customer information',
      inputSchema: {
        type: 'object',
        properties: {
          lineItems: {
            type: 'array',
            description: 'Array of line items for the order',
            items: {
              type: 'object',
              properties: {
                variantId: { type: 'string', description: 'Product variant ID' },
                quantity: { type: 'number', description: 'Quantity to order' }
              },
              required: ['variantId', 'quantity']
            }
          },
          customer: {
            type: 'object',
            description: 'Customer information',
            properties: {
              email: { type: 'string', description: 'Customer email' },
              firstName: { type: 'string', description: 'Customer first name' },
              lastName: { type: 'string', description: 'Customer last name' }
            },
            required: ['email']
          },
          shippingAddress: {
            type: 'object',
            description: 'Shipping address',
            properties: {
              address1: { type: 'string', description: 'Street address' },
              address2: { type: 'string', description: 'Apartment, suite, etc.' },
              city: { type: 'string', description: 'City' },
              province: { type: 'string', description: 'State/Province' },
              country: { type: 'string', description: 'Country code (e.g., US, CA)' },
              zip: { type: 'string', description: 'Postal/ZIP code' }
            },
            required: ['address1', 'city', 'country']
          }
        },
        required: ['lineItems', 'customer', 'shippingAddress']
      }
    },
    {
      name: 'list_orders',
      description: 'List orders from the store with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of orders to return (default: 10)',
            default: 10
          },
          status: {
            type: 'string',
            description: 'Order status filter (open, closed, cancelled, any)',
            enum: ['open', 'closed', 'cancelled', 'any']
          }
        }
      }
    },
    {
      name: 'compare_products',
      description: 'Compare products by search term and analyze prices across categories',
      inputSchema: {
        type: 'object',
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Search term to find and compare products'
          }
        },
        required: ['searchTerm']
      }
    },
    {
      name: 'find_best_deals',
      description: 'Find the best deals across all products based on price analysis',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of deals to return (default: 10)',
            default: 10
          }
        }
      }
    },
    {
      name: 'search_by_vendor',
      description: 'Search for products by vendor/brand name',
      inputSchema: {
        type: 'object',
        properties: {
          vendor: {
            type: 'string',
            description: 'Vendor/brand name to search for'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of products to return (default: 20)',
            default: 20
          }
        },
        required: ['vendor']
      }
    }
  ] : [];

  return {
    tools: shopifyTools
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!shopifyClient) {
    throw new McpError(
      ErrorCode.InternalError,
      'Shopify client not initialized. Please set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN environment variables.'
    );
  }

  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_products': {
        const { query, limit = 10 } = args as { query: string; limit?: number };
        const products = await shopifyClient.searchProducts(query, limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query,
                count: products.length,
                products: products.map(p => ({
                  id: p.id,
                  title: p.title,
                  price: p.variants[0]?.price || 'N/A',
                  vendor: p.vendor,
                  type: p.product_type,
                  status: p.status,
                  image: p.images[0]?.src || null,
                  variants: p.variants.length,
                  created_at: p.created_at
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'get_product_details': {
        const { productId } = args as { productId: string };
        const product = await shopifyClient.getProduct(productId);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(product, null, 2)
            }
          ]
        };
      }

      case 'list_products': {
        const { limit = 10 } = args as { limit?: number };
        const products = await shopifyClient.listProducts(limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: products.length,
                products: products.map(p => ({
                  id: p.id,
                  title: p.title,
                  price: p.variants[0]?.price || 'N/A',
                  vendor: p.vendor,
                  type: p.product_type,
                  status: p.status,
                  image: p.images[0]?.src || null,
                  variants: p.variants.length,
                  created_at: p.created_at
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'create_order': {
        const { lineItems, customer, shippingAddress } = args as {
          lineItems: Array<{ variantId: string; quantity: number }>;
          customer: { email: string; firstName?: string; lastName?: string };
          shippingAddress: {
            address1: string;
            address2?: string;
            city: string;
            province?: string;
            country: string;
            zip?: string;
          };
        };

        const order = await shopifyClient.createOrder(lineItems, customer, shippingAddress);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                order: {
                  id: order.id,
                  order_number: order.order_number,
                  total_price: order.total_price,
                  currency: order.currency,
                  financial_status: order.financial_status,
                  fulfillment_status: order.fulfillment_status,
                  created_at: order.created_at,
                  customer_email: order.email,
                  line_items_count: order.line_items.length
                }
              }, null, 2)
            }
          ]
        };
      }

      case 'list_orders': {
        const { limit = 10, status } = args as { limit?: number; status?: string };
        const orders = await shopifyClient.listOrders(limit, status);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: orders.length,
                orders: orders.map(o => ({
                  id: o.id,
                  order_number: o.order_number,
                  total_price: o.total_price,
                  currency: o.currency,
                  financial_status: o.financial_status,
                  fulfillment_status: o.fulfillment_status,
                  created_at: o.created_at,
                  updated_at: o.updated_at,
                  customer_email: o.email,
                  line_items_count: o.line_items.length
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'compare_products': {
        const { searchTerm } = args as { searchTerm: string };
        const comparison = await shopifyClient.compareProducts(searchTerm);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                searchTerm,
                comparison
              }, null, 2)
            }
          ]
        };
      }

      case 'find_best_deals': {
        const { limit = 10 } = args as { limit?: number };
        const deals = await shopifyClient.findBestDeals(limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: deals.length,
                deals: deals.map(p => ({
                  id: p.id,
                  title: p.title,
                  price: p.variants[0]?.price || 'N/A',
                  vendor: p.vendor,
                  type: p.product_type,
                  dealScore: (p as any).dealScore,
                  image: p.images[0]?.src || null
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'search_by_vendor': {
        const { vendor, limit = 20 } = args as { vendor: string; limit?: number };
        const products = await shopifyClient.searchByVendor(vendor, limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                vendor,
                count: products.length,
                products: products.map(p => ({
                  id: p.id,
                  title: p.title,
                  price: p.variants[0]?.price || 'N/A',
                  vendor: p.vendor,
                  type: p.product_type,
                  image: p.images[0]?.src || null,
                  created_at: p.created_at
                }))
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 MCP Shopify Server running on stdio');
  console.error('🏪 Store URL:', STORE_URL || 'Not configured');
  console.error('🔑 Access Token:', ACCESS_TOKEN ? 'Configured' : 'Not configured');
}

runServer().catch(console.error);