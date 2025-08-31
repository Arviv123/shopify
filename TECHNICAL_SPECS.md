# מפרט טכני מפורט - ChatShop System

## קבצי הקוד העיקריים

### 1. web-app.js (שרת Express.js ראשי)
```javascript
// נקודות כניסה עיקריות:

// Chat API - עיבוד שאילתות באמצעות AI
app.post('/api/chat', async (req, res) => {
  const { query, store } = req.body
  // 1. תרגום השאילתה מעברית לאנגלית
  // 2. חיפוש במוצרי Shopify
  // 3. עיבוד בבינה מלאכותית (Gemini)
  // 4. החזרת תוצאות מובנות
})

// Product Comparison API
app.post('/api/compare-products', async (req, res) => {
  const { products, useAI } = req.body
  // השוואה ידנית או בעזרת AI
})

// AI Testing Endpoint
app.post('/api/test-ai', async (req, res) => {
  // בדיקת חיבור לבינה המלאכותית
})
```

### 2. public/shop.html (ממשק המשתמש הראשי - 1564 שורות)
המבנה העיקרי:

```html
<!DOCTYPE html>
<html dir="rtl">
<head>
    <!-- CSS משותף + ChatShop Design System -->
</head>
<body>
    <!-- Initial Screen - מסך פתיחה -->
    <div id="initial-screen">
        <div class="hero-content">
            <h1>ברוכים הבאים לחנות שלנו</h1>
            <p>חפשו מוצרים באמצעות בינה מלאכותית</p>
            <button id="start-chat-btn">🛍️ התחל לקנות</button>
        </div>
    </div>

    <!-- Chat Interface - ממשק הצ'אט -->
    <div id="chat-interface">
        <!-- Header עם לוגו ופקדי ניווט -->
        <!-- Sidebar עם היסטוריה, עגלה, פרופיל -->
        <!-- Chat Container עם הודעות -->
        <!-- Product Grid עם מוצרים -->
        <!-- Modals - חלונות קופצים -->
    </div>
</body>
</html>
```

### 3. public/js/shopify-chat.js (לוגיקת הצ'אט - חלק מ-shop.html)

#### מחלקות עיקריות:

```javascript
// ניהול העגלה
class CartManager {
    constructor() {
        this.items = this.loadFromStorage()
    }
    
    addItem(product, quantity = 1) {
        // הוספת מוצר לעגלה + שמירה ב-localStorage
    }
    
    removeItem(productId) {
        // הסרת מוצר מהעגלה
    }
    
    updateBadges() {
        // עדכון תגיות על מוצרים
    }
}

// ניהול השוואות
class ComparisonManager {
    addToComparison(product) {
        // הוספת מוצר להשוואה (עד 4 מוצרים)
    }
    
    async compareProducts(useAI = false) {
        // השוואת מוצרים - ידנית או עם AI
    }
}

// ניהול פרופיל
class ProfileManager {
    saveProfile(profileData) {
        // שמירת פרופיל ב-localStorage
    }
    
    autoFillForms() {
        // מילוי אוטומטי של טפסים
    }
}

// ניהול היסטוריה
class HistoryManager {
    addSearch(query, results) {
        // הוספת חיפוש להיסטוריה
    }
    
    renderHistory() {
        // הצגת היסטוריה בסרגל הצד
    }
}
```

#### פונקציות עיקריות:

```javascript
// חיפוש מוצרים
async function searchProducts(query) {
    showTypingIndicator()
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: query, 
                store: window.shopifyStore || 'default'
            })
        })
        
        const data = await response.json()
        displayProducts(data.products)
        addChatMessage(data.message, 'bot')
        
    } catch (error) {
        handleSearchError(error)
    } finally {
        hideTypingIndicator()
    }
}

// הצגת מוצרים
function displayProducts(products) {
    const grid = document.getElementById('products-grid')
    grid.innerHTML = ''
    
    products.forEach(product => {
        const productCard = createProductCard(product)
        grid.appendChild(productCard)
    })
    
    updateAllBadges() // עדכון תגיות עגלה/השוואה
}

// יצירת כרטיס מוצר
function createProductCard(product) {
    const card = document.createElement('div')
    card.className = 'product-card'
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image}" alt="${product.title}">
            <div class="product-badges" id="badges-${product.id}"></div>
        </div>
        <div class="product-info">
            <h3>${product.title}</h3>
            <p class="product-price">${product.price}</p>
            <div class="product-actions">
                <button onclick="cartManager.addItem('${product.id}')">
                    🛒 הוסף לסל
                </button>
                <button onclick="comparisonManager.addToComparison('${product.id}')">
                    ⚖️ השוואה
                </button>
            </div>
        </div>
    `
    return card
}
```

### 4. src/shopify-store.js (אינטגרציה עם Shopify)

```javascript
class ShopifyStore {
    constructor(config) {
        this.shopDomain = config.shopDomain
        this.accessToken = config.accessToken
        this.apiVersion = config.apiVersion || '2023-10'
    }
    
    async searchProducts(query, limit = 20) {
        const url = `${this.shopDomain}/admin/api/${this.apiVersion}/products.json`
        
        const response = await fetch(`${url}?title=${encodeURIComponent(query)}&limit=${limit}`, {
            headers: {
                'X-Shopify-Access-Token': this.accessToken,
                'Content-Type': 'application/json'
            }
        })
        
        const data = await response.json()
        return this.formatProducts(data.products)
    }
    
    formatProducts(products) {
        return products.map(product => ({
            id: product.id,
            title: product.title,
            price: product.variants[0]?.price || '0',
            image: product.images[0]?.src || '/placeholder.jpg',
            description: product.body_html,
            vendor: product.vendor,
            tags: product.tags.split(',').map(tag => tag.trim())
        }))
    }
}
```

## מפרט AI Integration

### Gemini AI Configuration
```javascript
const AI_CONFIG = {
    provider: 'gemini-free',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/'
}

async function callGeminiAPI(prompt) {
    const response = await fetch(
        `${AI_CONFIG.baseURL}${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            })
        }
    )
    
    const data = await response.json()
    return data.candidates[0].content.parts[0].text
}
```

### תרגום אוטומטי (עברית ↔ אנגלית)
```javascript
const TRANSLATIONS = {
    // בגדים
    'מכנסיים': 'pants trousers jeans',
    'מכנס': 'pants trousers jeans', 
    'ג\'ינס': 'jeans denim',
    'חולצה': 'shirt top blouse',
    'חולצות': 'shirts tops blouses',
    'טישרט': 'tshirt t-shirt',
    'שמלה': 'dress',
    'חצאית': 'skirt',
    'מעיל': 'jacket coat',
    'סוודר': 'sweater pullover',
    'נעליים': 'shoes footwear',
    
    // צבעים
    'אדום': 'red',
    'כחול': 'blue',
    'ירוק': 'green',
    'שחור': 'black',
    'לבן': 'white',
    
    // מידות
    'קטן': 'small S',
    'בינוני': 'medium M', 
    'גדול': 'large L',
    'XL': 'extra large XL',
    
    // טכנולוgia
    'מחשב': 'computer laptop',
    'טלפון': 'phone smartphone mobile',
    'אוזניות': 'headphones earphones',
    'מקלדת': 'keyboard',
    'עכבר': 'mouse',
    
    // בית וגינה
    'כלי מטבח': 'kitchen tools cookware',
    'סיר': 'pot pan cookware',
    'כוס': 'cup glass mug',
    'צלחת': 'plate dish',
    'גינה': 'garden outdoor',
    'צמחים': 'plants flowers'
}

function translateSearchQuery(hebrewQuery) {
    let translatedTerms = [hebrewQuery] // Keep original Hebrew
    
    Object.entries(TRANSLATIONS).forEach(([hebrew, english]) => {
        if (hebrewQuery.includes(hebrew)) {
            translatedTerms.push(english)
            // Add individual English words
            english.split(' ').forEach(word => {
                if (word.length > 2) translatedTerms.push(word)
            })
        }
    })
    
    return [...new Set(translatedTerms)] // Remove duplicates
}
```

## מפרט CSS Design System

### CSS Variables
```css
:root {
    /* Colors */
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --success-color: #10b981;
    --error-color: #ef4444;
    --warning-color: #f59e0b;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;
    
    /* Shadows */
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.1);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.15);
    
    /* Typography */
    --font-size-sm: 14px;
    --font-size-md: 16px;
    --font-size-lg: 18px;
    --font-size-xl: 24px;
    
    /* Transitions */
    --transition-fast: 0.2s ease;
    --transition-smooth: 0.3s ease;
    --transition-slow: 0.5s ease;
}
```

### Component Styles
```css
/* Product Cards */
.product-card {
    background: white;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    transition: var(--transition-smooth);
    overflow: hidden;
    position: relative;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

/* Badges System */
.product-badges {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    display: flex;
    gap: var(--spacing-xs);
}

.badge {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: white;
}

.badge.cart { background: var(--success-color); }
.badge.compare { background: var(--warning-color); }
.badge.favorite { background: var(--error-color); }

/* Chat Interface */
.chat-message {
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-md);
    max-width: 80%;
    animation: slideInFromBottom 0.3s ease;
}

.chat-message.user {
    background: var(--primary-gradient);
    color: white;
    margin-left: auto;
    margin-right: 0;
}

.chat-message.bot {
    background: #f8fafc;
    color: #374151;
    border: 1px solid #e5e7eb;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(5px);
    z-index: 1000;
}

.modal-content {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: var(--radius-xl);
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
}
```

### Responsive Design
```css
/* Mobile First Approach */
@media (min-width: 768px) {
    .product-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .product-grid {
        grid-template-columns: repeat(3, 1fr);
    }
    
    .chat-interface {
        max-width: 1200px;
        margin: 0 auto;
    }
}

@media (min-width: 1280px) {
    .product-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* Mobile Optimizations */
@media (max-width: 767px) {
    .sidebar {
        transform: translateX(100%);
        transition: transform var(--transition-smooth);
    }
    
    .sidebar.open {
        transform: translateX(0);
    }
    
    .chat-input-container {
        padding: var(--spacing-sm);
    }
    
    .product-card {
        margin-bottom: var(--spacing-md);
    }
}
```

## מפרט LocalStorage Management

### מבנה נתונים
```javascript
// Cart Items Structure
const cartStructure = {
    items: [
        {
            id: "product_12345",
            title: "מכנס ג'ינס כחול",
            price: 199.90,
            quantity: 2,
            image: "https://...",
            variant: "מידה L, צבע כחול",
            addedAt: 1640995200000
        }
    ],
    totalItems: 2,
    totalPrice: 399.80,
    lastUpdated: 1640995200000
}

// User Profile Structure
const profileStructure = {
    personalInfo: {
        name: "יוסי כהן",
        email: "yossi@example.com",
        phone: "050-1234567",
        dateOfBirth: "1990-01-01"
    },
    address: {
        street: "רחוב הרצל 123",
        city: "תל אביב",
        postalCode: "12345",
        country: "ישראל"
    },
    preferences: {
        size: "L",
        color: "כחול",
        brand: "זארה",
        priceRange: { min: 50, max: 500 }
    },
    createdAt: 1640995200000,
    lastUpdated: 1640995200000
}

// Search History Structure  
const historyStructure = [
    {
        query: "מכנסיים כחולים",
        results: 5,
        timestamp: 1640995200000,
        clickedProducts: ["12345", "67890"]
    }
    // מוגבל ל-10 פריטים אחרונים
]

// Comparison Items Structure
const comparisonStructure = [
    {
        id: "12345",
        title: "מוצר A",
        price: 199,
        image: "https://...",
        specs: { size: "L", color: "כחול" }
    }
    // מוגבל ל-4 מוצרים להשוואה
]
```

### Storage Management Functions
```javascript
class StorageManager {
    // Generic Storage Functions
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data))
            return true
        } catch (error) {
            console.error('Storage save error:', error)
            return false
        }
    }
    
    static load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key)
            return data ? JSON.parse(data) : defaultValue
        } catch (error) {
            console.error('Storage load error:', error)
            return defaultValue
        }
    }
    
    // Cart Management
    static saveCart(cart) {
        cart.lastUpdated = Date.now()
        return this.save('shopify_cart', cart)
    }
    
    static loadCart() {
        return this.load('shopify_cart', { items: [], totalItems: 0, totalPrice: 0 })
    }
    
    // Profile Management
    static saveProfile(profile) {
        profile.lastUpdated = Date.now()
        if (!profile.createdAt) profile.createdAt = Date.now()
        return this.save('user_profile', profile)
    }
    
    static loadProfile() {
        return this.load('user_profile', {})
    }
    
    // History Management
    static addToHistory(searchData) {
        const history = this.load('search_history', [])
        
        // Add new search to beginning
        history.unshift({
            ...searchData,
            timestamp: Date.now()
        })
        
        // Keep only last 10 searches
        const trimmedHistory = history.slice(0, 10)
        
        return this.save('search_history', trimmedHistory)
    }
    
    // Cleanup old data
    static cleanup() {
        const keys = ['shopify_cart', 'user_profile', 'search_history', 'comparison_items']
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        
        keys.forEach(key => {
            const data = this.load(key)
            if (data && data.lastUpdated && data.lastUpdated < thirtyDaysAgo) {
                localStorage.removeItem(key)
            }
        })
    }
}
```

## מפרט API Endpoints מפורט

### 1. Chat API
```javascript
POST /api/chat
Content-Type: application/json

// Request Body:
{
    "query": "מכנסיים כחולים מידה L",
    "store": "my-shop.myshopify.com",
    "filters": {
        "priceRange": { "min": 50, "max": 300 },
        "brand": "זארה",
        "size": "L"
    },
    "limit": 20
}

// Response:
{
    "success": true,
    "message": "מצאתי 12 מכנסיים כחולים במידה L",
    "products": [
        {
            "id": "12345",
            "title": "מכנס ג'ינס כחול",
            "price": "199.90",
            "image": "https://...",
            "description": "מכנס ג'ינס איכותי...",
            "vendor": "זארה",
            "tags": ["ג'ינס", "כחול", "גברים"],
            "variants": [
                { "size": "L", "available": true, "price": "199.90" }
            ]
        }
    ],
    "searchInfo": {
        "originalQuery": "מכנסיים כחולים מידה L",
        "translatedTerms": ["pants", "blue", "size L"],
        "totalResults": 12,
        "searchTime": 250
    }
}
```

### 2. Product Comparison API
```javascript
POST /api/compare-products
Content-Type: application/json

// Request Body:
{
    "products": ["12345", "67890", "11111"],
    "useAI": true,
    "comparisonType": "detailed", // "quick" | "detailed"
    "focusAreas": ["price", "quality", "features"]
}

// Response (AI Mode):
{
    "success": true,
    "comparison": {
        "manual": {
            "products": [
                {
                    "id": "12345",
                    "title": "מוצר A",
                    "specs": { "size": "L", "color": "כחול", "material": "כותנה" }
                }
            ],
            "comparisonTable": { ... }
        },
        "ai": {
            "summary": "המוצר הראשון הכי איכותי אבל יקר יותר...",
            "pros": {
                "12345": ["איכות גבוהה", "עמידות"],
                "67890": ["מחיר נמוך", "עיצוב מודרני"]
            },
            "cons": { ... },
            "recommendation": "אני ממליץ על מוצר 12345 אם איכות חשובה לכם..."
        }
    }
}
```

### 3. Cart Management APIs
```javascript
// Add to Cart
POST /api/cart/add
{
    "productId": "12345",
    "quantity": 2,
    "variant": "L-Blue"
}

// Update Cart Item
PUT /api/cart/update
{
    "productId": "12345", 
    "quantity": 3
}

// Remove from Cart
DELETE /api/cart/remove/12345

// Get Cart
GET /api/cart
// Response:
{
    "items": [...],
    "summary": {
        "totalItems": 5,
        "totalPrice": 899.50,
        "currency": "ILS"
    }
}

// Clear Cart
DELETE /api/cart/clear
```

### 4. Profile Management APIs
```javascript
// Save Profile
POST /api/profile/save
{
    "personalInfo": { ... },
    "address": { ... },
    "preferences": { ... }
}

// Get Profile  
GET /api/profile

// Update Profile Section
PATCH /api/profile/section
{
    "section": "preferences",
    "data": { "size": "XL", "color": "אדום" }
}
```

### 5. AI Testing API
```javascript
POST /api/test-ai
{
    "provider": "gemini-free",
    "model": "gemini-1.5-flash", 
    "apiKey": "AIzaSyB..."
}

// Response:
{
    "success": true,
    "testResult": true,
    "response": "Hello! The AI is working properly.",
    "responseTime": 1250,
    "error": null
}
```

## בדיקות Quality Assurance

### 1. Unit Tests (מומלץ להוסיף)
```javascript
// tests/storage.test.js
describe('StorageManager', () => {
    test('should save and load cart data', () => {
        const testCart = { items: [], totalItems: 0 }
        StorageManager.saveCart(testCart)
        const loaded = StorageManager.loadCart()
        expect(loaded.items).toEqual([])
    })
})

// tests/api.test.js  
describe('Chat API', () => {
    test('should return products for Hebrew query', async () => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ query: 'מכנסיים' })
        })
        const data = await response.json()
        expect(data.success).toBe(true)
    })
})
```

### 2. Performance Tests
```javascript
// Performance monitoring
function measurePerformance(functionName, fn) {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    console.log(`${functionName} took ${end - start} milliseconds`)
    
    // Log to analytics if > 1000ms
    if (end - start > 1000) {
        analytics.track('slow_function', {
            function: functionName,
            duration: end - start
        })
    }
    
    return result
}
```

### 3. Error Tracking
```javascript
// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // Send to error tracking service
    fetch('/api/log-error', {
        method: 'POST',
        body: JSON.stringify({
            message: event.error.message,
            stack: event.error.stack,
            url: window.location.href,
            timestamp: Date.now()
        })
    })
})
```

## סיכום טכני

### מבנה הפרויקט:
```
shopify-mcp-server/
├── web-app.js              # שרת Express ראשי
├── src/
│   ├── shopify-store.js    # אינטגרציה עם Shopify
│   └── ai-processor.js     # עיבוד AI
├── public/
│   ├── shop.html          # ממשק ראשי (1564 שורות)
│   ├── js/
│   └── assets/
├── package.json
└── README.md
```

### טכנולוגיות:
- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla JavaScript (ES6+)
- **AI**: Google Gemini 1.5 Flash (API חינמי)
- **Storage**: LocalStorage + Shopify API
- **Styling**: CSS3 + CSS Grid + Flexbox

### Key Features:
✅ חיפוש AI בעברית  
✅ עגלת קניות מתקדמת  
✅ השוואת מוצרים עם AI  
✅ פרופיל משתמש אישי  
✅ היסטוריית חיפושים  
✅ עיצוב מובייל ראשון  
✅ ביצועים אופטימליים  

המערכת מוכנה לפריסה ב-Base44!