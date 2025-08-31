# ===== MCP Shopify Server - Render Optimized Dockerfile =====

FROM node:20-alpine

# הגדרת metadata
LABEL maintainer="MCP Shopify Server"
LABEL description="Multi-Store Professional Interface with MCP Protocol for Render"

# הגדרת משתמש לא-root לאבטחה
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcpuser -u 1001

# הגדרת ספריית עבודה
WORKDIR /app

# העתקת package files תחילה לקאש אופטימלי
COPY --chown=mcpuser:nodejs package*.json ./

# התקנת dependencies (Render יריץ npm install בכל מקרה)
RUN npm ci --omit=dev && npm cache clean --force

# העתקת כל הקוד
COPY --chown=mcpuser:nodejs . .

# בניית הפרויקט (TypeScript -> JavaScript)
RUN npm run build

# הגדרת הרשאות
RUN chown -R mcpuser:nodejs /app

# מעבר למשתמש לא-root
USER mcpuser

# הגדרת משתני סביבה
ENV NODE_ENV=production

# Render ירשת את $PORT - לא נקבע כאן
# הפקודה תאזין ל-process.env.PORT ב-web-app.js

# פקודת הפעלה - Render ישתמש ב-npm start
CMD ["npm", "start"]