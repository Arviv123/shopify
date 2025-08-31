# חיבור למערכת Claude Desktop

## 🎯 כן, המערכת תהיה מחוברת ל-Claude Desktop!

### איך זה עובד:

1. **MCP Server**: המערכת כבר מכילה שרת MCP מוכן לעבודה עם Claude Desktop
2. **AI Chat**: הצ'אט בממשק האינטרנט מחובר לClaude דרך API  
3. **כלי מתקדמים**: 8 כלים מתקדמים לניהול חנויות זמינים ב-Claude Desktop

## 🚀 הגדרת Claude Desktop

### 1. הוסף את הקונפיגורציה הבאה ל-Claude Desktop:

```json
{
  "mcpServers": {
    "shopify-multi-store": {
      "command": "node",
      "args": ["C:/mcp/shopify-mcp-server/build/index.js"],
      "env": {
        "SHOPIFY_STORE_URL": "https://your-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_your_token_here"
      }
    }
  }
}
```

### 2. כלים זמינים ב-Claude Desktop:

- **🔍 search_products** - חיפוש מוצרים מתקדם
- **📊 compare_products** - השוואת מחירים בין מוצרים
- **💎 find_best_deals** - מציאת המוצרים הזולים ביותר
- **🏪 search_by_vendor** - חיפוש לפי ספק/מותג
- **💰 products_by_price_range** - מוצרים בטווח מחיר
- **📋 list_products** - רשימת כל המוצרים
- **🛒 create_order** - יצירת הזמנה חדשה
- **ℹ️ get_product_info** - פרטים מפורטים על מוצר

### 3. הפעלת השרתים:

```bash
# הפעלת MCP Server
cd C:/mcp/shopify-mcp-server
npm run build
node build/index.js

# הפעלת Web Interface (בחלון נפרד)
PORT=3001 node web-app.js
```

### 4. גישות למערכת:

- **Claude Desktop**: כלי MCP מתקדמים לניהול
- **Web Interface**: http://localhost:3001/store-manager.html
- **AI Chat**: ממשק צ'אט חכם עם Claude API

## 🔑 הגדרת API Keys

### עבור AI Chat בממשק האינטרנט:

```bash
# הוסף למשתני הסביבה או ל-.env
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### בלי API Key:
המערכת תעבוד גם בלי API key, אבל בלי תגובות AI חכמות בצ'אט

## 🎉 התוצאה:

✅ **Claude Desktop**: כלי MCP מקצועיים לניהול החנויות  
✅ **Web Interface**: ממשק מקצועי עם צ'אט חכם  
✅ **AI Integration**: המלצות חכמות מClaude  
✅ **Multi-Store**: ניהול מספר חנויות ממקום אחד  
✅ **Real-time**: עדכונים בזמן אמת  

## 🛠️ בעיות נפוצות:

**שגיאת חיבור MCP:**
```bash
# ודא שהשרת פועל
node build/index.js
```

**שגיאת API:**
```bash
# בדוק משתני סביבה
echo $SHOPIFY_STORE_URL
echo $ANTHROPIC_API_KEY
```

---

**המערכת מוכנה לעבודה מלאה עם Claude Desktop! 🚀**