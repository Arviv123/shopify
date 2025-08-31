# 🤖 הגדרת מפתח API של בינה מלאכותית

## 📍 איפה להוסיף את מפתח ה-API:

### 1. קובץ .env (המקום הנכון)

```bash
# ערוך את הקובץ:
C:/mcp/shopify-mcp-server/.env

# הוסף את המפתח:
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 2. קבלת מפתח API מ-Anthropic:

1. **לך לאתר**: https://console.anthropic.com/
2. **הירשם/התחבר** לחשבון
3. **API Keys** -> **Create Key**
4. **העתק את המפתח** (מתחיל ב-`sk-ant-api03-`)

### 3. הוספת המפתח בצורה מאובטחת:

```bash
# דרך 1: עריכת קובץ .env
notepad C:/mcp/shopify-mcp-server/.env

# דרך 2: דרך שורת הפקודה
echo ANTHROPIC_API_KEY=your_key_here >> .env

# דרך 3: משתני סביבה זמניים
set ANTHROPIC_API_KEY=your_key_here
```

## 🔧 בדיקה שהמפתח עובד:

```bash
# הפעל את השרת עם המפתח
cd C:/mcp/shopify-mcp-server
node web-app.js
```

### סימנים שהמפתח עובד:
✅ **בצ'אט**: תקבל המלצות AI מקצועיות בעברית  
✅ **במסוף**: לא יהיו שגיאות "AI response failed"  
✅ **בחיפוש**: תראה קטע "🤖 המלצת עוזר הבינה המלאכותית"  

### בלי מפתח API:
⚠️ המערכת תעבוד, אבל בלי תגובות AI חכמות

## 🔒 אבטחה:

- **לעולם לא** תשתף את המפתח בקוד
- קובץ `.env` לא נשמר ב-Git
- המפתח נשמר רק במחשב שלך

## 🚀 הפעלה לאחר הוספת המפתח:

```bash
# עצור את השרת (Ctrl+C)
# הפעל מחדש
PORT=3002 node web-app.js

# בדוק בכתובת:
http://localhost:3002/store-manager.html
```

---

**המקום הנכון: קובץ `.env` בתיקיית הפרויקט!** 🎯