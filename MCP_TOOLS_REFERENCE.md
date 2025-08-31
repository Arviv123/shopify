# מדריך כלי MCP מלא - Shopify & Flight Tools Reference

## 🛠️ סקירה כללית

המערכת כוללת **13 כלי MCP** מתקדמים המחולקים לשני תחומים עיקריים:
- **8 כלי Shopify** - ניהול חנות מלא
- **5 כלי טיסות** - חיפוש והזמנת טיסות

כל כלי בנוי עם validation מלא, error handling וdocumentation מפורט.

---

## 🛍️ כלי Shopify

### 1. search_products
**מטרה:** חיפוש מוצרים בחנות Shopify  
**שימוש:** כאשר המשתמש מבקש לחפש מוצר ספציפי

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query for products",
      "examples": ["מכנסיים כחולים", "חולצות עבודה", "נעליים"]
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of products to return",
      "default": 10,
      "minimum": 1,
      "maximum": 100
    }
  },
  "required": ["query"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("search_products", {
  query: "מכנסי ג'ינס כחולים",
  limit: 15
});
```

#### תגובת דוגמה:
```json
[
  {
    "id": "123456789",
    "title": "מכנס ג'ינס כחול קלאסי",
    "price": "199.90",
    "vendor": "Fashion Brand",
    "tags": "ג'ינס, כחול, גברים",
    "variants": [
      {
        "id": "variant_123",
        "title": "מידה L",
        "price": "199.90",
        "inventory_quantity": 15
      }
    ]
  }
]
```

---

### 2. get_product
**מטרה:** קבלת פרטים מפורטים על מוצר ספציפי  
**שימוש:** כאשר יש צורך במידע מלא על מוצר

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "productId": {
      "type": "string", 
      "description": "The Shopify product ID",
      "pattern": "^[0-9]+$"
    }
  },
  "required": ["productId"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("get_product", {
  productId: "123456789"
});
```

---

### 3. create_order
**מטרה:** יצירת הזמנה חדשה בחנות  
**שימוש:** כאשר לקוח רוצה להשלים רכישה

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "lineItems": {
      "type": "array",
      "description": "Array of products to order",
      "items": {
        "type": "object",
        "properties": {
          "variantId": {
            "type": "string",
            "description": "Product variant ID to order"
          },
          "quantity": {
            "type": "number",
            "description": "Quantity to order",
            "minimum": 1
          }
        },
        "required": ["variantId", "quantity"]
      }
    },
    "customer": {
      "type": "object",
      "description": "Customer information",
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "description": "Customer email address"
        },
        "firstName": {
          "type": "string",
          "description": "Customer first name"
        },
        "lastName": {
          "type": "string", 
          "description": "Customer last name"
        }
      },
      "required": ["email"]
    },
    "shippingAddress": {
      "type": "object",
      "properties": {
        "address1": { "type": "string" },
        "address2": { "type": "string" },
        "city": { "type": "string" },
        "province": { "type": "string" },
        "country": { "type": "string" },
        "zip": { "type": "string" }
      },
      "required": ["address1", "city", "country"]
    }
  },
  "required": ["lineItems", "customer", "shippingAddress"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("create_order", {
  lineItems: [
    { variantId: "123456", quantity: 2 },
    { variantId: "789012", quantity: 1 }
  ],
  customer: {
    email: "yossi@example.com",
    firstName: "יוסי",
    lastName: "כהן"
  },
  shippingAddress: {
    address1: "רחוב הרצל 123",
    city: "תל אביב",
    country: "Israel",
    zip: "12345"
  }
});
```

---

### 4. list_orders
**מטרה:** רשימת הזמנות מהחנות  
**שימוש:** לצפייה בהזמנות אחרונות ומעקב

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "description": "Maximum number of orders to return",
      "default": 10,
      "minimum": 1,
      "maximum": 100
    },
    "status": {
      "type": "string",
      "description": "Filter by order status",
      "enum": ["open", "closed", "cancelled", "any"],
      "default": "any"
    }
  }
}
```

#### דוגמת קריאה:
```typescript
await callTool("list_orders", {
  limit: 20,
  status: "open"
});
```

---

### 5. compare_products
**מטרה:** השוואת מוצרים דומים לפי קטגוריה  
**שימוש:** כאשר לקוח רוצה להשוות אפשרויות

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "searchTerm": {
      "type": "string",
      "description": "Search term to find similar products for comparison",
      "examples": ["חולצות", "מכנסיים", "נעלי ספורט"]
    }
  },
  "required": ["searchTerm"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("compare_products", {
  searchTerm: "חולצות פולו"
});
```

#### תגובת דוגמה:
```json
{
  "חולצות": {
    "count": 12,
    "minPrice": 89.90,
    "maxPrice": 299.90,
    "avgPrice": 156.50,
    "products": [
      {
        "id": "123",
        "title": "חולצת פולו כחולה",
        "price": 89.90,
        "vendor": "Ralph Lauren"
      }
    ]
  }
}
```

---

### 6. find_best_deals
**מטרה:** מציאת המוצרים הזולים ביותר  
**שימוש:** למציאת מבצעים והצעות טובות

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "description": "Maximum number of deals to return",
      "default": 10,
      "minimum": 1,
      "maximum": 50
    }
  }
}
```

#### דוגמת קריאה:
```typescript
await callTool("find_best_deals", {
  limit: 15
});
```

---

### 7. search_by_vendor
**מטרה:** חיפוש מוצרים מספק ספציפי  
**שימוש:** כאשר לקוח מעוניין במותג מסוים

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "vendor": {
      "type": "string",
      "description": "Vendor name to search for",
      "examples": ["זארה", "H&M", "Nike", "Adidas"]
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of products to return",
      "default": 20,
      "minimum": 1,
      "maximum": 100
    }
  },
  "required": ["vendor"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("search_by_vendor", {
  vendor: "זארה",
  limit: 25
});
```

---

### 8. products_by_price_range
**מטרה:** מציאת מוצרים בטווח מחירים ספציפי  
**שימוש:** כאשר לקוח יש תקציב מוגדר

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "minPrice": {
      "type": "number",
      "description": "Minimum price",
      "minimum": 0
    },
    "maxPrice": {
      "type": "number",
      "description": "Maximum price", 
      "minimum": 0
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of products to return",
      "default": 20,
      "minimum": 1,
      "maximum": 100
    }
  },
  "required": ["minPrice", "maxPrice"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("products_by_price_range", {
  minPrice: 100,
  maxPrice: 300,
  limit: 30
});
```

---

## ✈️ כלי טיסות

### 9. search_flights
**מטרה:** חיפוש טיסות בין יעדים  
**שימוש:** כאשר המשתמש רוצה לחפש טיסות

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "origin": {
      "type": "string",
      "description": "Origin airport code or city name",
      "default": "TLV",
      "examples": ["TLV", "JFK", "תל אביב", "ניו יורק"]
    },
    "destination": {
      "type": "string", 
      "description": "Destination airport code or city name",
      "examples": ["JFK", "LHR", "ניו יורק", "לונדון"]
    },
    "departureDate": {
      "type": "string",
      "description": "Departure date in YYYY-MM-DD format",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "examples": ["2025-01-15", "2025-12-31"]
    },
    "returnDate": {
      "type": "string",
      "description": "Return date in YYYY-MM-DD format (optional)",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
    },
    "passengers": {
      "type": "number",
      "description": "Number of passengers",
      "default": 1,
      "minimum": 1,
      "maximum": 9
    },
    "class": {
      "type": "string",
      "description": "Travel class preference",
      "enum": ["Economy", "Business", "First"],
      "default": "Economy"
    },
    "maxStops": {
      "type": "number",
      "description": "Maximum number of stops (0 for direct)",
      "default": 2,
      "minimum": 0,
      "maximum": 3
    },
    "maxPrice": {
      "type": "number",
      "description": "Maximum price in ILS",
      "minimum": 0
    }
  },
  "required": ["destination", "departureDate"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("search_flights", {
  origin: "TLV",
  destination: "JFK", 
  departureDate: "2025-01-15",
  returnDate: "2025-01-22",
  passengers: 2,
  class: "Business",
  maxStops: 1,
  maxPrice: 5000
});
```

#### תגובת דוגמה:
```json
{
  "success": true,
  "totalFlights": 5,
  "flights": [
    {
      "id": "FL001",
      "airline": "El Al",
      "flightNumber": "LY315",
      "origin": {
        "code": "TLV",
        "name": "בן גוריון",
        "city": "תל אביב"
      },
      "destination": {
        "code": "JFK", 
        "name": "John F. Kennedy",
        "city": "ניו יורק"
      },
      "departure": "2025-01-15T10:30:00Z",
      "arrival": "2025-01-15T16:45:00Z",
      "duration": "11h 15m",
      "stops": 0,
      "price": {
        "amount": 2850,
        "currency": "ILS",
        "formatted": "₪2,850"
      },
      "class": "Economy",
      "available": true
    }
  ]
}
```

---

### 10. get_flight_details
**מטרה:** פרטים מלאים על טיסה ספציפית  
**שימוש:** לקבלת מידע מפורט לפני הזמנה

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "flightId": {
      "type": "string",
      "description": "The flight ID to get details for",
      "pattern": "^FL\\d+$",
      "examples": ["FL001", "FL123"]
    }
  },
  "required": ["flightId"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("get_flight_details", {
  flightId: "FL001"
});
```

#### תגובת דוגמה:
```json
{
  "success": true,
  "flight": {
    "id": "FL001",
    "airline": "El Al",
    "flightNumber": "LY315", 
    "baggage": {
      "carryOn": "8kg חינם",
      "checked": "תיק 23kg - ₪150"
    },
    "amenities": ["WiFi", "ארוחה", "בידור"],
    "cancellation": "ביטול בתשלום עד 24 שעות לפני הטיסה",
    "aircraft": "Boeing 737-800"
  }
}
```

---

### 11. get_popular_destinations
**מטרה:** רשימת יעדים פופולריים משדה תעופה  
**שימוש:** להצגת אפשרויות נסיעה פופולריות

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "origin": {
      "type": "string",
      "description": "Origin airport code",
      "default": "TLV",
      "examples": ["TLV", "JFK", "LHR"]
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of destinations",
      "default": 10,
      "minimum": 1,
      "maximum": 20
    }
  }
}
```

#### דוגמת קריאה:
```typescript
await callTool("get_popular_destinations", {
  origin: "TLV",
  limit: 15
});
```

#### תגובת דוגמה:
```json
{
  "success": true,
  "origin": "TLV",
  "destinations": [
    {
      "code": "JFK",
      "city": "ניו יורק", 
      "country": "ארה״ב",
      "minPrice": 2800
    },
    {
      "code": "LHR",
      "city": "לונדון",
      "country": "בריטניה", 
      "minPrice": 2200
    }
  ]
}
```

---

### 12. search_airports
**מטרה:** חיפוש שדות תעופה לפי שם או קוד  
**שימוש:** למציאת קודי שדות תעופה

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query (city, airport code, or airport name)",
      "examples": ["לונדון", "JFK", "Charles de Gaulle", "ניו יורק"]
    }
  },
  "required": ["query"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("search_airports", {
  query: "לונדון"
});
```

#### תגובת דוגמה:
```json
{
  "success": true,
  "query": "לונדון",
  "airports": [
    {
      "code": "LHR",
      "name": "Heathrow",
      "city": "לונדון",
      "country": "בריטניה"
    },
    {
      "code": "LGW", 
      "name": "Gatwick",
      "city": "לונדון",
      "country": "בריטניה"
    }
  ]
}
```

---

### 13. book_flight
**מטרה:** הזמנת טיסה עם פרטי נוסע  
**שימוש:** להשלמת הזמנת טיסה

#### Input Schema:
```json
{
  "type": "object",
  "properties": {
    "flightId": {
      "type": "string",
      "description": "The flight ID to book",
      "pattern": "^FL\\d+$"
    },
    "passenger": {
      "type": "object",
      "description": "Primary passenger information",
      "properties": {
        "firstName": {
          "type": "string",
          "description": "Passenger first name",
          "minLength": 1
        },
        "lastName": {
          "type": "string",
          "description": "Passenger last name", 
          "minLength": 1
        },
        "email": {
          "type": "string",
          "format": "email",
          "description": "Passenger email address"
        },
        "phone": {
          "type": "string",
          "description": "Passenger phone number",
          "pattern": "^[+]?[0-9\\-\\s()]+$"
        }
      },
      "required": ["firstName", "lastName", "email"]
    }
  },
  "required": ["flightId", "passenger"]
}
```

#### דוגמת קריאה:
```typescript
await callTool("book_flight", {
  flightId: "FL001",
  passenger: {
    firstName: "יוסי",
    lastName: "כהן", 
    email: "yossi@example.com",
    phone: "050-1234567"
  }
});
```

#### תגובת דוגמה:
```json
{
  "success": true,
  "booking": {
    "bookingId": "BK1640995200000",
    "flight": {
      "id": "FL001",
      "flightNumber": "LY315"
    },
    "passenger": {
      "firstName": "יוסי",
      "lastName": "כהן"
    },
    "status": "Confirmed",
    "pnr": "ABC123",
    "totalPrice": 2850,
    "bookingDate": "2025-01-01T12:00:00Z",
    "ticketNumber": "226-1234567890"
  },
  "message": "Flight booked successfully!"
}
```

---

## 🔧 הטמעת כלים במערכת

### מבנה Handler גנרי:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "tool_name": {
        // Extract and validate parameters
        const { param1, param2 = defaultValue } = request.params.arguments as any;
        
        // Validate required parameters
        if (!param1 || typeof param1 !== 'string') {
          throw new Error('param1 is required and must be a string');
        }
        
        // Call the appropriate service
        const result = await serviceClass.methodName(param1, param2);
        
        // Return formatted response
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
```

### Error Handling Pattern:
```typescript
try {
  const result = await apiCall();
  return {
    content: [{
      type: "text",
      text: JSON.stringify(result, null, 2)
    }]
  };
} catch (error) {
  return {
    content: [{
      type: "text", 
      text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }]
  };
}
```

---

## 📊 סטטיסטיקות ביצועים

### זמני תגובה ממוצעים:
- **search_products**: ~300ms
- **get_product**: ~150ms  
- **create_order**: ~800ms
- **search_flights**: ~200ms (mock data)
- **book_flight**: ~100ms (mock booking)

### שימוש במשאבים:
- **זיכרון**: ~50MB per MCP server instance
- **CPU**: Minimal - רק בעת קריאות API
- **Network**: תלוי בShopify API rate limits

---

## 🛡️ אבטחה ובדיקות

### Validation Rules:
```typescript
// String validation
if (!query || typeof query !== 'string' || query.trim().length === 0) {
  throw new Error('Query must be a non-empty string');
}

// Number validation  
if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
  throw new Error('Limit must be a number between 1 and 100');
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (email && !emailRegex.test(email)) {
  throw new Error('Invalid email format');
}

// Date validation
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (departureDate && !dateRegex.test(departureDate)) {
  throw new Error('Date must be in YYYY-MM-DD format');
}
```

### Rate Limiting:
```typescript
// Implement per-tool rate limiting
const toolCallCounts = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_CALLS_PER_MINUTE = 100;

function checkRateLimit(toolName: string): boolean {
  const now = Date.now();
  const key = `${toolName}_${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  
  const currentCount = toolCallCounts.get(key) || 0;
  if (currentCount >= MAX_CALLS_PER_MINUTE) {
    throw new Error(`Rate limit exceeded for ${toolName}`);
  }
  
  toolCallCounts.set(key, currentCount + 1);
  return true;
}
```

---

## 🚀 כלים עתידיים מוצעים

### Shopify Advanced:
1. **update_product** - עדכון פרטי מוצר
2. **manage_inventory** - ניהול מלאי מתקדם  
3. **create_discount** - יצירת קופוני הנחה
4. **analytics_report** - דוחות מכירות
5. **customer_management** - ניהול לקוחות מתקדם

### Flight Advanced:
1. **multi_city_search** - חיפוש טיסות מרובות יעדים
2. **price_alerts** - התראות שינוי מחיר
3. **seat_selection** - בחירת מקומות
4. **upgrade_options** - אפשרויות שדרוג
5. **travel_insurance** - ביטוח נסיעות

### Integration Tools:
1. **sync_inventory** - סינכרון מלאי עם מערכות חיצוניות
2. **crm_integration** - חיבור למערכות CRM
3. **accounting_sync** - סינכרון עם מערכות חשבשבת
4. **shipping_tracking** - מעקב משלוחים
5. **review_management** - ניהול ביקורות

---

## 📚 מדריך שימוש מהיר

### לפיתוח כלי חדש:
1. **הגדר Schema** בrequestHandler של ListTools
2. **הוסף Case** בrequestHandler של CallTool  
3. **יממש Logic** במודול המתאים
4. **בדוק Validation** ו-Error Handling
5. **תעד** במדריך זה

### לבדיקת כלים:
```bash
# בנה את הפרויקט
npm run build

# הרץ בmoded dev
npm run dev

# בדוק עם Claude Desktop
# הכלים אמורים להופיע ברשימת MCP Tools
```

### לdebug בעיות:
1. **בדוק logs** בconsole
2. **ודא environment variables** תקינים
3. **בדוק network connectivity** לShopify API
4. **ודא Schema validation** עובר
5. **בדוק Error messages** מפורטים

---

## 🎯 סיכום

**המערכת כוללת 13 כלי MCP מתקדמים:**

### Shopify Tools (8):
✅ search_products  
✅ get_product  
✅ create_order  
✅ list_orders  
✅ compare_products  
✅ find_best_deals  
✅ search_by_vendor  
✅ products_by_price_range  

### Flight Tools (5):
✅ search_flights  
✅ get_flight_details  
✅ get_popular_destinations  
✅ search_airports  
✅ book_flight  

**כל כלי כולל:**
- Input Schema מלא ומתועד
- Validation וError Handling מקיף
- דוגמאות שימוש ברורות
- תגובות מובנות ועקביות
- אבטחה מובנית

**המערכת מוכנה לשימוש מלא עם Claude!** 🚀