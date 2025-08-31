# 🚀 MCP Shopify Server

מערכת מתקדמת לניהול חנויות Shopify עם פרוטוקול MCP לאינטגרציה עם Claude AI.

## ✨ תכונות עיקריות

- 🛍️ **ממשק ChatShop** - קנייה חכמה עם AI
- 📊 **Dashboard מקצועי** - ניהול חנות מתקדם  
- ✈️ **מערכת טיסות** - אינטגרציה עם API טיסות
- 🔌 **MCP Protocol** - חיבור ישיר ל-Claude Desktop
- 🏪 **רב-חנויות** - תמיכה במספר חנויות Shopify

## 🏗️ פריסה ב-Render

### שלב 1: חיבור Repository
1. Fork את הפרויקט מגיטהאב
2. היכנס ל-[Render.com](https://render.com)
3. לחץ "New" → "Web Service"
4. חבר את הGitHub repository

### שלב 2: הגדרות Deploy
```
Name: mcp-shopify-server
Environment: Docker
Region: Oregon (או הקרוב ביותר)
Plan: Free
```

### שלב 3: משתני סביבה
הוסף ב-Render Dashboard:
```env
SHOPIFY_STORE_URL=https://your-dev-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_token_here
NODE_ENV=production
```

### שלב 4: Deploy
Render יבנה וירים את השירות אוטומטית (3-5 דקות).

## 🛠️ יצירת Shopify Development Store

1. עבור ל-[Shopify Partners](https://partners.shopify.com)
2. צור חשבון Partner (חינם)
3. צור Development Store חדשה
4. צור Private App עם הרשאות:
   - read_products, write_products
   - read_orders, write_orders  
   - read_customers, write_customers
5. העתק את Access Token (מתחיל ב-shpat_)

## 🌐 ממשקים זמינים

לאחר פריסה: `https://your-app.onrender.com`

- **🏠 Home:** `/`
- **📊 Dashboard:** `/dashboard` 
- **🛍️ ChatShop:** `/shop`
- **💬 Chat:** `/chat`
- **✈️ Flights:** `/flights`
- **🏥 Health:** `/health`

## 🔧 פיתוח מקומי

```bash
git clone https://github.com/Arviv123/shopify.git
cd shopify
npm install
cp .env.example .env
# ערוך .env עם פרטי החנות
npm run build
npm start
```

## 📊 פתרון בעיות

- **401 Unauthorized:** בדוק Access Token
- **Unavailable Shop:** צור חנות Development חדשה
- **Build שגיאות:** וודא שכל קבצים ב-Git

---

**🎉 מוכן לשימוש עם Claude AI ו-MCP Protocol!**
