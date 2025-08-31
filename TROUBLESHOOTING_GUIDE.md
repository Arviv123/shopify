# מדריך פתרון בעיות - Shopify MCP Troubleshooting

## 🚨 הבעיה שקיבלת: Error 401 - Unauthorized

```
Error searching products: Failed to search products: AxiosError: Request failed with status code 401
```

זוהי בעיה נפוצה מאוד! בואו נפתור אותה צעד אחר צעד.

---

## 🔧 פתרונות מהירים לבעיית 401

### 1. בדיקת משתני סביבה
```bash
# בדוק שהמשתנים מוגדרים
echo $SHOPIFY_STORE_URL
echo $SHOPIFY_ACCESS_TOKEN

# אם הם לא מוגדרים:
export SHOPIFY_STORE_URL="https://your-store.myshopify.com"
export SHOPIFY_ACCESS_TOKEN="shpat_your_token_here"
```

### 2. פורמט נכון של Store URL
```bash
# ✅ נכון:
SHOPIFY_STORE_URL="https://my-store.myshopify.com"

# ❌ שגוי:
SHOPIFY_STORE_URL="my-store.myshopify.com"        # חסר https://
SHOPIFY_STORE_URL="https://my-store.com"          # חסר .myshopify
```

### 3. בדיקת Access Token
הToken צריך להתחיל ב-`shpat_` ולהיות באורך של 32-40 תווים:
```bash
# ✅ פורמט נכון:
shpat_abcd1234efgh5678ijkl9012mnop3456

# ❌ פורמטים שגויים:
abc123                    # קצר מדי
my_token_here            # לא מתחיל ב-shpat_
```

---

## 🏪 יצירת Shopify Access Token נכון

### שלב 1: כניסה ל-Shopify Admin
1. היכנס ל-https://your-store.myshopify.com/admin
2. לך ל-**Settings** → **Apps and sales channels**
3. לחץ על **Develop apps**

### שלב 2: יצירת Private App
```bash
1. לחץ "Create an app"
2. תן שם לאפליקציה: "MCP Integration"
3. לחץ "Create app"
```

### שלב 3: הגדרת הרשאות
```bash
Admin API access scopes נדרשים:
✅ read_products
✅ write_products  
✅ read_orders
✅ write_orders
✅ read_customers
✅ write_customers
```

### שלב 4: יצירת Access Token
1. לחץ על **Admin API access token** → **Create token**
2. העתק את הToken (מתחיל ב-`shpat_`)
3. שמור אותו במקום בטוח!

---

## ⚙️ הגדרת MCP עם הTokens הנכונים

### Windows (PowerShell):
```powershell
$env:SHOPIFY_STORE_URL="https://your-store.myshopify.com"
$env:SHOPIFY_ACCESS_TOKEN="shpat_your_real_token"
```

### Mac/Linux:
```bash
export SHOPIFY_STORE_URL="https://your-store.myshopify.com"
export SHOPIFY_ACCESS_TOKEN="shpat_your_real_token"
```

### Claude Desktop Config:
עדכן את `claude_desktop_config.json`:
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
        "SHOPIFY_ACCESS_TOKEN": "shpat_your_real_token_here"
      }
    }
  }
}
```

---

## 🧪 בדיקת החיבור

### 1. בדיקה ישירה עם cURL:
```bash
curl -X GET "https://your-store.myshopify.com/admin/api/2024-10/products.json?limit=1" \
  -H "X-Shopify-Access-Token: shpat_your_token"
```

**תגובה מצופה:**
```json
{
  "products": [...]
}
```

**אם יש שגיאה:**
```json
{
  "errors": "Unauthorized"
}
```

### 2. בדיקה עם הMCP Server:
```bash
cd shopify-mcp-server
npm run build
npm run dev
```

**צריך לראות:**
```
Shopify MCP server running on stdio
```

---

## 🔍 בעיות נפוצות נוספות

### שגיאה: "Store not found" (404)
```bash
# בעיה: Store URL לא נכון
❌ https://wrong-store.myshopify.com
✅ https://your-actual-store.myshopify.com

# איך למצוא את השם הנכון:
# היכנס לShopify Admin ותסתכל על הURL
```

### שגיאה: "API call limit exceeded" (429)
```bash
# Shopify מגביל 2 calls/second
# הפתרון: הוסף delay במימוש:

await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s delay
```

### שגיאה: "Invalid API version"
```bash
# בדוק שהגירסה נתמכת:
✅ 2024-10  (נתמך)
✅ 2024-07  (נתמך) 
✅ 2024-04  (נתמך)
❌ 2023-01  (לא נתמך)
```

### שגיאה: MCP Server לא מופיע ב-Claude Desktop
```json
// בדוק שהנתיב נכון בconfig:
{
  "mcpServers": {
    "shopify-mcp-server": {
      "command": "node",
      "args": [
        "C:\\full\\absolute\\path\\to\\build\\index.js"  // ✅ נתיב מלא
      ]
    }
  }
}
```

---

## 🛠️ דיאגנוסטיקה מתקדמת

### סקריפט בדיקה מלא:
```javascript
// test-shopify-connection.js
const axios = require('axios');

async function testShopifyConnection() {
  const storeUrl = process.env.SHOPIFY_STORE_URL;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  console.log('🔍 Testing Shopify connection...');
  console.log('Store URL:', storeUrl ? storeUrl : '❌ Not set');
  console.log('Token:', accessToken ? `✅ Set (${accessToken.substring(0, 10)}...)` : '❌ Not set');
  
  if (!storeUrl || !accessToken) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  try {
    const response = await axios.get(`${storeUrl}/admin/api/2024-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    console.log('✅ Connection successful!');
    console.log('Shop name:', response.data.shop.name);
    console.log('Shop domain:', response.data.shop.domain);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.response?.status, error.response?.statusText);
    
    if (error.response?.status === 401) {
      console.log('🔧 Fix: Check your access token');
    } else if (error.response?.status === 404) {
      console.log('🔧 Fix: Check your store URL');
    }
  }
}

testShopifyConnection();
```

### הרצת הבדיקה:
```bash
node test-shopify-connection.js
```

---

## 📋 Checklist לפתרון בעיות

### ✅ לפני פניה לתמיכה:
- [ ] בדקתי שהStore URL נכון
- [ ] בדקתי שהAccess Token תקין  
- [ ] יצרתי Private App עם הרשאות נכונות
- [ ] בדקתי עם cURL שהAPI עובד
- [ ] עדכנתי את Claude Desktop config
- [ ] רץ npm run build לפני הטסט
- [ ] בדקתי שהחנות פעילה

### ✅ פרטי Debug לשמירה:
- Store URL: ________________
- App Name: _________________  
- API Version: 2024-10
- Scopes Enabled: read_products, write_products, read_orders, write_orders
- Error Code: _______________
- Error Message: ____________

---

## 🎯 פתרון מהיר לבעיה שלך

בהתבסס על השגיאה שקיבלת, הבעיה היא **Access Token לא תקין או חסר**.

### מה לעשות עכשיו:

1. **בדוק משתני סביבה:**
```bash
echo $SHOPIFY_STORE_URL
echo $SHOPIFY_ACCESS_TOKEN
```

2. **אם הם חסרים, הוסף אותם:**
```bash
# החלף עם הפרטים האמיתיים שלך
export SHOPIFY_STORE_URL="https://your-actual-store.myshopify.com"
export SHOPIFY_ACCESS_TOKEN="shpat_your_real_token_from_shopify"
```

3. **עדכן Claude Desktop config:**
```json
{
  "mcpServers": {
    "shopify-mcp-server": {
      "command": "node", 
      "args": ["C:\\mcp\\shopify-mcp-server\\build\\index.js"],
      "env": {
        "SHOPIFY_STORE_URL": "https://your-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_your_token"
      }
    }
  }
}
```

4. **אתחל Claude Desktop** ונסה שוב!

---

## 🆘 אם זה עדיין לא עובד

### אפשרות 1: השתמש בחנות Demo
```javascript
// במקום חנות אמיתית, השתמש בנתונים לדוגמה
const DEMO_PRODUCTS = [
  {
    id: "123456",
    title: "מכנס ג'ינס כחול",
    price: "199.90",
    vendor: "Fashion Brand"
  }
];
```

### אפשרות 2: יצירת Shopify Development Store
1. לך ל-https://partners.shopify.com
2. צור Partner Account חינם
3. צור Development Store
4. השתמש בו לטסטים

### אפשרות 3: תמיכה מהקהילה
- Shopify Community Forums
- Discord/Slack של Shopify Developers
- Stack Overflow עם תג `shopify-api`

---

## 📞 צור קשר לעזרה

אם אתה עדיין נתקע, שתף:
1. **הודעת השגיאה המלאה**
2. **Store URL** (ללא הToken!)
3. **צעדים שביצעת**
4. **מערכת הפעלה** (Windows/Mac/Linux)

**זכור: אף פעם אל תשתף את הAccess Token ברבים!** 🔒

הבעיה שלך פתירה ב-99% מהמקרים עם הצעדים למעלה. בהצלחה! 🚀