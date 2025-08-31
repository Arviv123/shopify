#!/usr/bin/env node

// Professional Multi-Store Web Interface - Render Optimized
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { ShopifyClient } from './build/shopify-client.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render requires process.env.PORT
const PORT = process.env.PORT || 8080;

// Initialize with environment variables - no defaults for security
const STORE_URL = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

console.log(`🏪 Connecting to store: ${STORE_URL || 'Not configured'}`);
console.log(`🔑 Using token: ${ACCESS_TOKEN ? '[CONFIGURED]' : 'Not provided'}`);

// Initialize Shopify client
let shopifyClient;
try {
  if (STORE_URL && ACCESS_TOKEN) {
    shopifyClient = new ShopifyClient(STORE_URL, ACCESS_TOKEN);
  }
} catch (error) {
  console.error('❌ Failed to initialize Shopify client:', error.message);
}

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.static('public'));

// Store connections registry for multi-store support
const storeConnections = new Map();
const orderTracker = new Map();

// Runtime configuration storage
let runtimeConfig = {
  storeUrl: STORE_URL,
  accessToken: ACCESS_TOKEN
};

// Add default store connection if credentials provided
if (shopifyClient && STORE_URL && ACCESS_TOKEN) {
  const defaultStoreId = 'default-store';
  storeConnections.set(defaultStoreId, {
    id: defaultStoreId,
    name: 'My Store',
    url: STORE_URL,
    token: ACCESS_TOKEN,
    client: shopifyClient,
    connected: true
  });
  console.log('✅ Default store connected successfully');
}

// Health check endpoint (required by Render)
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Extended health check with details
app.get('/health/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mcp-shopify-server',
    version: '1.0.0',
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    storesConnected: storeConnections.size,
    shopifyConnected: shopifyClient ? true : false
  });
});

// API: Get store status
app.get('/api/config', (req, res) => {
  res.json({
    isConnected: storeConnections.size > 0,
    totalStores: storeConnections.size,
    defaultStore: runtimeConfig.storeUrl || 'לא הוגדר',
    lastConnected: new Date().toISOString()
  });
});

// API: Test Shopify connection
app.post('/api/config/test', async (req, res) => {
  try {
    const { storeUrl, accessToken } = req.body;
    
    if (!storeUrl || !accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Store URL and access token are required' 
      });
    }

    // Test connection by creating a temporary client
    const testClient = new ShopifyClient(storeUrl, accessToken);
    await testClient.searchProducts('', 1); // Try to fetch 1 product
    
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.json({ 
      success: false, 
      error: error.message.includes('401') ? 'Invalid access token' : 
             error.message.includes('404') ? 'Store not found' :
             'Connection failed'
    });
  }
});

// API: Save configuration and restart connection
app.post('/api/config/save', async (req, res) => {
  try {
    const { storeUrl, accessToken } = req.body;
    
    if (!storeUrl || !accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Store URL and access token are required' 
      });
    }

    // Test connection first
    const testClient = new ShopifyClient(storeUrl, accessToken);
    await testClient.searchProducts('', 1);
    
    // Update runtime config
    runtimeConfig.storeUrl = storeUrl;
    runtimeConfig.accessToken = accessToken;
    
    // Clear existing connections
    storeConnections.clear();
    
    // Create new connection
    const newClient = new ShopifyClient(storeUrl, accessToken);
    const defaultStoreId = 'default-store';
    storeConnections.set(defaultStoreId, {
      id: defaultStoreId,
      name: 'My Store',
      url: storeUrl,
      token: accessToken,
      client: newClient,
      connected: true
    });
    
    console.log('✅ Configuration updated successfully');
    console.log(`🏪 New store: ${storeUrl}`);
    
    res.json({ 
      success: true, 
      message: 'Configuration saved successfully',
      storeUrl,
      connected: true
    });
  } catch (error) {
    console.error('Configuration save failed:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message.includes('401') ? 'Invalid access token' : 
             error.message.includes('404') ? 'Store not found' :
             'Failed to save configuration'
    });
  }
});

// API: Search products (main functionality)
app.post('/api/chat/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`🔍 Searching for: "${query}"`);
    
    const allResults = [];
    
    // Search across all connected stores
    for (const [storeId, store] of storeConnections) {
      try {
        const products = await store.client.searchProducts(query, 10);
        
        products.forEach(product => {
          allResults.push({
            id: product.id,
            title: product.title,
            price: product.variants[0]?.price || '0',
            vendor: product.vendor || 'Unknown',
            type: product.product_type || '',
            image: product.images[0]?.src || '',
            storeId: storeId,
            storeName: store.name
          });
        });
        
      } catch (error) {
        console.error(`Search failed for store ${store.name}:`, error.message);
      }
    }

    // Sort by price
    allResults.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    res.json({
      success: true,
      query,
      results: allResults,
      totalResults: allResults.length,
      aiResponse: generateSimpleResponse(query, allResults),
      stores: Array.from(storeConnections.values()).map(store => ({
        id: store.id,
        name: store.name,
        connected: store.connected
      }))
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message,
      success: false 
    });
  }
});

// API: Create order
app.post('/api/order/create', async (req, res) => {
  try {
    const { productId, storeId, quantity = 1, customerInfo = {} } = req.body;
    
    const store = storeConnections.get(storeId || 'default-store');
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get product details
    const products = await store.client.listProducts(100);
    const product = products.find(p => p.id.toString() === productId.toString());
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variantId = product.variants[0]?.id;
    if (!variantId) {
      return res.status(400).json({ error: 'No variants available' });
    }

    // Default customer info
    const defaultCustomer = {
      email: customerInfo.email || 'customer@example.com',
      firstName: customerInfo.firstName || 'לקוח',
      lastName: customerInfo.lastName || 'חדש'
    };

    const defaultAddress = {
      address1: 'רחוב ראשי 1',
      city: 'תל אביב', 
      province: 'מרכז',
      country: 'IL',
      zip: '12345'
    };

    const lineItems = [{
      variant_id: variantId,
      quantity: quantity,
      price: product.variants[0].price
    }];

    // Create order
    const order = await store.client.createOrder(lineItems, defaultCustomer, defaultAddress);
    
    const trackingId = uuidv4();
    orderTracker.set(trackingId, {
      orderId: order.id,
      orderNumber: order.order_number || order.name,
      storeId,
      storeName: store.name,
      productTitle: product.title,
      quantity,
      customer: defaultCustomer,
      total: order.total_price,
      currency: 'ILS',
      status: 'pending_payment',
      createdAt: new Date(),
      shopifyOrder: order
    });

    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number || order.name,
      trackingId: trackingId,
      total: order.total_price,
      currency: 'ILS',
      message: 'Order created successfully!'
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ 
      error: 'Order creation failed', 
      message: error.message,
      success: false 
    });
  }
});

// API: Track order
app.get('/api/order/track/:trackingId', (req, res) => {
  try {
    const { trackingId } = req.params;
    const order = orderTracker.get(trackingId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      order: {
        trackingId,
        orderNumber: order.orderNumber,
        productTitle: order.productTitle,
        quantity: order.quantity,
        total: order.total,
        currency: order.currency,
        status: order.status,
        storeName: order.storeName,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple response generator
function generateSimpleResponse(query, products) {
  const count = products.length;
  const query_lower = query.toLowerCase();
  
  if (count === 0) {
    return `😔 לא מצאתי מוצרים עבור "${query}". אנא הגדר תחילה את החיבור לשופיפי ב/config או נסו חיפוש אחר.`;
  }

  let response = `🛍️ מצאתי ${count} מוצרים עבור "${query}":\n\n`;
  
  if (query_lower.includes('iphone') || query_lower.includes('טלפון')) {
    response += '📱 כאן הטלפונים והאביזרים הכי טובים! ';
  } else if (query_lower.includes('laptop') || query_lower.includes('מחשב')) {
    response += '💻 מחשבים מתקדמים למשרד ולבית! ';
  } else if (query_lower.includes('headphone') || query_lower.includes('אוזני')) {
    response += '🎵 איכות שמע מעולה לחוויה מושלמת! ';
  }
  
  response += `המחירים מתחילים מ-₪${Math.min(...products.map(p => parseFloat(p.price || 0)))}. `;
  response += 'לחצו על "פרטים" לקבלת מידע נוסף או "הוסף לסל" להזמנה!';
  
  return response;
}

// Static file routes
app.get('/shop', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache', 
    'Expires': '0',
    'Last-Modified': new Date().toUTCString()
  });
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/config', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'config.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/flights', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'flights.html'));
});

app.get('/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful shutdown for Render rolling updates
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP Shopify Server running on port ${PORT}`);
  console.log(`📊 Dashboard: /dashboard`);
  console.log(`💬 Chat: /chat`);
  console.log(`🛍️ Shop: /shop`);
  console.log(`🔧 Config: /config`);
  console.log(`🏥 Health: /health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Store: ${runtimeConfig.storeUrl || 'Not configured - visit /config'}`);
  console.log(`Connected stores: ${storeConnections.size}`);
});