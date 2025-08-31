# 🚀 MCP Shopify Server - מדריך פריסה לפרודקשן

## 📋 דרישות מערכת

- Docker 20.10+
- Docker Compose 2.0+
- חנות Shopify Development (מ-Shopify Partners)
- שרת עם 1GB RAM מינימום
- פורטים פתוחים: 80, 443, 3001, 8080

---

## 🏗️ שלבי הפריסה

### שלב 1: הכנת השרת

```bash
# עדכון המערכת (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# התקנת Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# התקנת Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### שלב 2: העתקת הפרויקט לשרת

```bash
# העלאה לשרת (דרך Git או SCP)
git clone <your-repo-url>
cd shopify-mcp-server

# או העתקה ישירה
scp -r C:\mcp\shopify-mcp-server user@your-server:/app/
```

### שלב 3: הגדרת משתני סביבה

```bash
# יצירת קובץ .env מהדוגמה
cp .env.example .env

# עריכת משתני הסביבה
nano .env
```

**עדכן את הפרטים הבאים ב-.env:**
```env
SHOPIFY_STORE_URL=https://your-dev-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_real_token
DOMAIN=your-domain.com
PORT=3001
NODE_ENV=production
```

### שלב 4: בניה והפעלה

```bash
# בניית הContainer
docker-compose build --no-cache

# הפעלה ברקע
docker-compose up -d

# בדיקת Status
docker-compose ps
docker-compose logs -f
```

---

## 🔒 אבטחה לפרודקשן

### SSL Certificate (Let's Encrypt)

```bash
# התקנת Certbot
sudo apt install certbot python3-certbot-nginx

# קבלת תעודה
sudo certbot --nginx -d your-domain.com

# חידוש אוטומטי
sudo crontab -e
# הוסף: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall

```bash
# הגדרת UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 📊 ניטור ובדיקות

### Health Checks

```bash
# בדיקת health endpoint
curl -f http://your-domain.com/health

# בדיקת Docker containers
docker-compose ps
docker stats
```

### Log Monitoring

```bash
# צפייה בלוגים
docker-compose logs -f mcp-shopify-server

# שמירת לוגים בקובץ
docker-compose logs > logs.txt
```

---

## 🛠️ פקודות שימושיות

### עדכון הפרויקט

```bash
# עצירה
docker-compose down

# עדכון קוד
git pull origin main

# בניה מחדש
docker-compose build --no-cache

# הפעלה
docker-compose up -d
```

### גיבוי ושחזור

```bash
# גיבוי volumes
docker run --rm -v mcp_logs:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .

# שחזור
docker run --rm -v mcp_logs:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /data
```

### Debug

```bash
# כניסה לcontainer
docker-compose exec mcp-shopify-server sh

# בדיקת network
docker network ls
docker network inspect shopify-mcp-server_mcp-network

# בדיקת ports
netstat -tlnp | grep :3001
```

---

## 🌐 אפשרויות פריסה לשרתים שונים

### AWS EC2

1. יצירת EC2 instance (t3.small או יותר)
2. הגדרת Security Group עם פורטים 80, 443, 22
3. חיבור Elastic IP
4. התקנה לפי המדריך למעלה

### DigitalOcean Droplet

1. יצירת Droplet Ubuntu 22.04
2. הגדרת Firewall
3. חיבור Domain
4. התקנה לפי המדריך

### Google Cloud Platform

```bash
# יצירת VM
gcloud compute instances create mcp-server \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud
```

### Heroku (Container Registry)

```bash
# התחברות ל-Heroku
heroku login
heroku container:login

# יצירת אפליקציה
heroku create your-mcp-app

# Push container
heroku container:push web
heroku container:release web

# הגדרת משתני סביבה
heroku config:set SHOPIFY_STORE_URL=https://your-store.myshopify.com
heroku config:set SHOPIFY_ACCESS_TOKEN=shpat_your_token
```

---

## 🚨 פתרון בעיות נפוצות

### Port already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Docker out of space
```bash
docker system prune -a
docker volume prune
```

### SSL issues
```bash
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📞 תמיכה

אם נתקלת בבעיות:

1. בדוק את הלוגים: `docker-compose logs -f`
2. וודא שכל משתני הסביבה מוגדרים נכון
3. בדוק connectivity לShopify API
4. ודא שהפורטים פתוחים

**🎉 לאחר פריסה מוצלחת, הגש ל:**
- Main Interface: `http://your-domain.com`
- Dashboard: `http://your-domain.com/dashboard`
- ChatShop: `http://your-domain.com/shop`
- Health Check: `http://your-domain.com/health`