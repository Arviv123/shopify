# 🚀 Quick Start - Shopify MCP Server

הדרכה מהירה להתחלת עבודה עם שרת MCP לShopify.

## 📋 דרישות מוקדמות

1. Node.js 18+ מותקן במחשב
2. חנות Shopify פעילה
3. Claude Desktop מותקן

## ⚡ התקנה מהירה

### 1. שכפל והתקן
```bash
git clone <repository-url>
cd shopify-mcp-server
npm install
npm run build
```

### 2. הפעל את ממשק הגדרת החנות
```bash
npm run web
```

🌐 פתח בדפדפן: http://localhost:3000

### 3. חבר את החנות שלך

בממשק הווב:
1. הזן כתובת החנות: `https://your-store.myshopify.com`
2. הזן את Access Token (ראה הוראות למטה)
3. לחץ "חיבור לחנות"
4. לחץ "צור הגדרות Claude Desktop"
5. העתק את ההגדרות ל-Claude Desktop

### 4. קבלת Access Token מ-Shopify

1. עבור ל: **Settings** → **Apps and sales channels** → **Develop apps**
2. לחץ **"Create an app"**
3. תן שם: "MCP Integration"
4. עבור ל-**Configuration** ובחר הרשאות:
   - ✅ `read_products`
   - ✅ `write_products` 
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_customers`
   - ✅ `write_customers`
5. לחץ **"Install app"** והעתק את הטוקן

### 5. הגדרת Claude Desktop

העתק את ההגדרות שנוצרו בממשק הווב לקובץ:

**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

### 6. אתחל מחדש את Claude Desktop

## 🛍️ בדיקה מהירה

פתח צ'אט חדש ב-Claude Desktop וכתב:

```
חפש מוצרים עם המילה "shirt"
```

או:

```
הראה לי את 5 ההזמנות האחרונות
```

## 🔧 פונקציות זמינות

| פונקציה | תיאור | דוגמה |
|---------|--------|---------|
| `search_products` | חיפוש מוצרים | "חפש חולצות כחולות" |
| `get_product` | פרטי מוצר | "הראה פרטים על מוצר 123" |
| `create_order` | יצירת הזמנה | "צור הזמנה עבור ישראל ישראלי" |
| `list_orders` | רשימת הזמנות | "הראה הזמנות אחרונות" |

## ❌ פתרון בעיות מהיר

### שגיאת חיבור
- ✅ ודא שכתובת החנות נכונה (עם https://)
- ✅ ודא שהטוקן נכון ופעיל
- ✅ בדוק שההרשאות הוגדרו באפליקציה

### Claude Desktop לא רואה את השרת
- ✅ וודא שההגדרות נמצאות בקובץ הנכון
- ✅ אתחל את Claude Desktop
- ✅ בדוק שהנתיב לשרת נכון

### שרת לא עובד
```bash
# בדיקת בנייה
npm run build

# הרצה ישירה
node build/index.js
```

## 💡 טיפים

- השתמש בממשק הווב לניהול החיבור
- שמור את הטוקן במקום בטוח
- בדוק קבוע שההרשאות פעילות
- השתמש בפונקציה "בדיקת חיבור" בממשק הווב

## 📞 תמיכה

בעיות? פתח issue בגיטהאב או בדוק את הלוגים:
```bash
# ראה שגיאות בזמן אמת
npm run dev
```