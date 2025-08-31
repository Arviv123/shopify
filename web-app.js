#!/usr/bin/env node

// Professional Multi-Store Web Interface
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { ShopifyClient } from './build/shopify-client.js';
import { FlightAPI } from './build/flight-api.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render דורש שימוש בprocess.env.PORT ללא ברירת מחדל קבועה
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Disable caching for all static files
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
app.use('/styles', express.static(path.join(__dirname, 'public', 'styles'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));
app.use('/js', express.static(path.join(__dirname, 'public', 'js'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Routes for customer chat
app.get('/customer-chat', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, 'public', 'customer-chat-v2.html'));
});

app.get('/customer-chat-v2', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, 'public', 'customer-chat-v2.html'));
});

// Route for shop with no-cache
app.get('/shop', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString()
  });
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

// Store connections registry
const storeConnections = new Map();
const pendingOrders = new Map();

// Flight API instance
const flightAPI = new FlightAPI();

// Configuration for the old interface compatibility
app.get('/api/config', (req, res) => {
  res.json({
    isConnected: storeConnections.size > 0,
    totalStores: storeConnections.size,
    lastConnected: new Date().toISOString()
  });
});

// Legacy connect endpoint for old interface
app.post('/api/connect', async (req, res) => {
  try {
    const { storeUrl, accessToken } = req.body;
    
    const client = new ShopifyClient(storeUrl, accessToken);
    try {
      await client.searchProducts('', 1);
    } catch (testError) {
      console.error('Connection test failed:', testError.message);
      return res.status(401).json({
        success: false,
        error: 'Shopify connection failed (401). Verify Admin API Access Token and scopes, then try again.'
      });
    }
    
    const storeId = uuidv4();
    storeConnections.set(storeId, {
      id: storeId,
      name: 'Legacy Connection',
      url: storeUrl,
      token: accessToken,
      owner: 'legacy@example.com',
      client: client,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Connected successfully',
      storeId
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Store owner dashboard endpoints
app.post('/api/stores/connect', async (req, res) => {
  try {
    const { storeName, storeUrl, accessToken, ownerEmail } = req.body;
    
    // Validate connection
    const client = new ShopifyClient(storeUrl, accessToken);
    try {
      await client.searchProducts('', 1); // Test connection
    } catch (testError) {
      console.error('Connection test failed:', testError.message);
      return res.status(401).json({
        success: false,
        error: 'Shopify connection failed (401). Verify Admin API Access Token and required scopes, then try again.'
      });
    }
    
    const storeId = uuidv4();
    storeConnections.set(storeId, {
      id: storeId,
      name: storeName,
      url: storeUrl,
      token: accessToken,
      owner: ownerEmail,
      client: client,
      createdAt: new Date()
    });
    
    res.json({ 
      success: true, 
      storeId,
      message: 'Store connected successfully',
      stores: Array.from(storeConnections.values()).map(s => ({
        id: s.id,
        name: s.name,
        url: s.url,
        owner: s.owner,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: `Connection failed: ${error.message}` 
    });
  }
});

// Get all connected stores
app.get('/api/stores', (req, res) => {
  const stores = Array.from(storeConnections.values()).map(store => ({
    id: store.id,
    name: store.name,
    url: store.url,
    owner: store.owner,
    createdAt: store.createdAt
  }));
  res.json({ stores });
});

// AI-Enhanced Chat with smart responses
async function generateAIResponse(query, products, storeData) {
  // Use dynamic AI configuration
  let currentApiKey;
  switch (aiConfig.provider) {
    case 'anthropic':
      currentApiKey = aiConfig.anthropicKey;
      break;
    case 'openai':
      currentApiKey = aiConfig.openaiKey;
      break;
    case 'gemini-free':
      currentApiKey = aiConfig.geminiFreeKey;
      break;
    case 'huggingface':
      currentApiKey = aiConfig.huggingfaceKey;
      break;
    case 'ollama':
      currentApiKey = aiConfig.ollamaUrl;
      break;
    case 'deepseek':
      currentApiKey = aiConfig.deepseekKey;
      break;
    default:
      currentApiKey = null;
  }
  
  // If no AI configured, return a smart demo response
  if (!currentApiKey || aiConfig.provider === 'none') {
    return generateDemoAIResponse(query, products, storeData);
  }
  
  try {
    const axios = (await import('axios')).default;
    
    const prompt = `
אתה עוזר מכירות מקצועי בחנות אלקטרוניקה ישראלית מתקדמת שמחובר ל-Claude Desktop.

שאלת הלקוח: "${query}"

מוצרים זמינים (${products.length}):
${products.slice(0, 5).map(p => `• ${p.title} - ₪${p.price} (${p.storeName})`).join('\n')}

חנויות מחוברות: ${storeData.totalStores || 1}

תענה בעברית בצורה ידידותית ומקצועית:
1. הסבר מה מצאת ממספר החנויות
2. המלץ על המוצרים הטובים ביותר עם יתרונות
3. תן טיפים לבחירה חכמה והשוואת מחירים
4. עודד לרכישה עם דגש על שירות והבדלי מחיר

תשובה מקצועית ומועילה (עד 200 מילים) המדגישה את היתרון של החיפוש הרב-חנותי.
    `;

    let response;
    
    if (aiConfig.provider === 'anthropic') {
      response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: aiConfig.model,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentApiKey,
          'anthropic-version': '2023-06-01'
        }
      });
      return response.data.content[0].text;
    } else if (aiConfig.provider === 'openai') {
      response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: aiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApiKey}`
        }
      });
      return response.data.choices[0].message.content;
    } else if (aiConfig.provider === 'gemini-free') {
      response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${currentApiKey}`, {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data.candidates[0].content.parts[0].text;
    } else if (aiConfig.provider === 'huggingface') {
      response = await axios.post(`https://api-inference.huggingface.co/models/${aiConfig.model}`, {
        inputs: prompt,
        parameters: { max_length: 200, temperature: 0.7 }
      }, {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`
        }
      });
      return response.data.generated_text || response.data[0].generated_text || 'תשובה מבינה מלאכותית זמינה';
    } else if (aiConfig.provider === 'ollama') {
      response = await axios.post(`${currentApiKey}/api/generate`, {
        model: aiConfig.model,
        prompt: prompt,
        stream: false
      });
      return response.data.response;
    } else if (aiConfig.provider === 'deepseek') {
      response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: aiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApiKey}`
        }
      });
      return response.data.choices[0].message.content;
    }
  } catch (error) {
    console.error('AI response failed:', error.message);
    return null;
  }
}

// AI response for Flights using the same provider configuration
async function generateFlightAIResponse(query, flights, context) {
  try {
    // If no provider configured, return a smart demo response
    const hasProvider = aiConfig.provider && aiConfig.provider !== 'none';
    const hasKey = (aiConfig.provider === 'anthropic' && aiConfig.anthropicKey) ||
                   (aiConfig.provider === 'openai' && aiConfig.openaiKey) ||
                   (aiConfig.provider === 'gemini-free' && aiConfig.geminiFreeKey) ||
                   (aiConfig.provider === 'huggingface' && aiConfig.huggingfaceKey) ||
                   (aiConfig.provider === 'ollama' && aiConfig.ollamaUrl) ||
                   (aiConfig.provider === 'deepseek' && aiConfig.deepseekKey);
    if (!hasProvider || !hasKey) {
      const count = flights.length;
      if (count === 0) {
        return 'לא נמצאו טיסות זמינות. נסו יעד/תאריכים אחרים או מחלקה אחרת.';
      }
      const min = Math.min(...flights.map(f => f.price?.amount || 0));
      const max = Math.max(...flights.map(f => f.price?.amount || 0));
      return `מצאתי ${count} טיסות ליעד שביקשתם בתאריך ${context?.departureDate}. טווח המחירים נע בין ₪${min} ל-₪${max}. מומלץ לשקול טיסה ישירה אם חשוב קיצור זמן, או עם עצירה אם המחיר חשוב יותר.`;
    }

    const axios = (await import('axios')).default;
    const top = flights.slice(0, 5).map(f => `• ${f.airline} ${f.flightNumber || ''} – ${f.origin?.code || ''}→${f.destination?.code || ''} – ${f.price?.formatted || f.price}`).join('\n');
    const prompt = `אתה יועץ טיסות מומחה בעברית. קיבלנו בקשת חיפוש: "${query}"\n\nהקשר: מוצא: ${context?.origin || 'TLV'}, יעד: ${context?.destination || ''}, תאריך יציאה: ${context?.departureDate || ''}, נוסעים: ${context?.passengers || 1}, מחלקה: ${context?.class || 'Economy'}.\n\nנמצאו ${flights.length} טיסות. דוגמאות:\n${top}\n\nהחזר תשובה קצרה, ממוקדת ומועילה בעברית: 1) מסקנה כללית 2) 2-3 המלצות פרקטיות (טיסה ישירה/עצירה, חברת תעופה, מחיר) 3) הצעה לשינוי תאריך/יעד אם אין תוצאות.`;

    let currentApiKey;
    switch (aiConfig.provider) {
      case 'anthropic': currentApiKey = aiConfig.anthropicKey; break;
      case 'openai': currentApiKey = aiConfig.openaiKey; break;
      case 'gemini-free': currentApiKey = aiConfig.geminiFreeKey; break;
      case 'huggingface': currentApiKey = aiConfig.huggingfaceKey; break;
      case 'ollama': currentApiKey = aiConfig.ollamaUrl; break;
      case 'deepseek': currentApiKey = aiConfig.deepseekKey; break;
      default: currentApiKey = null;
    }

    if (aiConfig.provider === 'anthropic') {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: aiConfig.model,
        max_tokens: 250,
        messages: [{ role: 'user', content: prompt }]
      }, { headers: { 'Content-Type': 'application/json', 'x-api-key': currentApiKey, 'anthropic-version': '2023-06-01' } });
      return response.data.content[0].text;
    } else if (aiConfig.provider === 'openai') {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: aiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250
      }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` } });
      return response.data.choices[0].message.content;
    } else if (aiConfig.provider === 'gemini-free') {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${currentApiKey}`, {
        contents: [{ parts: [{ text: prompt }] }]
      }, { headers: { 'Content-Type': 'application/json' } });
      return response.data.candidates[0].content.parts[0].text;
    } else if (aiConfig.provider === 'huggingface') {
      const response = await axios.post(`https://api-inference.huggingface.co/models/${aiConfig.model}`, {
        inputs: prompt,
        parameters: { max_length: 220, temperature: 0.7 }
      }, { headers: { 'Authorization': `Bearer ${currentApiKey}` } });
      return response.data.generated_text || response.data[0]?.generated_text || 'תשובת AI זמינה.';
    } else if (aiConfig.provider === 'ollama') {
      const response = await axios.post(`${currentApiKey}/api/generate`, { model: aiConfig.model, prompt, stream: false });
      return response.data.response;
    } else if (aiConfig.provider === 'deepseek') {
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: aiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250
      }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` } });
      return response.data.choices[0].message.content;
    }

    return null;
  } catch (error) {
    console.error('AI flight response failed:', error.message);
    return null;
  }
}

// Smart store name generator based on product - Enhanced Hebrew names
function getSmartStoreName(product) {
  const title = product.title.toLowerCase();
  const type = product.product_type?.toLowerCase() || '';
  const vendor = product.vendor?.toLowerCase() || '';
  
  // Map products to appropriate Hebrew store names
  if (title.includes('laptop') || title.includes('gaming') || title.includes('computer') || title.includes('pc')) {
    return '🖥️ טכנולוגיה ומחשבים';
  } else if (title.includes('smartphone') || title.includes('phone') || title.includes('mobile')) {
    return '📱 סלולר וטכנולוגיה';
  } else if (title.includes('toddler') || title.includes('children') || title.includes('baby') || title.includes('kids') || 
             title.includes('ילד') || title.includes('בייבי') || type.includes('clothes')) {
    return '👶 בגדי ילדים ותינוקות';
  } else if (title.includes('tennis') || title.includes('bike') || title.includes('sport') || title.includes('fitness')) {
    return '🏃 ספורט וכושר';
  } else if (title.includes('encyclopedia') || title.includes('book') || title.includes('education')) {
    return '📚 ספרים וחינוך';
  } else if (title.includes('garden') || title.includes('tool') || title.includes('outdoor')) {
    return '🌱 גינה וכלי עבודה';
  } else if (title.includes('headphone') || title.includes('audio') || title.includes('speaker')) {
    return '🎵 אודיו ובידור';
  } else if (title.includes('home') || title.includes('kitchen') || title.includes('cookware')) {
    return '🏠 בית ומטבח';
  } else if (title.includes('fashion') || title.includes('clothing') || title.includes('shirt') || 
             title.includes('dress') || title.includes('pants')) {
    return '👕 אופנה ובגדים';
  } else if (title.includes('beauty') || title.includes('cosmetic') || title.includes('skincare')) {
    return '💄 יופי וקוסמטיקה';
  } else if (title.includes('car') || title.includes('automotive') || title.includes('vehicle')) {
    return '🚗 רכב ואביזרים';
  } else if (title.includes('toy') || title.includes('game') || title.includes('play')) {
    return '🧸 צעצועים ומשחקים';
  } else if (title.includes('health') || title.includes('medical') || title.includes('pharmacy')) {
    return '⚕️ בריאות ותרופות';
  } else {
    return '🛍️ מרקט כללי';
  }
}

// Demo AI responses when no API key is configured
function generateDemoAIResponse(query, products, storeData) {
  const productCount = products.length;
  const storeCount = storeData.totalStores || 1;
  
  // Generate contextual responses based on query and products
  const responses = {
    laptop: `מצאתי עבורך ${productCount} אפשרויות מעניינות ללפטופ! המחיר נע בין ₪${Math.min(...products.map(p => parseFloat(p.price || '0')))} ל-₪${Math.max(...products.map(p => parseFloat(p.price || '0')))}. המלצתי: בדוק את האפשרות הזולה ביותר תחילה - לפעמים זה בדיוק מה שאתה צריך!`,
    
    phone: `יש לנו ${productCount} סמארטפונים זמינים! המחירים משתנים בהתאם לדגם והתכונות. המלצתי: תבדוק את המפרט הטכני של כל דגם כדי לוודא שהוא מתאים לצרכים שלך.`,
    
    children: `מוצרי ילדים? מצאתי ${productCount} פריטים מ-${storeCount} חנויות שונות. חשוב לבדוק גיל מומלץ ותקני בטיחות. המחירים נראים הוגנים!`,
    
    gaming: `לגיימרים יש לנו ${productCount} מוצרים מעולים! בין אם זה לפטופ גיימינג או אוזניות, המלצתי לבדוק ביקורות של משתמשים. המחיר הממוצע נראה תחרותי.`,
    
    default: `מצאתי עבורך ${productCount} מוצרים מ-${storeCount} חנויות! יש לי כמה המלצות: 1️⃣ השווה מחירים 2️⃣ בדוק ביקורות 3️⃣ שים לב לעלויות משלוח. בהצלחה!`
  };
  
  // Choose response based on query content
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('לפטופ') || lowerQuery.includes('laptop')) {
    return responses.laptop;
  } else if (lowerQuery.includes('טלפון') || lowerQuery.includes('phone') || lowerQuery.includes('סמארטפון')) {
    return responses.phone;
  } else if (lowerQuery.includes('ילד') || lowerQuery.includes('children') || lowerQuery.includes('בייבי')) {
    return responses.children;
  } else if (lowerQuery.includes('גיימינג') || lowerQuery.includes('gaming') || lowerQuery.includes('אוזני')) {
    return responses.gaming;
  } else {
    return responses.default;
  }
}

// Hebrew to English translation for search - Enhanced dictionary
function translateSearchQuery(query) {
  console.log(`📝 translateSearchQuery received: "${query}" (type: ${typeof query})`);
  const translations = {
    // בגדים וילדים
    'בגדי ילדים': 'children baby kids clothes clothing toddler',
    'ילדים': 'children baby kids toddler youth',
    'תינוק': 'baby toddler infant',
    'בגדים': 'clothes clothing shirt pants dress',
    'חולצה': 'shirt t-shirt blouse top',
    'חולצות': 'shirts t-shirts blouses tops',
    'מכנס': 'pants trousers jeans',
    'מכנסיים': 'pants trousers jeans',
    'נעליים': 'shoes sneakers boots',
    'שמלה': 'dress',
    'חצאית': 'skirt',
    'מעיל': 'jacket coat',
    'סוודר': 'sweater hoodie',
    
    // טכנולוgiיה
    'מחשב': 'computer laptop desktop PC',
    'לפטופ': 'laptop computer notebook',
    'טלפון': 'phone smartphone mobile cellphone',
    'סמארטפון': 'smartphone phone mobile',
    'אוזניות': 'headphones earphones headset',
    'טלוויזיה': 'tv television screen monitor',
    'מקלדת': 'keyboard',
    'עכבר': 'mouse',
    'מסך': 'screen monitor display',
    'מצלמה': 'camera',
    
    // רכב
    'רכב': 'car automotive vehicle',
    'מכונית': 'car vehicle auto',
    'מוצרי רכב': 'car automotive vehicle parts',
    'אופניים': 'bicycle bike cycling',
    'גלגלים': 'wheels tires',
    
    // בית וגינה
    'כלי מטבח': 'kitchen utensils cookware',
    'מטבח': 'kitchen cooking',
    'סיר': 'pot pan cookware',
    'כוס': 'cup mug glass',
    'צלחת': 'plate dish',
    'גינה': 'garden gardening outdoor',
    'צמחים': 'plants flowers gardening',
    'כלי גינה': 'garden tools gardening equipment',
    
    // ספרים וחינוך
    'ספרים': 'book books encyclopedia education',
    'ספר': 'book',
    'אנציקלופדיה': 'encyclopedia books education',
    'משחקים': 'games toys play',
    'צעצועים': 'toys games children kids',
    
    // ספורט
    'ספורט': 'sport sports fitness exercise',
    'כושר': 'fitness sports exercise gym',
    'כדור': 'ball sports',
    'טניס': 'tennis sports',
    'ריצה': 'running sports fitness',
    
    // יופי ובריאות
    'קוסמטיקה': 'cosmetics beauty makeup',
    'יופי': 'beauty cosmetics skincare',
    'בריאות': 'health wellness medical',
    'תרופות': 'medicine health pharmacy'
  };
  
  let searchTerms = [query]; // Always include original query
  
  // Add exact matches first
  Object.keys(translations).forEach(hebrew => {
    console.log(`🔍 Checking if "${query.toLowerCase()}" includes "${hebrew.toLowerCase()}"`);
    if (query.toLowerCase().includes(hebrew.toLowerCase())) {
      console.log(`✅ Match found! Adding: ${translations[hebrew]}`);
      searchTerms.push(translations[hebrew]);
      // Also add individual words from translation
      translations[hebrew].split(' ').forEach(word => {
        if (word.length > 2 && !searchTerms.includes(word)) {
          searchTerms.push(word);
        }
      });
    }
  });
  
  // Add fuzzy matching for partial words
  const queryLower = query.toLowerCase();
  Object.keys(translations).forEach(hebrew => {
    if (queryLower.includes(hebrew.substring(0, Math.min(3, hebrew.length))) && 
        !searchTerms.includes(translations[hebrew])) {
      searchTerms.push(translations[hebrew]);
    }
  });
  
  return searchTerms.slice(0, 8); // Limit to 8 search terms to avoid API overload
}

// Chat-based product search across all stores
app.post('/api/chat/search', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { query, storeId } = req.body;
    
    if (storeId) {
      // Search specific store
      const store = storeConnections.get(storeId);
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      
      const products = await store.client.searchProducts(query, 10);
      res.json({
        success: true,
        store: store.name,
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.variants[0]?.price,
          vendor: p.vendor,
          type: p.product_type,
          image: p.images[0]?.src,
          storeId: store.id,
          storeName: getSmartStoreName(p)
        }))
      });
    } else {
      // Search across all stores with Hebrew translation support
      const allResults = [];
      const searchTerms = translateSearchQuery(query);
      console.log(`🔍 Searching for: "${query}"`);
      console.log(`🔤 Translated terms: ${searchTerms.join(', ')}`);
      
      for (const [id, store] of storeConnections) {
        const storeName = store.name || store.storeName || 'חנות לא מזוהה';
        console.log(`🏪 Searching in store: ${storeName}`);
        try {
          // Try all search terms and collect unique results
          const seenProducts = new Set();
          
          for (const searchTerm of searchTerms) {
            console.log(`   ➤ Trying search term: "${searchTerm}"`);
            try {
              const products = await store.client.searchProducts(searchTerm, 10);
              console.log(`   ✅ Found ${products.length} products for "${searchTerm}"`);
              
              products.forEach(p => {
                if (!seenProducts.has(p.id)) {
                  seenProducts.add(p.id);
                  allResults.push({
                    id: p.id,
                    title: p.title,
                    price: p.variants[0]?.price,
                    vendor: p.vendor,
                    type: p.product_type,
                    image: p.images[0]?.src,
                    storeId: id,
                    storeName: getSmartStoreName(p)
                  });
                }
              });
            } catch (searchError) {
              console.log(`   ❌ Search term "${searchTerm}" failed for store ${store.name}: ${searchError.message}`);
            }
          }
        } catch (error) {
          console.error(`❌ Search failed for store ${store.name}:`, error.message);
        }
      }
      
      console.log(`🎯 Total unique products found: ${allResults.length}`);
      
      // Sort by price for better comparison
      allResults.sort((a, b) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
      
      // Generate AI response if available
      const aiResponse = await generateAIResponse(query, allResults, {
        totalStores: storeConnections.size,
        totalProducts: allResults.length
      });
      
      res.json({
        success: true,
        totalStores: storeConnections.size,
        totalProducts: allResults.length,
        products: allResults,
        aiResponse: aiResponse // Smart AI recommendation
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Price comparison across stores
app.post('/api/chat/compare', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    const comparison = {};
    
    for (const [id, store] of storeConnections) {
      try {
        const products = await store.client.compareProducts(searchTerm);
        comparison[store.name] = {
          storeId: id,
          categories: products
        };
      } catch (error) {
        comparison[store.name] = { error: error.message };
      }
    }
    
    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Store for tracking orders
const orderTracker = new Map();

// Create order (like Claude Desktop)
app.post('/api/orders/create', async (req, res) => {
  try {
    const { productId, storeId, quantity = 1, customerInfo, productTitle, productPrice } = req.body;
    
    const store = storeConnections.get(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Get product details to get variant ID
    const product = await store.client.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Use first variant
    const variantId = product.variants[0]?.id;
    if (!variantId) {
      return res.status(400).json({ error: 'No variants available' });
    }
    
    // Create comprehensive customer info
    const defaultCustomer = {
      email: customerInfo?.email || 'customer@example.com',
      firstName: customerInfo?.firstName || 'לקוח',
      lastName: customerInfo?.lastName || 'חדש',
      phone: customerInfo?.phone || null,
      acceptsMarketing: customerInfo?.marketing || false
    };
    
    const defaultAddress = {
      address1: customerInfo?.address || 'רחוב ראשי 1',
      city: 'תל אביב',
      province: 'מרכז',
      country: 'IL',
      zip: '12345'
    };
    
    // Create line items
    const lineItems = [{
      variantId: variantId,
      quantity: parseInt(quantity)
    }];
    
    // Create order in Shopify
    const order = await store.client.createOrder(lineItems, defaultCustomer, defaultAddress);
    
    // Generate order tracking ID
    const orderTrackingId = uuidv4();
    
    // Store order for tracking
    const orderData = {
      orderId: order.id,
      orderNumber: order.order_number || order.name,
      storeId,
      storeName: store.name,
      productTitle,
      productPrice,
      quantity,
      customer: {
        email: defaultCustomer.email,
        firstName: customerInfo?.firstName || 'לקוח',
        lastName: customerInfo?.lastName || 'חדש',
        phone: defaultCustomer.phone,
        acceptsMarketing: defaultCustomer.acceptsMarketing
      },
      total: order.total_price,
      currency: 'ILS',
      status: 'pending_payment',
      createdAt: new Date(),
      shopifyOrder: order,
      items: [{
        title: productTitle,
        name: productTitle,
        price: productPrice,
        quantity: quantity
      }]
    };
    
    // Store in both maps
    orderTracker.set(orderTrackingId, orderData);
    pendingOrders.set(orderTrackingId, orderData);
    
    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number || order.name,
      trackingId: orderTrackingId,
      total: order.total_price,
      currency: 'ILS',
      customerEmail: defaultCustomer.email,
      message: 'Order created successfully in Shopify!',
      emailNote: 'Shopify will send an order confirmation email automatically'
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ error: `Order creation failed: ${error.message}` });
  }
});

// Checkout page endpoint
app.get('/checkout/:token', (req, res) => {
  const { token } = req.params;
  const order = pendingOrders.get(token);
  
  if (!order) {
    return res.status(404).send('<h1>Order Not Found</h1><p>This checkout link is invalid or has expired.</p>');
  }
  
  // Return checkout page HTML
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>השלמת הזמנה - ${order.storeName}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .store-name { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
        .order-summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; margin: 10px 0; }
        .total { font-size: 20px; font-weight: bold; color: #059669; border-top: 2px solid #e5e7eb; padding-top: 15px; }
        .customer-info { margin: 20px 0; }
        .payment-section { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .btn { background: #059669; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 20px; }
        .btn:hover { background: #047857; }
        .security-note { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #1e40af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="store-name">${order.storeName}</div>
            <h2>סיכום הזמנה</h2>
        </div>
        
        <div class="order-summary">
            <h3>פריטים בהזמנה:</h3>
            ${order.items.map(item => `
                <div class="item">
                    <span>${item.title || item.name}</span>
                    <span>₪${item.price} × ${item.quantity}</span>
                </div>
            `).join('')}
            
            <div class="item total">
                <span>סכום לתשלום:</span>
                <span>₪${order.total}</span>
            </div>
        </div>
        
        <div class="customer-info">
            <h3>פרטי הזמנה:</h3>
            <p><strong>שם:</strong> ${order.customer.firstName || ''} ${order.customer.lastName || ''}</p>
            <p><strong>אימייל:</strong> ${order.customer.email}</p>
        </div>
        
        <div class="security-note">
            🔒 <strong>אבטחת תשלום:</strong> לצורך אבטחתך, התשלום מתבצע באתר החנות הרשמי. לא נשמור פרטי כרטיס אשראי באתר זה.
        </div>
        
        <div class="payment-section">
            <h3>⚠️ השלמת תשלום</h3>
            <p>להשלמת ההזמנה, אנא לחץ על הכפתור למטה כדי לעבור לעמוד התשלום המאובטח של החנות:</p>
            <button class="btn" onclick="completePayment()">
                🛡️ מעבר לתשלום מאובטח
            </button>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            הזמנה נוצרה ב-${order.createdAt.toLocaleString('he-IL')}<br>
            מספר הזמנה: ${token.substr(0, 8)}
        </div>
    </div>
    
    <script>
        function completePayment() {
            // In a real implementation, redirect to actual Shopify checkout
            alert('בפיתוח: כאן יעבור הלקוח לעמוד התשלום המאובטח של החנות');
            
            // Simulate payment completion
            fetch('/api/orders/complete/${token}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(response => response.json())
              .then(data => {
                  if (data.success) {
                      document.body.innerHTML = '<div class="container"><h2 style="color: #059669;">✅ ההזמנה הושלמה בהצלחה!</h2><p>תודה על הרכישה!</p></div>';
                  }
              });
        }
    </script>
</body>
</html>
  `);
});

// Get order status
app.get('/api/orders/:trackingId/status', (req, res) => {
  try {
    const { trackingId } = req.params;
    const order = orderTracker.get(trackingId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      order: {
        trackingId,
        orderNumber: order.orderNumber,
        status: order.status,
        productTitle: order.productTitle,
        quantity: order.quantity,
        total: order.total,
        currency: order.currency,
        storeName: order.storeName,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        customer: order.customer
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete order payment
app.post('/api/orders/:trackingId/pay', (req, res) => {
  try {
    const { trackingId } = req.params;
    const { paymentMethod = 'paypal_demo' } = req.body;
    const order = orderTracker.get(trackingId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order status to paid
    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentMethod = paymentMethod;
    
    // Remove from pending orders after payment
    pendingOrders.delete(trackingId);
    
    res.json({ 
      success: true, 
      message: 'Payment completed successfully!',
      order: {
        trackingId,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency,
        paidAt: order.paidAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete order payment (alternative endpoint for checkout page)
app.post('/api/orders/complete/:token', (req, res) => {
  try {
    const { token } = req.params;
    const order = pendingOrders.get(token);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found or already completed' });
    }
    
    // Update order status to paid
    const trackedOrder = orderTracker.get(token);
    if (trackedOrder) {
      trackedOrder.status = 'paid';
      trackedOrder.paidAt = new Date();
    }
    
    // Remove from pending orders
    pendingOrders.delete(token);
    
    res.json({ 
      success: true, 
      message: 'Payment completed successfully!',
      redirect: '/confirmation'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Additional API endpoints for compatibility
app.post('/api/disconnect', (req, res) => {
  storeConnections.clear();
  res.json({ success: true, message: 'All stores disconnected' });
});

app.post('/api/test-connection', async (req, res) => {
  if (storeConnections.size === 0) {
    return res.status(400).json({ error: 'No stores connected' });
  }
  
  const firstStore = storeConnections.values().next().value;
  try {
    const products = await firstStore.client.searchProducts('', 1);
    res.json({ 
      success: true, 
      message: 'Connection successful',
      productCount: products.length 
    });
  } catch (error) {
    res.status(400).json({ error: `Connection test failed: ${error.message}` });
  }
});

// AI Configuration endpoints
let aiConfig = {
  provider: 'none', // Start with demo mode - no AI for now
  model: 'claude-3-sonnet-20240229',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  geminiFreeKey: process.env.GEMINI_API_KEY || '',
  huggingfaceKey: process.env.HUGGINGFACE_TOKEN || '',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  deepseekKey: process.env.DEEPSEEK_API_KEY || ''
};

// Get AI configuration
app.get('/api/ai/config', (req, res) => {
  res.json({
    provider: aiConfig.provider,
    model: aiConfig.model,
    anthropicKey: aiConfig.anthropicKey ? '***' + aiConfig.anthropicKey.slice(-4) : '',
    openaiKey: aiConfig.openaiKey ? '***' + aiConfig.openaiKey.slice(-4) : '',
    geminiFreeKey: aiConfig.geminiFreeKey ? '***' + aiConfig.geminiFreeKey.slice(-4) : '',
    huggingfaceKey: aiConfig.huggingfaceKey ? '***' + aiConfig.huggingfaceKey.slice(-4) : '',
    ollamaUrl: aiConfig.ollamaUrl,
    deepseekKey: aiConfig.deepseekKey ? '***' + aiConfig.deepseekKey.slice(-4) : ''
  });
});

// Save AI configuration
app.post('/api/ai/config', (req, res) => {
  try {
    const { provider, model, anthropicKey, openaiKey, geminiFreeKey, huggingfaceKey, ollamaUrl, deepseekKey } = req.body;
    
    if (provider) aiConfig.provider = provider;
    if (model) aiConfig.model = model;
    if (anthropicKey && !anthropicKey.startsWith('***')) aiConfig.anthropicKey = anthropicKey;
    if (openaiKey && !openaiKey.startsWith('***')) aiConfig.openaiKey = openaiKey;
    if (geminiFreeKey && !geminiFreeKey.startsWith('***')) aiConfig.geminiFreeKey = geminiFreeKey;
    if (huggingfaceKey && !huggingfaceKey.startsWith('***')) aiConfig.huggingfaceKey = huggingfaceKey;
    if (ollamaUrl) aiConfig.ollamaUrl = ollamaUrl;
    if (deepseekKey && !deepseekKey.startsWith('***')) aiConfig.deepseekKey = deepseekKey;
    
    res.json({ 
      success: true, 
      message: 'AI configuration saved successfully',
      config: {
        provider: aiConfig.provider,
        model: aiConfig.model
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Failed to save configuration: ${error.message}` 
    });
  }
});

// Test AI connection
app.post('/api/ai/test', async (req, res) => {
  try {
    console.log('🧪 AI Test Request Body:', req.body);
    const { provider, model, apiKey } = req.body;
    console.log('🧪 AI Test Parsed:', { provider, model, apiKeyLength: apiKey?.length, hasProvider: !!provider, hasModel: !!model, hasApiKey: !!apiKey });
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'API key is required' 
      });
    }
    
    if (!provider || !model) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider and model are required' 
      });
    }
    
    let testResult = false;
    let errorMessage = '';
    let testResponse = '';
    
    console.log('🔍 Testing provider:', provider);
    
    if (provider === 'anthropic') {
      console.log('📝 Testing Anthropic...');
      try {
        const axios = (await import('axios')).default;
        
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
          model: model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 10000
        });
        
        testResult = response.status === 200;
      } catch (error) {
        errorMessage = error.response?.data?.error?.message || error.message;
      }
    } else if (provider === 'openai') {
      try {
        const axios = (await import('axios')).default;
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000
        });
        
        testResult = response.status === 200;
      } catch (error) {
        errorMessage = error.response?.data?.error?.message || error.message;
      }
    } else if (provider === 'gemini-free') {
      console.log('🤖 Testing Gemini Free...');
      try {
        const axios = (await import('axios')).default;
        
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          contents: [{
            parts: [{ text: 'Hello' }]
          }]
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        testResult = response.status === 200;
        if (testResult && response.data.candidates) {
          testResponse = response.data.candidates[0]?.content?.parts[0]?.text || 'Gemini connection successful';
        }
      } catch (error) {
        errorMessage = error.response?.data?.error?.message || error.message;
      }
    } else if (provider === 'huggingface') {
      try {
        const axios = (await import('axios')).default;
        
        const response = await axios.post(`https://api-inference.huggingface.co/models/${model}`, {
          inputs: 'Hello',
          parameters: { max_length: 20 }
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 15000
        });
        
        testResult = response.status === 200;
        testResponse = 'Hugging Face connection successful';
      } catch (error) {
        errorMessage = error.response?.data?.error || error.message;
      }
    } else if (provider === 'ollama') {
      try {
        const axios = (await import('axios')).default;
        
        const response = await axios.post(`${apiKey}/api/generate`, {
          model: model,
          prompt: 'Hello',
          stream: false
        }, {
          timeout: 15000
        });
        
        testResult = response.status === 200;
        testResponse = response.data.response || 'Ollama connection successful';
      } catch (error) {
        console.log('❌ Ollama error:', error.message);
        errorMessage = error.message;
        if (error.code === 'ECONNREFUSED') {
          errorMessage = 'לא ניתן להתחבר ל-Ollama. ודא ש-Ollama פועל על המחשב.';
        }
      }
    } else if (provider === 'deepseek') {
      try {
        const axios = (await import('axios')).default;
        
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000
        });
        
        testResult = response.status === 200;
      } catch (error) {
        console.log('❌ DeepSeek error:', error.message);
        errorMessage = error.response?.data?.error?.message || error.message;
      }
    } else {
      console.log('⚠️ Unknown provider:', provider);
    }
    
    console.log('📊 Test results:', { testResult, errorMessage, testResponse });
    
    if (testResult) {
      res.json({ 
        success: true, 
        message: `${provider} connection successful`,
        model: model,
        response: testResponse
      });
    } else {
      // Check if provider was recognized
      const supportedProviders = ['anthropic', 'openai', 'gemini-free', 'huggingface', 'ollama', 'deepseek'];
      if (!supportedProviders.includes(provider)) {
        return res.status(400).json({ 
          success: false, 
          error: `ספק לא נתמך: ${provider}. ספקים נתמכים: ${supportedProviders.join(', ')}` 
        });
      }
      
      res.status(400).json({ 
        success: false, 
        error: errorMessage || `בדיקת חיבור ל-${provider} נכשלה. בדוק את המפתח והרשת.`,
        details: {
          provider: provider,
          model: model,
          hasApiKey: !!apiKey,
          errorMessage: errorMessage
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Test failed: ${error.message}` 
    });
  }
});

// Get AI status
app.get('/api/ai/status', (req, res) => {
  const hasApiKey = (aiConfig.provider === 'anthropic' && aiConfig.anthropicKey) ||
                    (aiConfig.provider === 'openai' && aiConfig.openaiKey) ||
                    (aiConfig.provider === 'gemini-free' && aiConfig.geminiFreeKey) ||
                    (aiConfig.provider === 'huggingface' && aiConfig.huggingfaceKey) ||
                    (aiConfig.provider === 'ollama' && aiConfig.ollamaUrl) ||
                    (aiConfig.provider === 'deepseek' && aiConfig.deepseekKey) ||
                    (aiConfig.provider === 'none');
  
  res.json({
    active: hasApiKey && aiConfig.provider !== 'none',
    provider: aiConfig.provider,
    model: aiConfig.model,
    configured: hasApiKey
  });
});

app.get('/api/claude-config', (req, res) => {
  res.json({
    mcpServers: {
      "shopify-mcp": {
        command: "node",
        args: ["build/index.js"],
        env: {
          "SHOPIFY_STORE_URL": "https://your-store.myshopify.com",
          "SHOPIFY_ACCESS_TOKEN": "your_access_token"
        }
      }
    }
  });
});

// Admin reset endpoints (DEV ONLY) - clear stores and reset AI config
app.post('/api/admin/reset', (req, res) => {
  try {
    storeConnections.clear();
    pendingOrders.clear();
    aiConfig.provider = 'none';
    aiConfig.model = 'claude-3-sonnet-20240229';
    aiConfig.anthropicKey = '';
    aiConfig.openaiKey = '';
    aiConfig.geminiFreeKey = '';
    aiConfig.huggingfaceKey = '';
    aiConfig.ollamaUrl = 'http://localhost:11434';
    aiConfig.deepseekKey = '';
    res.json({ success: true, message: 'Server reset: all stores cleared, AI disabled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/reset', (req, res) => {
  storeConnections.clear();
  pendingOrders.clear();
  aiConfig.provider = 'none';
  aiConfig.model = 'claude-3-sonnet-20240229';
  aiConfig.anthropicKey = '';
  aiConfig.openaiKey = '';
  aiConfig.geminiFreeKey = '';
  aiConfig.huggingfaceKey = '';
  aiConfig.ollamaUrl = 'http://localhost:11434';
  aiConfig.deepseekKey = '';
  res.json({ success: true, message: 'Server reset: all stores cleared, AI disabled' });
});

// Default route - serve the new modular dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Store manager route
app.get('/store-manager', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Alternative route to bypass cache
app.get('/shop-manager', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Friendly routes for direct navigation
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Customer interface route
app.get('/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});


// Flights route for customers
app.get('/flights', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'flights.html'));
});

// ===== FLIGHT API ENDPOINTS =====

// Search flights
app.post('/api/flights/search', async (req, res) => {
  try {
    console.log('✈️ Flight search request:', req.body);
    const result = await flightAPI.searchFlights(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ Flight search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get flight details
app.get('/api/flights/:flightId', async (req, res) => {
  try {
    const { flightId } = req.params;
    const result = await flightAPI.getFlightDetails(flightId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get popular destinations
app.get('/api/flights/destinations/:origin?', async (req, res) => {
  try {
    const { origin = 'TLV' } = req.params;
    const { limit = 10 } = req.query;
    const result = await flightAPI.getPopularDestinations(origin, parseInt(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search airports
app.get('/api/flights/airports/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    const result = await flightAPI.searchAirports(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Book flight
app.post('/api/flights/:flightId/book', async (req, res) => {
  try {
    const { flightId } = req.params;
    const passengerInfo = req.body;
    const result = await flightAPI.bookFlight(flightId, passengerInfo);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Chat endpoint with MCP flight integration
app.post('/api/chat/flights', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('🛫 MCP Flight chat query:', query);
    
    // Use AI with MCP to process the query and enrich with configured AI provider
    const parsed = await processFlightQueryWithAI(query);
    if (parsed?.success) {
      const flightsArr = Array.isArray(parsed.flights) ? parsed.flights : [];
      const aiText = await generateFlightAIResponse(query, flightsArr, parsed.searchParams || {});
      return res.json({ ...parsed, aiResponse: aiText || parsed.aiResponse });
    }
    return res.json(parsed || { success: false, error: 'Unknown error' });
  } catch (error) {
    console.error('❌ MCP Flight chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// MCP-powered AI flight query processor
async function processFlightQueryWithAI(query) {
  try {
    // For demo purposes, we'll simulate AI processing with intelligent parsing
    const queryLower = query.toLowerCase();
    
    // Extract destinations from common Hebrew/English terms
    const destinations = {
      'ניו יורק': 'JFK', 'new york': 'JFK', 'ny': 'JFK',
      'לונדון': 'LHR', 'london': 'LHR',
      'פריז': 'CDG', 'paris': 'CDG',
      'רומא': 'FCO', 'rome': 'FCO',
      'איסטנבול': 'IST', 'istanbul': 'IST',
      'דובאי': 'DXB', 'dubai': 'DXB',
      'פרנקפורט': 'FRA', 'frankfurt': 'FRA',
      'לוס אנג\'לס': 'LAX', 'los angeles': 'LAX', 'la': 'LAX'
    };
    
    // Find destination in query
    let destination = null;
    for (const [city, code] of Object.entries(destinations)) {
      if (queryLower.includes(city)) {
        destination = code;
        break;
      }
    }
    
    // Extract date patterns
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let departureDate = tomorrow.toISOString().split('T')[0];
    
    // Look for date patterns like "מחר", "עוד שבוע", etc.
    if (queryLower.includes('מחר') || queryLower.includes('tomorrow')) {
      // Already set to tomorrow
    } else if (queryLower.includes('עוד שבוע') || queryLower.includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      departureDate = nextWeek.toISOString().split('T')[0];
    }
    
    // Extract passenger count
    let passengers = 1;
    const passengerMatch = query.match(/(\d+)\s*(נוסעים|passengers|people)/i);
    if (passengerMatch) {
      passengers = parseInt(passengerMatch[1]);
    }
    
    // Extract class preference
    let travelClass = 'Economy';
    if (queryLower.includes('עסקים') || queryLower.includes('business')) {
      travelClass = 'Business';
    } else if (queryLower.includes('ראשונה') || queryLower.includes('first class')) {
      travelClass = 'First';
    }
    
    // If we have a destination, search flights using MCP-style call
    if (destination) {
      const searchParams = {
        origin: 'TLV',
        destination,
        departureDate,
        passengers,
        class: travelClass
      };
      
      console.log('🔍 MCP Flight search params:', searchParams);
      
      // Call our flight API (simulating MCP tool call)
      const flightResult = await flightAPI.searchFlights(searchParams);
      
      if (flightResult.success && flightResult.flights && flightResult.flights.length > 0) {
        return {
          success: true,
          aiResponse: `🛫 מצאתי עבורכם ${flightResult.flights.length} טיסות ל${getDestinationName(destination)}!\n\n💡 **AI הבין מהשאילתה שלכם:**\n• יעד: ${getDestinationName(destination)}\n• תאריך: ${departureDate}\n• נוסעים: ${passengers}\n• מחלקה: ${travelClass === 'Economy' ? 'תייר' : travelClass}`,
          flights: flightResult.flights,
          totalFlights: flightResult.flights.length,
          searchParams,
          mcpProcessing: true
        };
      } else {
        return {
          success: true,
          aiResponse: `🤔 לא מצאתי טיסות ל${getDestinationName(destination)} בתאריך ${departureDate}.\n\nהאמי מבין את הבקשה שלכם אבל אין טיסות זמינות. נסו:\n• תאריך אחר\n• יעד אחר\n• פחות נוסעים`,
          flights: [],
          totalFlights: 0,
          mcpProcessing: true
        };
      }
    } else {
      // General flight help with popular destinations
      const popularDestinations = await flightAPI.getPopularDestinations('TLV', 6);
      
      return {
        success: true,
        aiResponse: `🤖 **AI מנתח את הבקשה שלכם...**\n\nהאמי הבין שאתם רוצים לחפש טיסות, אבל לא זיהה יעד ספציפי.\n\n✈️ **יעדים פופולריים מתל אביב:**`,
        popularDestinations: popularDestinations.destinations || [],
        helpMessage: '💡 **עצות לחיפוש טוב יותר:**\nכתבו למשל: "טיסה לניו יורק מחר" או "רוצה לטוס ללונדון עם 2 נוסעים במחלקת עסקים"',
        mcpProcessing: true
      };
    }
    
  } catch (error) {
    console.error('❌ AI processing error:', error);
    return {
      success: false,
      error: `AI processing failed: ${error.message}`,
      mcpProcessing: true
    };
  }
}

// Helper function to get destination name
function getDestinationName(code) {
  const destinations = {
    'JFK': 'ניו יורק',
    'LHR': 'לונדון',
    'CDG': 'פריז',
    'FCO': 'רומא',
    'IST': 'איסטנבול',
    'DXB': 'דובאי',
    'FRA': 'פרנקפורט',
    'LAX': 'לוס אנג\'לס'
  };
  return destinations[code] || code;
}

// ===== PROFILE MANAGEMENT API =====
app.post('/api/profile/save', (req, res) => {
  try {
    console.log('💾 Saving user profile:', req.body);
    
    // In a real implementation, you'd save to database
    // For now, we'll just return success
    const profileData = {
      ...req.body,
      savedAt: new Date().toISOString(),
      id: 'user_' + Date.now()
    };
    
    res.json({
      success: true,
      message: 'הפרופיל נשמר בהצלחה',
      profile: profileData
    });
  } catch (error) {
    console.error('❌ Profile save error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשמירת הפרופיל'
    });
  }
});

app.get('/api/profile', (req, res) => {
  try {
    // Return empty profile for demo
    res.json({
      success: true,
      profile: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת הפרופיל'
    });
  }
});

// ===== CART MANAGEMENT API =====
app.post('/api/cart/add', (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;
    console.log('🛒 Adding to cart:', { productId, quantity, variant });
    
    res.json({
      success: true,
      message: 'המוצר נוסף לעגלה',
      cart: {
        items: [
          {
            id: productId,
            quantity: quantity,
            variant: variant,
            addedAt: new Date().toISOString()
          }
        ],
        totalItems: quantity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'שגיאה בהוספה לעגלה'
    });
  }
});

app.get('/api/cart', (req, res) => {
  try {
    res.json({
      success: true,
      cart: {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת העגלה'
    });
  }
});

app.delete('/api/cart/remove/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    console.log('🗑️ Removing from cart:', productId);
    
    res.json({
      success: true,
      message: 'המוצר הוסר מהעגלה'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'שגיאה בהסרה מהעגלה'
    });
  }
});

// ===== PRODUCT COMPARISON API =====
app.post('/api/compare-products', async (req, res) => {
  try {
    const { products, useAI = false } = req.body;
    console.log('⚖️ Comparing products:', { products, useAI });
    
    // Mock comparison for now
    const comparison = {
      manual: {
        products: products || [],
        comparisonTable: {}
      },
      ai: useAI ? {
        summary: 'השוואה חכמה - המוצר הראשון מומלץ יותר',
        pros: { },
        cons: { },
        recommendation: 'בחר את המוצר הראשון'
      } : null
    };
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'שגיאה בהשוואה'
    });
  }
});

// Health check endpoint (required by Render)
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Extended health check with details
app.get('/health/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mcp-shopify-server',
    version: '1.0.0',
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown for Render rolling updates
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP Shopify Server running on port ${PORT}`);
  console.log(`📊 Dashboard: /dashboard`);
  console.log(`💬 Chat: /chat`);
  console.log(`🛍️ Shop: /shop`);
  console.log(`🏥 Health: /health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});