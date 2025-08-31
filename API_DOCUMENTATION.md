# תיעוד API מלא - ChatShop Backend

## 📋 סקירה כללית

השרת מספק API RESTful מלא לניהול חנות Shopify עם יכולות בינה מלאכותית. כל ה-endpoints מוגנים, מתועדים ומוכנים לייצור.

**Base URL:** `http://your-domain.com:3000`  
**Content-Type:** `application/json`  
**Encoding:** `UTF-8`

---

## 🔐 Authentication & Headers

### Required Headers
```http
Content-Type: application/json
Accept: application/json
User-Agent: ChatShop-Client/1.0
```

### Optional Headers
```http
X-Client-Version: 1.0.0
X-Request-ID: unique-request-id
Accept-Language: he-IL,he;q=0.9,en;q=0.8
```

### Rate Limiting Headers (Response)
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

---

## 🛍️ Chat API - הלב של המערכת

### POST /api/chat

חיפוש מוצרים באמצעות בינה מלאכותית ושפה טבעית בעברית.

#### Request
```http
POST /api/chat
Content-Type: application/json

{
  "query": "מכנס ג'ינס כחול במידה L לעבודה",
  "store": "my-shop.myshopify.com",
  "filters": {
    "priceRange": {
      "min": 50,
      "max": 300
    },
    "brand": "זארה",
    "category": "בגדים"
  },
  "limit": 12,
  "sortBy": "relevance"
}
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | שאילתת החיפוש בעברית או אנגלית (max 500 chars) |
| `store` | string | ❌ | מזהה החנות (default: "default") |
| `filters` | object | ❌ | פילטרים נוספים לחיפוש |
| `filters.priceRange` | object | ❌ | טווח מחירים |
| `filters.priceRange.min` | number | ❌ | מחיר מינימלי |
| `filters.priceRange.max` | number | ❌ | מחיר מקסימלי |
| `filters.brand` | string | ❌ | מותג מועדף |
| `filters.category` | string | ❌ | קטגוריה |
| `limit` | number | ❌ | מספר תוצאות מקסימלי (default: 12, max: 50) |
| `sortBy` | string | ❌ | סדר מיון: "relevance", "price_asc", "price_desc", "newest" |

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "מצאתי 8 מכנסי ג'ינס מעולים בשבילך! 🛍️ יש כאן אפשרויות נהדרות לעבודה במידה L",
  "products": [
    {
      "id": "12345",
      "title": "מכנס ג'ינס כחול קלאסי",
      "price": "199.90",
      "compareAtPrice": "249.90",
      "currency": "ILS",
      "image": "https://example.com/product.jpg",
      "images": [
        "https://example.com/product1.jpg",
        "https://example.com/product2.jpg"
      ],
      "description": "מכנס ג'ינס איכותי בצבע כחול עמוק, מושלם לעבודה ולהזדמנויות יומיומיות",
      "shortDescription": "מכנס ג'ינס איכותי בצבע כחול עמוק...",
      "vendor": "Fashion Brand Ltd",
      "productType": "בגדים",
      "tags": ["ג'ינס", "כחול", "עבודה", "גברים"],
      "variants": [
        {
          "id": "variant_123",
          "title": "מידה L / כחול",
          "size": "L",
          "color": "כחול",
          "price": "199.90",
          "available": true,
          "inventory": 15,
          "sku": "JEANS-L-BLUE-001"
        }
      ],
      "rating": {
        "average": 4.5,
        "count": 127
      },
      "availability": {
        "inStock": true,
        "quantity": 15,
        "estimatedShipping": "2-3 ימי עסקים"
      },
      "seo": {
        "url": "/products/classic-blue-jeans",
        "slug": "classic-blue-jeans"
      },
      "createdAt": "2023-01-15T10:30:00Z",
      "updatedAt": "2023-12-01T14:20:00Z"
    }
  ],
  "searchInfo": {
    "originalQuery": "מכנס ג'ינס כחול במידה L לעבודה",
    "translatedTerms": ["pants", "jeans", "blue", "work", "L", "large"],
    "totalResults": 8,
    "searchTime": 245,
    "appliedFilters": {
      "priceRange": { "min": 50, "max": 300 },
      "size": "L",
      "category": "בגדים"
    },
    "suggestions": [
      "מכנס עבודה שחור",
      "ג'ינס כחול במידה XL",
      "מכנס אלגנט לעבודה"
    ]
  },
  "metadata": {
    "requestId": "req_123456789",
    "timestamp": "2023-12-01T10:30:00Z",
    "processingTime": 450,
    "aiProvider": "gemini-1.5-flash",
    "cacheHit": false
  }
}
```

#### Response (Error - 400)
```json
{
  "success": false,
  "error": "INVALID_QUERY",
  "message": "השאילתה ריקה או לא תקינה",
  "details": {
    "field": "query",
    "code": "REQUIRED_FIELD_MISSING",
    "description": "Query parameter is required and cannot be empty"
  },
  "requestId": "req_123456789",
  "timestamp": "2023-12-01T10:30:00Z"
}
```

#### Response (Error - 429)
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "חרגת ממכסת הבקשות, נסה שוב בעוד דקה",
  "retryAfter": 60,
  "limit": 10,
  "remaining": 0,
  "resetTime": "2023-12-01T10:31:00Z"
}
```

#### Response (Error - 500)
```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "שגיאה פנימית בשרת, נסה שוב",
  "requestId": "req_123456789",
  "timestamp": "2023-12-01T10:30:00Z"
}
```

---

## 🧪 AI Testing API

### POST /api/test-ai

בדיקת חיבור ותקינות של מערכת הבינה המלאכותית.

#### Request
```http
POST /api/test-ai
Content-Type: application/json

{
  "provider": "gemini-free",
  "model": "gemini-1.5-flash",
  "apiKey": "AIzaSyB_your_api_key_here",
  "testPrompt": "Hello, please respond with a greeting"
}
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | ✅ | ספק הAI: "gemini-free", "openai", "anthropic" |
| `model` | string | ❌ | דגם הAI (default לפי provider) |
| `apiKey` | string | ✅ | מפתח API |
| `testPrompt` | string | ❌ | prompt לבדיקה (default: "Hello test") |

#### Response (Success - 200)
```json
{
  "success": true,
  "testResult": true,
  "provider": "gemini-free",
  "model": "gemini-1.5-flash",
  "testResponse": "Hello there! How can I help you today?",
  "responseTime": 850,
  "apiKeyValid": true,
  "quotaRemaining": "unlimited",
  "serverStatus": "healthy",
  "timestamp": "2023-12-01T10:30:00Z"
}
```

#### Response (Error - 400)
```json
{
  "success": false,
  "testResult": false,
  "error": "INVALID_API_KEY",
  "errorMessage": "The provided API key is invalid or expired",
  "provider": "gemini-free",
  "troubleshooting": {
    "steps": [
      "Verify your API key is correct",
      "Check if the API key has expired",
      "Ensure the provider supports the selected model"
    ],
    "documentation": "https://ai.google.dev/gemini-api/docs/api-key"
  }
}
```

---

## ⚖️ Product Comparison API

### POST /api/compare-products

השוואת מוצרים עם אפשרות לניתוח בבינה מלאכותית.

#### Request
```http
POST /api/compare-products
Content-Type: application/json

{
  "products": ["12345", "67890", "11111"],
  "useAI": true,
  "comparisonType": "detailed",
  "focusAreas": ["price", "quality", "features", "reviews"],
  "language": "he"
}
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `products` | array | ✅ | מערך של IDs של מוצרים (2-4 מוצרים) |
| `useAI` | boolean | ❌ | האם להשתמש בAI לניתוח (default: false) |
| `comparisonType` | string | ❌ | סוג השוואה: "quick", "detailed" (default: "detailed") |
| `focusAreas` | array | ❌ | אזורי התמקדות לניתוח |
| `language` | string | ❌ | שפה לתגובה: "he", "en" (default: "he") |

#### Response (Success - 200)
```json
{
  "success": true,
  "comparison": {
    "manual": {
      "products": [
        {
          "id": "12345",
          "title": "מכנס ג'ינס כחול קלאסי",
          "price": 199.90,
          "rating": 4.5,
          "specs": {
            "material": "100% כותנה",
            "size": "L",
            "color": "כחול",
            "brand": "Fashion Brand"
          }
        },
        {
          "id": "67890", 
          "title": "ג'ינס שחור סקיני",
          "price": 159.90,
          "rating": 4.2,
          "specs": {
            "material": "98% כותנה, 2% אלסטן",
            "size": "L",
            "color": "שחור",
            "brand": "Urban Style"
          }
        }
      ],
      "comparisonTable": {
        "price": {
          "12345": 199.90,
          "67890": 159.90,
          "winner": "67890",
          "difference": 40.00
        },
        "rating": {
          "12345": 4.5,
          "67890": 4.2,
          "winner": "12345",
          "difference": 0.3
        },
        "material": {
          "12345": "100% כותנה",
          "67890": "98% כותנה, 2% אלסטן",
          "winner": "tie",
          "note": "שני החומרים איכותיים"
        }
      }
    },
    "ai": {
      "summary": "שני המכנסיים מעולים, אבל לכל אחד יתרונות שונים. המכנס הכחול איכותי יותר ועמיד לשטיפות, בעוד השחור נוח יותר ומחירו נמוך יותר.",
      "pros": {
        "12345": [
          "איכות גבוהה - 100% כותנה",
          "עמידות מעולה לשטיפות",
          "דירוג גבוה מלקוחות (4.5)",
          "צבע כחול קלאסי שמתאים לכל סגנון"
        ],
        "67890": [
          "מחיר נמוך יותר - חיסכון של 40 שקל",
          "נוחות מעולה בזכות האלסטן",
          "סגנון סקיני מודרני",
          "צבע שחור שמסתיר כתמים"
        ]
      },
      "cons": {
        "12345": [
          "מחיר גבוה יותר",
          "ללא אלסטן - פחות גמיש"
        ],
        "67890": [
          "דירוג מעט נמוך יותר",
          "סגנון סקיני לא מתאים לכולם"
        ]
      },
      "recommendation": {
        "winner": "12345",
        "confidence": 0.75,
        "reasoning": "אני ממליץ על המכנס הכחול (12345) אם איכות ועמידות חשובות לכם יותר מהמחיר. אם תקציב מוגבל או שאתם מעדיפים נוחות, השחור יהיה בחירה מעולה.",
        "bestFor": {
          "12345": "מי שמחפש איכות ועמידות לטווח ארוך",
          "67890": "מי שמחפש נוחות וערך כספי טוב"
        }
      },
      "additionalTips": [
        "שני המכנסיים זמינים במידה L",
        "מומלץ לבדוק מדיניות החזרה לפני רכישה", 
        "ניתן לקבל הנחה על רכישה של שני מוצרים"
      ]
    }
  },
  "metadata": {
    "requestId": "cmp_123456789",
    "timestamp": "2023-12-01T10:30:00Z",
    "processingTime": 1200,
    "aiProcessingTime": 800,
    "comparisonType": "detailed"
  }
}
```

---

## 🛒 Cart Management API

### POST /api/cart/add

הוספת מוצר לעגלת קניות.

#### Request
```http
POST /api/cart/add
Content-Type: application/json

{
  "productId": "12345",
  "variantId": "variant_123",
  "quantity": 2,
  "userSession": "session_token_here"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "המוצר נוסף לעגלה בהצלחה",
  "cart": {
    "items": [
      {
        "id": "12345",
        "variantId": "variant_123", 
        "title": "מכנס ג'ינס כחול קלאסי",
        "price": 199.90,
        "quantity": 2,
        "subtotal": 399.80,
        "image": "https://example.com/product.jpg"
      }
    ],
    "summary": {
      "totalItems": 2,
      "totalPrice": 399.80,
      "currency": "ILS",
      "discounts": 0,
      "shipping": 0,
      "tax": 63.97
    }
  }
}
```

### GET /api/cart

קבלת תוכן עגלת הקניות.

#### Response (Success - 200)
```json
{
  "success": true,
  "cart": {
    "items": [...],
    "summary": {...}
  },
  "recommendations": [
    {
      "id": "recommended_1",
      "title": "מוצר משלים",
      "price": 99.90,
      "reason": "לקוחות שקנו את זה גם קנו..."
    }
  ]
}
```

### DELETE /api/cart/remove/{productId}

הסרת מוצר מהעגלה.

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "המוצר הוסר מהעגלה",
  "cart": {...}
}
```

---

## 👤 User Profile API

### POST /api/profile/save

שמירת פרופיל משתמש.

#### Request
```http
POST /api/profile/save
Content-Type: application/json

{
  "personalInfo": {
    "name": "יוסי כהן",
    "email": "yossi@example.com",
    "phone": "050-1234567",
    "dateOfBirth": "1990-01-01"
  },
  "address": {
    "street": "רחוב הרצל 123",
    "city": "תל אביב",
    "postalCode": "12345",
    "country": "ישראל"
  },
  "preferences": {
    "size": "L",
    "colors": ["כחול", "שחור"],
    "brands": ["זארה", "H&M"],
    "priceRange": {
      "min": 50,
      "max": 500
    },
    "categories": ["בגדים", "נעליים"],
    "notifications": {
      "email": true,
      "sms": false,
      "newProducts": true,
      "sales": true
    }
  }
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "הפרופיל נשמר בהצלחה",
  "profile": {
    "id": "user_12345",
    "personalInfo": {...},
    "address": {...},
    "preferences": {...},
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-12-01T10:30:00Z"
  }
}
```

### GET /api/profile

קבלת פרופיל משתמש.

### PATCH /api/profile/section

עדכון חלק מהפרופיל.

#### Request
```http
PATCH /api/profile/section
Content-Type: application/json

{
  "section": "preferences",
  "data": {
    "size": "XL",
    "colors": ["אדום", "כחול"]
  }
}
```

---

## 🔍 Search & Discovery API

### GET /api/products/trending

מוצרים פופולריים וטרנדים.

#### Response
```json
{
  "success": true,
  "trending": [
    {
      "id": "trending_1",
      "title": "מוצר פופולרי",
      "trendScore": 95,
      "salesIncrease": 45.5,
      "searchVolume": 1250
    }
  ]
}
```

### GET /api/products/recommendations

המלצות מותאמות אישית.

#### Query Parameters
| Parameter | Description |
|-----------|-------------|
| `userId` | מזהה משתמש |
| `category` | קטגוריה מועדפת |
| `limit` | מספר המלצות |

### GET /api/search/suggestions

הצעות חיפוש והשלמות אוטומטיות.

#### Request
```http
GET /api/search/suggestions?q=מכנ&limit=10
```

#### Response
```json
{
  "success": true,
  "suggestions": [
    "מכנסיים",
    "מכנס ג'ינס", 
    "מכנס עבודה",
    "מכנס טרנינג"
  ]
}
```

---

## 📊 Analytics & Monitoring API

### GET /health

בדיקת תקינות השרת.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:30:00Z",
  "uptime": 86400,
  "memory": {
    "used": 125.5,
    "total": 512.0,
    "percentage": 24.5
  },
  "services": {
    "shopify": "healthy",
    "ai": "healthy", 
    "database": "healthy"
  },
  "version": "1.0.0"
}
```

### GET /metrics

מטריקות ביצועים.

#### Response
```json
{
  "requests": {
    "total": 15420,
    "perMinute": 45.2,
    "errors": 23
  },
  "response_time": {
    "average": 245,
    "p95": 450,
    "p99": 850
  },
  "ai": {
    "calls": 1250,
    "average_time": 680,
    "success_rate": 99.2
  }
}
```

### POST /api/analytics/track

מעקב אחר אירועי משתמש.

#### Request
```http
POST /api/analytics/track
Content-Type: application/json

{
  "event": "product_view",
  "productId": "12345",
  "userId": "user_123",
  "sessionId": "session_456",
  "timestamp": "2023-12-01T10:30:00Z",
  "metadata": {
    "source": "search",
    "query": "מכנס ג'ינס",
    "position": 2
  }
}
```

---

## 🔔 Webhooks API

### POST /webhooks/shopify/products/create

Webhook לעדכון מוצרים חדשים מShopify.

#### Headers (Required)
```http
X-Shopify-Topic: products/create
X-Shopify-Shop-Domain: my-shop.myshopify.com
X-Shopify-Hmac-Sha256: webhook-signature
Content-Type: application/json
```

### POST /webhooks/shopify/orders/create

Webhook להזמנות חדשות.

---

## ⚠️ Error Codes Reference

### Client Errors (4xx)

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `INVALID_QUERY` | שאילתה לא תקינה |
| 400 | `MISSING_REQUIRED_FIELD` | שדה חובה חסר |
| 400 | `INVALID_PRODUCT_ID` | מזהה מוצר לא תקין |
| 401 | `UNAUTHORIZED` | לא מורשה |
| 403 | `FORBIDDEN` | אסור |
| 404 | `PRODUCT_NOT_FOUND` | מוצר לא נמצא |
| 429 | `RATE_LIMIT_EXCEEDED` | חריגה ממכסת בקשות |

### Server Errors (5xx)

| Code | Error Type | Description |
|------|------------|-------------|
| 500 | `INTERNAL_SERVER_ERROR` | שגיאה פנימית |
| 502 | `SHOPIFY_API_ERROR` | שגיאת Shopify API |
| 503 | `AI_SERVICE_UNAVAILABLE` | שירות AI לא זמין |
| 504 | `TIMEOUT` | פסק זמן |

---

## 🧪 Testing Examples

### cURL Examples

```bash
# Basic chat search
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "מכנסיים כחולים"}'

# AI testing  
curl -X POST http://localhost:3000/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"provider": "gemini-free", "apiKey": "your_key"}'

# Health check
curl http://localhost:3000/health

# Compare products
curl -X POST http://localhost:3000/api/compare-products \
  -H "Content-Type: application/json" \
  -d '{"products": ["12345", "67890"], "useAI": true}'
```

### JavaScript/Fetch Examples

```javascript
// Chat search
const searchProducts = async (query) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })
  
  const data = await response.json()
  return data
}

// Product comparison
const compareProducts = async (productIds, useAI = false) => {
  const response = await fetch('/api/compare-products', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      products: productIds,
      useAI: useAI
    })
  })
  
  return await response.json()
}
```

---

## 📝 Response Format Standards

### Success Response Structure
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "הודעה לקוח (אופציונלי)",
  "metadata": {
    "requestId": "req_123456789",
    "timestamp": "2023-12-01T10:30:00Z",
    "processingTime": 245
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "הודעת שגיאה לקוח",
  "details": {
    "field": "field_name",
    "code": "VALIDATION_ERROR",
    "description": "Technical description"
  },
  "requestId": "req_123456789",
  "timestamp": "2023-12-01T10:30:00Z"
}
```

---

## 🚀 Performance Guidelines

### Response Time Targets
- **Chat API:** < 1000ms
- **Product Search:** < 500ms  
- **AI Processing:** < 2000ms
- **Health Check:** < 100ms

### Rate Limits
- **General API:** 100 requests/15 minutes per IP
- **AI Endpoints:** 10 requests/minute per IP
- **Search:** 50 requests/minute per IP

### Caching
- **Product data:** 5 minutes
- **Search results:** 2 minutes
- **AI responses:** 10 minutes (per identical query)

---

הAPI מוכן לשימוש ייצור עם כל הפונקציונליות הנדרשת! 🚀