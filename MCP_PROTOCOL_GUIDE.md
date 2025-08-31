# מדריך פרוטוקול MCP - Model Context Protocol

## 🎯 מה זה MCP?

**Model Context Protocol (MCP)** הוא פרוטוקול פתוח שמאפשר לבינות מלאכותיות (כמו Claude) להתחבר לכלים ומקורות נתונים חיצוניים. במקום להסתמך על מידע סטטי, הAI יכול לגשת למידע בזמן אמת ולבצע פעולות ישירות במערכות שלכם.

### יתרונות MCP:
✅ **גישה לזמן אמת** - מידע עדכני ולא מידע מיושן  
✅ **פעולות אקטיביות** - לא רק מידע, גם יכולת לבצע משימות  
✅ **אבטחה מובנית** - הרשאות מוגדרות בצורה ברורה  
✅ **מודולריות** - כל כלי עובד בנפרד ובבטחה  

---

## 🏗️ ארכיטקטורת MCP במערכת שלנו

```
Claude Desktop/API
        ↓
   MCP Protocol
        ↓
Shopify MCP Server (src/index.ts)
        ↓
┌─────────────────┬──────────────────┐
│  ShopifyClient  │    FlightAPI     │
│   (store data)  │ (flight search)  │
└─────────────────┴──────────────────┘
```

### רכיבי המערכת:
1. **MCP Server** (`src/index.ts`) - השרת הראשי שמקשיב לבקשות מClaud
2. **Tools** - כלים ספציפיים (חיפוש מוצרים, יצירת הזמנות, וכד')
3. **Clients** - מודולים שמתחברים לAPIs חיצוניים
4. **Transport** - STDIO או TCP לתקשורת

---

## 📁 קבצי MCP במערכת

### 1. `src/index.ts` - השרת הראשי
זה הקובץ העיקרי של MCP Server:

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// יצירת שרת MCP
const server = new Server(
  {
    name: "shopify-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // כלים זמינים
    },
  }
);
```

#### מטפלי בקשות (Request Handlers)

**1. רשימת כלים (List Tools Handler):**
```typescript
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
      // ... עוד כלים
    ]
  };
});
```

**2. קריאת כלים (Call Tool Handler):**
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "search_products": {
      const { query, limit = 10 } = request.params.arguments as any;
      
      try {
        const products = await shopifyClient.searchProducts(query, limit);
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
            text: `Error: ${error.message}`
          }]
        };
      }
    }
    
    // ... טיפול בכלים נוספים
  }
});
```

### 2. `src/shopify-client.ts` - מודול Shopify
```typescript
export class ShopifyClient {
  private client: AxiosInstance;
  
  constructor(storeUrl: string, accessToken: string) {
    this.client = axios.create({
      baseURL: `${storeUrl}/admin/api/2024-10`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    // חיפוש מוצרים בShopify API
    const response = await this.client.get('/products.json', {
      params: { limit: 250 }
    });
    
    // סינון לוקלי לתוצאות רלוונטיות
    const filteredProducts = response.data.products.filter((product: Product) => {
      return (
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.tags.toLowerCase().includes(query.toLowerCase())
      );
    });
    
    return filteredProducts.slice(0, limit);
  }

  async createOrder(lineItems, customer, shippingAddress): Promise<Order> {
    // יצירת הזמנה חדשה בShopify
    const orderData = {
      order: {
        line_items: lineItems,
        customer: customer,
        shipping_address: shippingAddress
      }
    };

    const response = await this.client.post('/orders.json', orderData);
    return response.data.order;
  }
}
```

### 3. `src/flight-api.ts` - מודול טיסות
```typescript
export class FlightAPI {
  private mockFlights: Flight[];

  async searchFlights(searchParams: FlightSearchParams): Promise<FlightSearchResult> {
    const {
      origin = 'TLV',
      destination,
      departureDate,
      passengers = 1,
      class: travelClass = 'Economy'
    } = searchParams;

    // סינון טיסות לפי פרמטרים
    let flights = this.mockFlights.filter(flight => {
      const matchesDestination = flight.destination.code === destination.toUpperCase();
      const matchesOrigin = flight.origin.code === origin.toUpperCase();
      const matchesClass = flight.class === travelClass;
      
      return matchesDestination && matchesOrigin && matchesClass;
    });

    return {
      success: true,
      totalFlights: flights.length,
      flights: flights,
      searchId: `search_${Date.now()}`
    };
  }
}
```

---

## 🛠️ כלי MCP זמינים

### כלי Shopify:

#### 1. `search_products`
חיפוש מוצרים בחנות.
```json
{
  "name": "search_products",
  "arguments": {
    "query": "מכנסיים כחולים",
    "limit": 10
  }
}
```

#### 2. `get_product`
קבלת פרטי מוצר ספציפי.
```json
{
  "name": "get_product", 
  "arguments": {
    "productId": "123456789"
  }
}
```

#### 3. `create_order`
יצירת הזמנה חדשה.
```json
{
  "name": "create_order",
  "arguments": {
    "lineItems": [
      {"variantId": "123", "quantity": 2}
    ],
    "customer": {
      "email": "customer@example.com",
      "firstName": "יוסי",
      "lastName": "כהן"
    },
    "shippingAddress": {
      "address1": "רחוב הרצל 123",
      "city": "תל אביב", 
      "country": "Israel"
    }
  }
}
```

#### 4. `list_orders`
רשימת הזמנות.
```json
{
  "name": "list_orders",
  "arguments": {
    "limit": 10,
    "status": "open"
  }
}
```

#### 5. `compare_products`
השוואת מוצרים.
```json
{
  "name": "compare_products",
  "arguments": {
    "searchTerm": "חולצות"
  }
}
```

#### 6. `find_best_deals`
מציאת המבצעים הטובים ביותר.
```json
{
  "name": "find_best_deals",
  "arguments": {
    "limit": 10
  }
}
```

#### 7. `search_by_vendor`
חיפוש לפי ספק.
```json
{
  "name": "search_by_vendor",
  "arguments": {
    "vendor": "זארה",
    "limit": 20
  }
}
```

#### 8. `products_by_price_range`
מוצרים בטווח מחירים.
```json
{
  "name": "products_by_price_range",
  "arguments": {
    "minPrice": 100,
    "maxPrice": 500,
    "limit": 20
  }
}
```

### כלי טיסות:

#### 9. `search_flights`
חיפוש טיסות.
```json
{
  "name": "search_flights",
  "arguments": {
    "origin": "TLV",
    "destination": "JFK", 
    "departureDate": "2025-01-15",
    "passengers": 2,
    "class": "Economy"
  }
}
```

#### 10. `get_flight_details`
פרטי טיסה.
```json
{
  "name": "get_flight_details",
  "arguments": {
    "flightId": "FL001"
  }
}
```

#### 11. `get_popular_destinations`
יעדים פופולריים.
```json
{
  "name": "get_popular_destinations",
  "arguments": {
    "origin": "TLV",
    "limit": 10
  }
}
```

#### 12. `search_airports`
חיפוש שדות תעופה.
```json
{
  "name": "search_airports",
  "arguments": {
    "query": "לונדון"
  }
}
```

#### 13. `book_flight`
הזמנת טיסה.
```json
{
  "name": "book_flight",
  "arguments": {
    "flightId": "FL001",
    "passenger": {
      "firstName": "יוסי",
      "lastName": "כהן",
      "email": "yossi@example.com"
    }
  }
}
```

---

## ⚙️ הגדרת MCP

### 1. Environment Variables
```bash
# .env
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
FLIGHT_API_KEY=your_flight_api_key (optional)
AMADEUS_API_KEY=your_amadeus_key (optional)
```

### 2. package.json
```json
{
  "name": "shopify-mcp-server",
  "type": "module",
  "main": "build/index.js",
  "bin": {
    "shopify-mcp-server": "./build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "npm run build && node build/index.js", 
    "start": "npm run build && node build/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.4",
    "axios": "^1.11.0"
  }
}
```

### 3. tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "inlineSourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

---

## 🚀 הרצת MCP Server

### בניית הפרויקט
```bash
cd shopify-mcp-server
npm install
npm run build
```

### הרצה ישירה
```bash
npm run dev
# או
npm start
```

### הרצה עם Claude Desktop
1. הוסף את השרת ל-Claude Desktop config
2. השרת ירוץ אוטומטית כשClaud יצטרך אותו

---

## 🔌 חיבור ל-Claude Desktop

### config.json ל-Claude Desktop
```json
{
  "mcpServers": {
    "shopify-mcp-server": {
      "command": "node",
      "args": [
        "C:\\path\\to\\shopify-mcp-server\\build\\index.js"
      ],
      "env": {
        "SHOPIFY_STORE_URL": "https://your-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxx"
      }
    }
  }
}
```

### מיקום קבצי Config:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

---

## 🔍 דוגמאות שימוש

### חיפוש מוצרים עם Claude:
```
אני: "חפש לי מכנסי ג'ינס כחולים"
Claude: משתמש בכלי search_products עם query "מכנסי ג'ינס כחולים"
תוצאה: רשימת מוצרים רלוונטיים מהחנות
```

### יצירת הזמנה:
```
אני: "צור הזמנה למכנס הזה עם הכתובת שלי"
Claude: משתמש בכלי create_order עם הפרטים
תוצאה: הזמנה חדשה בShopify עם מספר הזמנה
```

### חיפוש טיסות:
```
אני: "מצא לי טיסות לניו יורק לתאריך 15/1"
Claude: משתמש בכלי search_flights עם origin=TLV, destination=JFK
תוצאה: רשימת טיסות זמינות עם מחירים
```

---

## 📊 מבנה תגובות MCP

### תגובה מוצלחת:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"products\": [...]\n}"
    }
  ]
}
```

### תגובת שגיאה:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error searching products: Invalid query parameter"
    }
  ]
}
```

---

## 🛡️ אבטחה ב-MCP

### 1. Validation של פרמטרים
```typescript
// בדיקת תקינות פרמטרים
if (!query || typeof query !== 'string') {
  throw new Error('Query must be a valid string');
}

if (limit && (limit < 1 || limit > 100)) {
  throw new Error('Limit must be between 1 and 100');
}
```

### 2. Error Handling
```typescript
try {
  const result = await shopifyClient.searchProducts(query, limit);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
} catch (error) {
  return {
    content: [{
      type: "text",
      text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }]
  };
}
```

### 3. הגנה על API Keys
```typescript
// אף פעם לא לחשוף מפתחות API בתגובות
const sanitizedConfig = {
  storeUrl: this.storeUrl,
  // accessToken: 'HIDDEN' - לא מחזירים את המפתח
};
```

---

## 🔧 פיתוח וDebug

### בדיקת כלים:
```bash
# בדיקה שהשרת עובד
npm run dev

# בדיקה עם Claude Desktop
# השרת אמור להופיע ברשימת MCP Servers
```

### לוגים:
```typescript
console.error("Shopify MCP server running on stdio");
console.log('🛫 Flight search request:', searchParams);
console.log(`✈️ Found ${flights.length} flights`);
```

### טיפול בבעיות נפוצות:

**בעיה: "Module not found"**
```bash
# פתרון
npm run build
```

**בעיה: "Invalid Shopify credentials"**
```bash
# בדוק שהמשתנים מוגדרים נכון
echo $SHOPIFY_STORE_URL
echo $SHOPIFY_ACCESS_TOKEN
```

**בעיה: "Claude doesn't see the tools"**
```json
// בדוק ש-config.json תקין
{
  "mcpServers": {
    "shopify-mcp-server": {
      "command": "node",
      "args": ["path/to/build/index.js"]
    }
  }
}
```

---

## 📈 הרחבות עתידיות

### כלים נוספים שניתן להוסיף:

#### 1. ניהול מלאי
```typescript
{
  name: "update_inventory",
  description: "Update product inventory levels",
  inputSchema: {
    type: "object",
    properties: {
      variantId: { type: "string" },
      quantity: { type: "number" }
    }
  }
}
```

#### 2. אנליטיקס
```typescript
{
  name: "get_sales_analytics", 
  description: "Get sales analytics for the store",
  inputSchema: {
    type: "object",
    properties: {
      dateRange: { type: "string" },
      granularity: { type: "string" }
    }
  }
}
```

#### 3. ניהול לקוחות
```typescript
{
  name: "search_customers",
  description: "Search customers in the store", 
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string" },
      phone: { type: "string" }
    }
  }
}
```

---

## 🎯 סיכום

**מערכת MCP שלנו מספקת:**

✅ **13 כלים פונקציונליים** - Shopify + טיסות  
✅ **אינטגרציה מלאה** - חיבור ישיר לShopify API  
✅ **אבטחה מובנית** - Validation וerror handling  
✅ **קלות שימוש** - Claude יכול להשתמש בכלים בצורה טבעית  
✅ **הרחבות עתידיות** - קל להוסיף כלים חדשים  
✅ **ביצועים טובים** - תגובות מהירות ויעילות  

**המערכת מוכנה לשימוש עם Claude Desktop וClaud API!**

השרת רץ בbackground ומחכה לבקשות מClaud. כל פעם ש-Claude צריך מידע על המוצרים או רוצה לבצע פעולה, הוא משתמש בכלי MCP המתאים ומקבל מידע בזמן אמת ישירות מהמערכות שלכם.