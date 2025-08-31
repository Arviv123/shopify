# Shopify MCP Server

Professional MCP (Model Context Protocol) server for Shopify API integration with multi-interface web application.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Shopify credentials**:
   - Visit `/config` after starting the server to enter your Shopify store credentials through the web interface
   - Or set environment variables:
     ```bash
     SHOPIFY_STORE_URL=https://your-store.myshopify.com
     SHOPIFY_ACCESS_TOKEN=shpat_your_access_token_here
     ```

3. **Run the application**:
   ```bash
   npm run dev
   ```

4. **Access the interfaces**:
   - Main interface: `http://localhost:3001/`
   - Configuration: `http://localhost:3001/config`
   - Shop interface: `http://localhost:3001/shop`
   - Dashboard: `http://localhost:3001/dashboard`

## 🛠 Features

### MCP Tools (8 available)
- `search_products` - Search products by query
- `get_product_details` - Get detailed product information
- `list_products` - List all products
- `create_order` - Create new orders
- `list_orders` - List store orders
- `compare_products` - Compare products and analyze prices
- `find_best_deals` - Find best deals across products
- `search_by_vendor` - Search products by vendor/brand

### Web Interfaces
- **Configuration Interface** (`/config`) - Set up Shopify credentials securely
- **Shop Interface** (`/shop`) - Customer-facing shopping experience
- **Dashboard** (`/dashboard`) - Admin and analytics dashboard
- **Health Check** (`/health`) - System status monitoring

## 🔧 Configuration

### Option 1: Web Interface (Recommended)
1. Start the server: `npm run dev`
2. Visit `http://localhost:3001/config`
3. Enter your Shopify store URL and access token
4. Test the connection and save

### Option 2: Environment Variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_access_token_here
PORT=3001
```

## 🚀 Deployment

### Render.com
1. Connect your GitHub repository
2. Set environment variables in Render dashboard:
   - `SHOPIFY_STORE_URL`
   - `SHOPIFY_ACCESS_TOKEN`
3. Deploy automatically

### Docker
```bash
docker build -t shopify-mcp-server .
docker run -p 8080:8080 -e SHOPIFY_STORE_URL=your_url -e SHOPIFY_ACCESS_TOKEN=your_token shopify-mcp-server
```

## 📋 Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Development mode with auto-restart
- `npm start` - Production mode
- `npm run mcp` - Run MCP server only

## 🔐 Security

- No hardcoded credentials in the codebase
- Runtime configuration through secure web interface
- Environment variable support for production
- Input validation and error handling

## 📚 API Documentation

The server provides REST APIs at:
- `POST /api/chat/search` - Product search
- `POST /api/order/create` - Order creation
- `GET /api/config` - Configuration status
- `POST /api/config/test` - Test Shopify connection
- `POST /api/config/save` - Save configuration

## 🧪 Testing

Visit `/health` for system status and `/health/detailed` for comprehensive health information.

## 📦 Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0
- Valid Shopify store with Admin API access
- Shopify private app or custom app with required permissions

## 🆘 Support

For issues and feature requests, please check the troubleshooting guide or contact support.