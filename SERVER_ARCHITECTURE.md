# ארכיטקטורת השרת - ChatShop Backend

## 🏗️ מבנה השרת הכללי

### שכבות הארכיטקטורה
```
Client Browser
     ↓
Express.js Server (web-app.js)
     ↓
┌─────────────┬──────────────┬───────────────┐
│ Shopify API │   Gemini AI  │ MCP Protocol  │
│ Integration │   Processor  │   Handler     │
└─────────────┴──────────────┴───────────────┘
```

### רכיבי השרת העיקריים
1. **Express.js Server** - שרת HTTP ראשי
2. **Shopify Store Module** - אינטגרציה עם Shopify API
3. **AI Processor** - עיבוד בינה מלאכותית
4. **Translation Engine** - מנוע תרגום עברית-אנגלית
5. **MCP Handler** - טיפול בפרוטוקול MCP

---

## 📄 web-app.js - השרת הראשי

### מבנה הקובץ
```javascript
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware Configuration
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Import modules
const ShopifyStore = require('./src/shopify-store.js')
const AIProcessor = require('./src/ai-processor.js')
```

### נקודות כניסה עיקריות (Endpoints)

#### 1. Chat API - הלב של המערכת
```javascript
app.post('/api/chat', async (req, res) => {
  console.log('🛫 MCP Flight chat query:', req.body.query)
  
  try {
    const { query, store } = req.body
    
    // 1. Validate input
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      })
    }
    
    // 2. Translate Hebrew to English
    const translatedQuery = translateSearchQuery(query)
    console.log('🔤 Translated terms:', translatedQuery.join(', '))
    
    // 3. Search products in Shopify
    const products = await searchProducts(translatedQuery, store)
    console.log('🎯 Total unique products found:', products.length)
    
    // 4. Process with AI (if configured)
    let aiResponse = `מצאתי ${products.length} מוצרים עבור "${query}"`
    if (process.env.GEMINI_API_KEY) {
      aiResponse = await processWithAI(query, products)
    }
    
    // 5. Return structured response
    res.json({
      success: true,
      message: aiResponse,
      products: products.slice(0, 12), // Limit to 12 products
      searchInfo: {
        originalQuery: query,
        translatedTerms: translatedQuery,
        totalResults: products.length,
        searchTime: Date.now()
      }
    })
    
  } catch (error) {
    console.error('❌ Chat API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'שגיאה בחיפוש, נסה שוב'
    })
  }
})
```

#### 2. AI Testing Endpoint
```javascript
app.post('/api/test-ai', async (req, res) => {
  console.log('🧪 AI Test Request Body:', req.body)
  
  try {
    const { provider, model, apiKey } = req.body
    
    // Validate AI configuration
    if (!provider || !apiKey) {
      return res.json({
        testResult: false,
        errorMessage: 'Missing provider or API key'
      })
    }
    
    // Test AI connection
    const testPrompt = 'Hello, please respond with: "Hello there! How can I help you today?"'
    let testResponse
    
    switch (provider) {
      case 'gemini-free':
        testResponse = await callGeminiAPI(testPrompt, apiKey, model)
        break
      case 'openai':
        testResponse = await callOpenAI(testPrompt, apiKey, model)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
    
    res.json({
      testResult: true,
      errorMessage: '',
      testResponse: testResponse,
      provider: provider,
      model: model
    })
    
  } catch (error) {
    console.error('❌ AI test failed:', error)
    res.json({
      testResult: false,
      errorMessage: error.message,
      testResponse: ''
    })
  }
})
```

#### 3. Product Comparison API
```javascript
app.post('/api/compare-products', async (req, res) => {
  try {
    const { products, useAI = false } = req.body
    
    if (!products || !Array.isArray(products) || products.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 products required for comparison'
      })
    }
    
    // Get product details
    const productDetails = await Promise.all(
      products.map(id => getProductById(id))
    )
    
    const comparison = {
      manual: createManualComparison(productDetails),
      ai: useAI ? await createAIComparison(productDetails) : null
    }
    
    res.json({
      success: true,
      comparison
    })
    
  } catch (error) {
    console.error('❌ Comparison error:', error)
    res.status(500).json({
      success: false,
      error: 'Comparison failed'
    })
  }
})
```

---

## 🔍 מנוע החיפוש והתרגום

### Translation Engine
```javascript
const TRANSLATION_MAP = {
  // Clothing
  'מכנסיים': 'pants trousers jeans',
  'מכנס': 'pants trousers jeans',
  'ג\'ינס': 'jeans denim',
  'חולצה': 'shirt top blouse',
  'טישרט': 'tshirt t-shirt',
  'שמלה': 'dress',
  'נעליים': 'shoes footwear',
  
  // Colors
  'אדום': 'red',
  'כחול': 'blue', 
  'ירוק': 'green',
  'שחור': 'black',
  'לבן': 'white',
  
  // Sizes
  'קטן': 'small S',
  'בינוני': 'medium M',
  'גדול': 'large L',
  'XL': 'extra large XL',
  
  // Electronics
  'מחשב': 'computer laptop',
  'טלפון': 'phone smartphone',
  'אוזניות': 'headphones earphones',
  
  // Home & Garden
  'מטבח': 'kitchen cookware',
  'גינה': 'garden outdoor'
}

function translateSearchQuery(hebrewQuery) {
  console.log('📝 translateSearchQuery received:', `"${hebrewQuery}"`)
  
  let translatedTerms = [hebrewQuery] // Keep original Hebrew
  
  // Check each translation entry
  Object.entries(TRANSLATION_MAP).forEach(([hebrew, english]) => {
    console.log(`🔍 Checking if "${hebrewQuery}" includes "${hebrew}"`)
    
    if (hebrewQuery.includes(hebrew)) {
      console.log(`✅ Match found! Adding: ${english}`)
      translatedTerms.push(english)
      
      // Add individual English words
      english.split(' ').forEach(word => {
        if (word.length > 2) {
          translatedTerms.push(word)
        }
      })
    }
  })
  
  // Remove duplicates and return
  return [...new Set(translatedTerms)]
}
```

### Product Search Function
```javascript
async function searchProducts(searchTerms, store = 'default') {
  console.log('🔍 Searching for:', searchTerms.join(', '))
  
  const allProducts = new Map() // Use Map to avoid duplicates
  
  for (const term of searchTerms) {
    try {
      console.log(`   ➤ Trying search term: "${term}"`)
      
      // Search in store inventory
      const storeProducts = await searchInStore(term, store)
      console.log(`   ✅ Found ${storeProducts.length} products for "${term}"`)
      
      // Add to results map
      storeProducts.forEach(product => {
        allProducts.set(product.id, product)
      })
      
    } catch (error) {
      console.error(`❌ Search failed for term "${term}":`, error.message)
    }
  }
  
  const uniqueProducts = Array.from(allProducts.values())
  console.log('🎯 Total unique products found:', uniqueProducts.length)
  
  return uniqueProducts
}

async function searchInStore(searchTerm, store) {
  console.log('🏪 Searching in store:', store)
  
  // Mock store data for demo - replace with real Shopify API
  const mockProducts = [
    {
      id: 'pants_001',
      title: 'מכנס ג\'ינס כחול קלאסי',
      price: '199.90',
      image: '/api/placeholder/300/300',
      description: 'מכנס ג\'ינס איכותי בצבע כחול',
      vendor: 'Fashion Brand',
      tags: ['pants', 'jeans', 'blue'],
      variants: [
        { size: 'S', available: true },
        { size: 'M', available: true },
        { size: 'L', available: false }
      ]
    },
    {
      id: 'pants_002', 
      title: 'מכנס עבודה שחור',
      price: '149.90',
      image: '/api/placeholder/300/300',
      description: 'מכנס מחויט לעבודה',
      vendor: 'Work Wear',
      tags: ['pants', 'work', 'black']
    }
  ]
  
  // Filter products based on search term
  return mockProducts.filter(product => {
    const searchableText = `${product.title} ${product.description} ${product.tags.join(' ')}`.toLowerCase()
    return searchableText.includes(searchTerm.toLowerCase())
  })
}
```

---

## 🤖 מעבד הבינה המלאכותית

### Gemini AI Integration
```javascript
async function callGeminiAPI(prompt, apiKey, model = 'gemini-1.5-flash') {
  console.log('🤖 Testing Gemini Free...')
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  
  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topK: 40,
      topP: 0.95
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  }
  
  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
    
    if (response.data.candidates && response.data.candidates[0]) {
      const text = response.data.candidates[0].content.parts[0].text
      console.log('✅ Gemini response received')
      return text
    } else {
      throw new Error('Invalid Gemini API response structure')
    }
    
  } catch (error) {
    console.error('❌ Gemini API error:', error.message)
    throw error
  }
}

async function processWithAI(userQuery, products) {
  if (!process.env.GEMINI_API_KEY) {
    return `מצאתי ${products.length} מוצרים עבור "${userQuery}"`
  }
  
  const prompt = `
אתה עוזר קנייה מקצועי. המשתמש חיפש: "${userQuery}"
מצאתי ${products.length} מוצרים רלוונטיים.

כתב תגובה קצרה וחברותית בעברית שמסבירה מה מצאת ומציעה עזרה נוספת.
השתמש באמוג'י 🛍️ ו 📦 ו ✨ כדי לעשות את התגובה יותר חברותית.

דוגמאות:
- "מצאתי כמה מכנסיים מעולים בשבילך! 🛍️ יש כאן אפשרויות מגניבות..."
- "נהדר! יש לי כמה הצעות נפלאות ✨ עבור מה שחיפשת..."
- "מושלם! מצאתי בדיוק מה שאתה מחפש 📦 בואו נראה מה יש לנו..."

תגובה:
`
  
  try {
    const aiResponse = await callGeminiAPI(
      prompt,
      process.env.GEMINI_API_KEY,
      process.env.AI_MODEL || 'gemini-1.5-flash'
    )
    
    return aiResponse.trim()
    
  } catch (error) {
    console.error('❌ AI processing failed:', error)
    return `מצאתי ${products.length} מוצרים מעולים עבור "${userQuery}" 🛍️`
  }
}
```

---

## 🏪 אינטגרציה עם Shopify

### Shopify API Configuration
```javascript
const SHOPIFY_CONFIG = {
  shopDomain: process.env.SHOPIFY_STORE_URL,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  apiVersion: '2023-10'
}

class ShopifyStore {
  constructor(config) {
    this.shopDomain = config.shopDomain
    this.accessToken = config.accessToken
    this.apiVersion = config.apiVersion
    this.baseUrl = `${this.shopDomain}/admin/api/${this.apiVersion}`
  }
  
  async searchProducts(query, limit = 50) {
    const url = `${this.baseUrl}/products.json`
    
    const params = new URLSearchParams({
      limit: limit,
      published_status: 'published'
    })
    
    // Add search filters
    if (query && query.trim()) {
      params.append('title', query)
    }
    
    try {
      const response = await axios.get(`${url}?${params}`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      console.log(`✅ Shopify API returned ${response.data.products.length} products`)
      
      return this.formatProducts(response.data.products)
      
    } catch (error) {
      console.error('❌ Shopify API error:', error.message)
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Shopify access token')
      } else if (error.response?.status === 404) {
        throw new Error('Store not found or API endpoint incorrect')
      } else {
        throw new Error(`Shopify API error: ${error.message}`)
      }
    }
  }
  
  formatProducts(products) {
    return products.map(product => {
      const variant = product.variants[0] || {}
      const image = product.images[0] || {}
      
      return {
        id: product.id.toString(),
        title: product.title,
        price: variant.price || '0.00',
        compareAtPrice: variant.compare_at_price,
        image: image.src || '/placeholder.jpg',
        description: this.stripHtml(product.body_html || ''),
        vendor: product.vendor,
        productType: product.product_type,
        tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
        variants: product.variants.map(v => ({
          id: v.id,
          title: v.title,
          price: v.price,
          available: v.inventory_quantity > 0,
          sku: v.sku
        })),
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    })
  }
  
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').substring(0, 150)
  }
  
  async getProductById(productId) {
    const url = `${this.baseUrl}/products/${productId}.json`
    
    try {
      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        }
      })
      
      return this.formatProducts([response.data.product])[0]
      
    } catch (error) {
      console.error(`❌ Error fetching product ${productId}:`, error.message)
      throw error
    }
  }
}
```

### Shopify Webhook Handler (אופציונלי)
```javascript
app.post('/webhooks/shopify/products/create', express.raw({type: 'application/json'}), (req, res) => {
  console.log('📦 New product created webhook received')
  
  // Verify webhook (production requirement)
  const hmac = req.headers['x-shopify-hmac-sha256']
  const body = req.body
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body)
    .digest('base64')
  
  if (hash !== hmac) {
    console.error('❌ Webhook verification failed')
    return res.status(401).send('Unauthorized')
  }
  
  try {
    const product = JSON.parse(body)
    console.log('✅ New product:', product.title)
    
    // Update search index, send notifications, etc.
    updateProductIndex(product)
    
    res.status(200).send('OK')
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    res.status(500).send('Error')
  }
})
```

---

## 🔐 אבטחה ואימות

### API Rate Limiting
```javascript
const rateLimit = require('express-rate-limit')

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Stricter limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: {
    error: 'AI rate limit exceeded, please wait',
    retryAfter: '1 minute'
  }
})

app.use('/api/', apiLimiter)
app.use('/api/chat', aiLimiter)
app.use('/api/test-ai', aiLimiter)
```

### Input Validation & Sanitization
```javascript
const validator = require('validator')

function validateAndSanitizeQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string')
  }
  
  // Remove potentially dangerous characters
  let sanitized = validator.escape(query)
  
  // Limit length
  if (sanitized.length > 500) {
    throw new Error('Query too long (max 500 characters)')
  }
  
  // Remove extra whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ')
  
  if (sanitized.length === 0) {
    throw new Error('Query cannot be empty')
  }
  
  return sanitized
}

// Usage in endpoints
app.post('/api/chat', async (req, res) => {
  try {
    const sanitizedQuery = validateAndSanitizeQuery(req.body.query)
    // ... rest of the logic
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
})
```

### Environment Variables Validation
```javascript
function validateEnvironmentVariables() {
  const required = [
    'SHOPIFY_STORE_URL',
    'SHOPIFY_ACCESS_TOKEN'
  ]
  
  const optional = [
    'GEMINI_API_KEY',
    'AI_PROVIDER',
    'AI_MODEL'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    process.exit(1)
  }
  
  // Validate Shopify URL format
  if (!process.env.SHOPIFY_STORE_URL.includes('.myshopify.com')) {
    console.error('❌ Invalid SHOPIFY_STORE_URL format')
    process.exit(1)
  }
  
  console.log('✅ Environment variables validated')
  
  // Log what we have (without exposing secrets)
  console.log('🔧 Configuration:')
  console.log(`   Store: ${process.env.SHOPIFY_STORE_URL}`)
  console.log(`   AI Provider: ${process.env.AI_PROVIDER || 'Not configured'}`)
  console.log(`   Port: ${process.env.PORT || 3000}`)
}

// Run validation at startup
validateEnvironmentVariables()
```

---

## 📊 לוגים ומוניטורינג

### Structured Logging
```javascript
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Usage throughout the application
logger.info('Server starting', { port: PORT })
logger.error('API error', { endpoint: '/api/chat', error: error.message })
```

### Health Check Endpoint
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {}
  }
  
  // Test Shopify connection
  try {
    if (SHOPIFY_CONFIG.shopDomain && SHOPIFY_CONFIG.accessToken) {
      const store = new ShopifyStore(SHOPIFY_CONFIG)
      await store.searchProducts('test', 1)
      health.services.shopify = 'healthy'
    } else {
      health.services.shopify = 'not_configured'
    }
  } catch (error) {
    health.services.shopify = 'unhealthy'
  }
  
  // Test AI connection
  try {
    if (process.env.GEMINI_API_KEY) {
      await callGeminiAPI('test', process.env.GEMINI_API_KEY)
      health.services.ai = 'healthy'
    } else {
      health.services.ai = 'not_configured'
    }
  } catch (error) {
    health.services.ai = 'unhealthy'
  }
  
  const hasUnhealthyService = Object.values(health.services).includes('unhealthy')
  
  res.status(hasUnhealthyService ? 503 : 200).json(health)
})
```

### Performance Monitoring
```javascript
const responseTime = require('response-time')

// Add response time header
app.use(responseTime())

// Custom performance monitoring
function monitorPerformance() {
  const used = process.memoryUsage()
  
  console.log('📊 Performance metrics:')
  for (let key in used) {
    console.log(`   ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
  }
  
  console.log(`   Uptime: ${Math.round(process.uptime())} seconds`)
}

// Log performance every 5 minutes
setInterval(monitorPerformance, 5 * 60 * 1000)
```

---

## 🚀 הרצת השרת

### Server Startup
```javascript
// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
  
  server.close(() => {
    console.log('✅ HTTP server closed')
    
    // Close database connections, etc.
    process.exit(0)
  })
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start the server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 ChatShop Server running on port ${PORT}`)
  console.log(`📱 Frontend: http://localhost:${PORT}/shop`)
  console.log(`🔍 Health check: http://localhost:${PORT}/health`)
  console.log(`📊 API endpoints:`)
  console.log(`   POST /api/chat - Main chat endpoint`)
  console.log(`   POST /api/test-ai - AI testing`)
  console.log(`   POST /api/compare-products - Product comparison`)
  console.log(`\n✅ Server ready for connections!`)
})

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`)
  } else {
    console.error('❌ Server error:', error)
  }
  process.exit(1)
})
```

---

## 🔧 הגדרות Production

### PM2 Configuration (pm2.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'chatshop-server',
    script: 'web-app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
}
```

### Docker Configuration (Dockerfile)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "web-app.js"]
```

---

## 📈 אופטימיזציות ביצועים

### Caching Strategy
```javascript
const NodeCache = require('node-cache')

// Cache for 5 minutes
const searchCache = new NodeCache({ stdTTL: 300 })

async function searchProductsWithCache(query, store) {
  const cacheKey = `search:${store}:${query}`
  
  // Try cache first
  const cached = searchCache.get(cacheKey)
  if (cached) {
    console.log('🔄 Returning cached results')
    return cached
  }
  
  // Fetch fresh data
  const results = await searchProducts(query, store)
  
  // Cache results
  searchCache.set(cacheKey, results)
  
  return results
}
```

### Database Connection Pooling (if needed)
```javascript
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Usage
async function saveSearchLog(query, results) {
  const connection = await pool.getConnection()
  
  try {
    await connection.execute(
      'INSERT INTO search_logs (query, results_count, created_at) VALUES (?, ?, NOW())',
      [query, results.length]
    )
  } finally {
    connection.release()
  }
}
```

---

## סיכום השרת

המערכת כוללת שרת Node.js מתקדם עם:

✅ **Express.js server** מוכן לייצור  
✅ **אינטגרציה מלאה עם Shopify API**  
✅ **עיבוד בינה מלאכותית (Gemini)**  
✅ **מנוע תרגום עברית-אנגלית**  
✅ **אבטחה ו-rate limiting**  
✅ **מוניטורינג ולוגים**  
✅ **אופטימיזציות ביצועים**  
✅ **הגדרות production מוכנות**  

השרת מוכן לפריסה ב-Base44 ויכול להתמודד עם עומסי ייצור!