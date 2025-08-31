import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ShopifyClient } from './shopify-client.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.WEB_PORT || 3000;
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
// Configuration file path
const CONFIG_FILE = path.join(__dirname, '../config.json');
// Load configuration
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error('Error loading config:', error);
    }
    return null;
}
// Save configuration
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error('Error saving config:', error);
    }
}
// API Routes
app.get('/api/config', (req, res) => {
    const config = loadConfig();
    if (config) {
        // Don't send the access token to the client
        const safeConfig = {
            storeUrl: config.storeUrl,
            storeName: config.storeName,
            lastConnected: config.lastConnected,
            isConnected: config.isConnected
        };
        res.json(safeConfig);
    }
    else {
        res.json({ isConnected: false });
    }
});
app.post('/api/connect', async (req, res) => {
    try {
        const { storeUrl, accessToken } = req.body;
        if (!storeUrl || !accessToken) {
            return res.status(400).json({ error: 'Store URL and access token are required' });
        }
        // Validate the store URL format
        const urlRegex = /^https:\/\/[\w-]+\.myshopify\.com$/;
        if (!urlRegex.test(storeUrl)) {
            return res.status(400).json({ error: 'Invalid store URL format. Should be: https://your-store.myshopify.com' });
        }
        // Test the connection
        const shopifyClient = new ShopifyClient(storeUrl, accessToken);
        try {
            // Try to fetch products to test the connection
            await shopifyClient.searchProducts('', 1);
            // Extract store name from URL
            const storeName = storeUrl.replace('https://', '').replace('.myshopify.com', '');
            // Save configuration
            const config = {
                storeUrl,
                accessToken,
                storeName,
                lastConnected: new Date().toISOString(),
                isConnected: true
            };
            saveConfig(config);
            res.json({
                success: true,
                message: 'Successfully connected to Shopify store',
                storeName
            });
        }
        catch (apiError) {
            res.status(401).json({
                error: 'Failed to connect to Shopify. Please check your store URL and access token.'
            });
        }
    }
    catch (error) {
        console.error('Connection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/disconnect', (req, res) => {
    try {
        const config = loadConfig();
        if (config) {
            config.isConnected = false;
            saveConfig(config);
        }
        res.json({ success: true, message: 'Disconnected from Shopify store' });
    }
    catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/test-connection', async (req, res) => {
    try {
        const config = loadConfig();
        if (!config || !config.isConnected) {
            return res.status(400).json({ error: 'No store connected' });
        }
        const shopifyClient = new ShopifyClient(config.storeUrl, config.accessToken);
        try {
            const products = await shopifyClient.searchProducts('', 5);
            res.json({
                success: true,
                message: 'Connection is working',
                productCount: products.length
            });
        }
        catch (apiError) {
            res.status(401).json({
                error: 'Connection failed. Please reconnect your store.'
            });
        }
    }
    catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Generate Claude Desktop configuration
app.get('/api/claude-config', (req, res) => {
    const config = loadConfig();
    if (!config || !config.isConnected) {
        return res.status(400).json({ error: 'No store connected' });
    }
    const serverPath = path.resolve(__dirname, 'index.js');
    const claudeConfig = {
        mcpServers: {
            shopify: {
                command: "node",
                args: [serverPath],
                env: {
                    SHOPIFY_STORE_URL: config.storeUrl,
                    SHOPIFY_ACCESS_TOKEN: config.accessToken
                }
            }
        }
    };
    res.json(claudeConfig);
});
// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.listen(port, () => {
    console.log(`🌐 Shopify MCP Configuration Server running at http://localhost:${port}`);
    console.log(`📝 Open your browser to configure your Shopify connection`);
});
//# sourceMappingURL=web-server.js.map