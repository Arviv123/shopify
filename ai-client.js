#!/usr/bin/env node

// AI-Powered MCP Client for Enhanced Product Management
import axios from 'axios';
import { ShopifyClient } from './build/shopify-client.js';

class AIEnhancedMCPClient {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    this.shopifyClient = null;
    
    if (process.env.SHOPIFY_STORE_URL && process.env.SHOPIFY_ACCESS_TOKEN) {
      this.shopifyClient = new ShopifyClient(
        process.env.SHOPIFY_STORE_URL,
        process.env.SHOPIFY_ACCESS_TOKEN
      );
    }
  }

  // AI-powered product description enhancement
  async enhanceProductDescription(product) {
    if (!this.openaiApiKey && !this.anthropicApiKey) {
      console.log('⚠️ No AI API keys configured. Using basic descriptions.');
      return product;
    }

    try {
      const prompt = `
        תשפר את התיאור של המוצר הבא למכירה באתר אלקטרוניקה ישראלי.
        
        מוצר: ${product.title}
        סוג: ${product.product_type}
        ספק: ${product.vendor}
        מחיר: ₪${product.variants[0]?.price}
        תיאור נוכחי: ${product.body_html}
        
        צור תיאור מרתק ומקצועי בעברית שכולל:
        - יתרונות המוצר
        - מפרטים טכניים
        - למי מתאים
        - קריאה לפעולה
        
        התיאור צריך להיות קצר ומושך (עד 200 מילים).
      `;

      let enhancedDescription;
      
      if (this.anthropicApiKey) {
        // Use Claude API
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          }
        });
        
        enhancedDescription = response.data.content[0].text;
        
      } else if (this.openaiApiKey) {
        // Use OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          }
        });
        
        enhancedDescription = response.data.choices[0].message.content;
      }

      return {
        ...product,
        ai_enhanced_description: enhancedDescription,
        body_html: `<div class="ai-enhanced">${enhancedDescription}</div><hr><div class="original">${product.body_html}</div>`
      };
      
    } catch (error) {
      console.error('AI Enhancement failed:', error.message);
      return product;
    }
  }

  // AI-powered price optimization suggestions
  async suggestOptimalPrice(product, competitors = []) {
    if (!this.anthropicApiKey) {
      return { suggested_price: product.variants[0]?.price, confidence: 0.5 };
    }

    try {
      const competitorPrices = competitors.map(c => `${c.title}: ₪${c.price}`).join(', ');
      
      const prompt = `
        אתה יועץ תמחור למוצרים אלקטרוניים בישראל.
        
        מוצר: ${product.title}
        מחיר נוכחי: ₪${product.variants[0]?.price}
        סוג מוצר: ${product.product_type}
        ספק: ${product.vendor}
        
        מחירי מתחרים: ${competitorPrices || 'לא זמין'}
        
        המלץ על מחיר אופטימלי בשקלים והסבר למה.
        השב בפורמט JSON:
        {
          "suggested_price": מחיר_בשקלים,
          "confidence": רמת_ביטחון_0_עד_1,
          "reasoning": "הסבר_קצר"
        }
      `;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      const aiResponse = response.data.content[0].text;
      
      try {
        return JSON.parse(aiResponse.match(/\{[\s\S]*\}/)[0]);
      } catch {
        return { 
          suggested_price: product.variants[0]?.price, 
          confidence: 0.7,
          reasoning: "בחירה בטוחה על בסיס מחיר נוכחי"
        };
      }
      
    } catch (error) {
      console.error('Price optimization failed:', error.message);
      return { suggested_price: product.variants[0]?.price, confidence: 0.5 };
    }
  }

  // AI-powered customer support chat
  async handleCustomerQuery(query, products, orderHistory = []) {
    if (!this.anthropicApiKey) {
      return "מצטער, שירות הצ'אט החכם זמנית לא זמין. אנא פנה לשירות לקוחות.";
    }

    try {
      const productsInfo = products.slice(0, 5).map(p => 
        `${p.title} - ₪${p.variants[0]?.price} (${p.product_type})`
      ).join('\n');

      const prompt = `
        אתה עוזר מכירות מקצועי בחנות אלקטרוניקה ישראלית.
        
        שאלת לקוח: "${query}"
        
        מוצרים זמינים:
        ${productsInfo}
        
        ההיסטוריה של הלקוח: ${orderHistory.length ? 'לקוח חוזר' : 'לקוח חדש'}
        
        ענה בעברית בצורה ידידותית ומקצועית. כלול:
        - מענה לשאלה
        - המלצות מוצרים רלוונטיים
        - הטבות או מידע שימושי
        - קריאה לפעולה
        
        תשובה קצרה ומועילה (עד 150 מילים).
      `;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      return response.data.content[0].text;
      
    } catch (error) {
      console.error('Customer support AI failed:', error.message);
      return "מצטער, יש לי בעיה טכנית כרגע. אנא נסה שוב או פנה לשירות לקוחות שלנו.";
    }
  }

  // Smart inventory alerts
  async analyzeInventoryTrends(products) {
    const lowStockProducts = products.filter(p => 
      (p.variants[0]?.inventory_quantity || 0) < 5
    );
    
    const highDemandProducts = products.filter(p => 
      p.product_type === 'Electronics' && parseFloat(p.variants[0]?.price || '0') > 1000
    );

    return {
      alerts: {
        low_stock: lowStockProducts.length,
        high_value_items: highDemandProducts.length,
        total_value: products.reduce((sum, p) => 
          sum + (parseFloat(p.variants[0]?.price || '0') * (p.variants[0]?.inventory_quantity || 0)), 0
        )
      },
      recommendations: [
        lowStockProducts.length > 0 ? `🚨 ${lowStockProducts.length} מוצרים עם מלאי נמוך` : null,
        `💰 ערך מלאי כולל: ₪${Math.round(products.reduce((sum, p) => 
          sum + (parseFloat(p.variants[0]?.price || '0') * (p.variants[0]?.inventory_quantity || 0)), 0
        )).toLocaleString()}`,
        highDemandProducts.length > 0 ? `⭐ ${highDemandProducts.length} מוצרים בעלי ערך גבוה` : null
      ].filter(Boolean)
    };
  }

  // Complete AI analysis for a product
  async analyzeProduct(productId) {
    if (!this.shopifyClient) {
      throw new Error('Shopify client not configured');
    }

    try {
      console.log('🤖 Analyzing product with AI...');
      
      // Get product details
      const product = await this.shopifyClient.getProduct(productId);
      
      // Get similar products for price comparison
      const similarProducts = await this.shopifyClient.searchProducts(product.product_type, 10);
      
      // AI enhancements
      const enhancedProduct = await this.enhanceProductDescription(product);
      const priceAnalysis = await this.suggestOptimalPrice(product, similarProducts);
      
      return {
        original: product,
        enhanced_description: enhancedProduct.ai_enhanced_description,
        price_analysis: priceAnalysis,
        similar_products: similarProducts.length,
        analysis_timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Product analysis failed: ${error.message}`);
    }
  }
}

// Command line interface
async function main() {
  const aiClient = new AIEnhancedMCPClient();
  
  console.log('🤖 AI-Enhanced MCP Client Starting...\n');
  
  if (!aiClient.shopifyClient) {
    console.log('⚠️ Configure SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN for full functionality');
    console.log('⚠️ Configure ANTHROPIC_API_KEY or OPENAI_API_KEY for AI features');
    return;
  }
  
  try {
    // Demo: Get all products and analyze trends
    console.log('📊 Getting product inventory...');
    const products = await aiClient.shopifyClient.searchProducts('', 50);
    console.log(`Found ${products.length} products`);
    
    // Inventory analysis
    const inventory = await aiClient.analyzeInventoryTrends(products);
    console.log('\n📈 Inventory Analysis:');
    inventory.recommendations.forEach(rec => console.log(`   ${rec}`));
    
    // Test customer support AI
    if (aiClient.anthropicApiKey) {
      console.log('\n💬 Testing AI Customer Support...');
      const response = await aiClient.handleCustomerQuery(
        'אני מחפש לפטופ לגיימינג במחיר סביר',
        products
      );
      console.log(`🤖 AI Response: ${response.substring(0, 150)}...`);
    }
    
    // Analyze first product
    if (products.length > 0) {
      console.log('\n🔍 Analyzing first product with AI...');
      const analysis = await aiClient.analyzeProduct(products[0].id);
      console.log(`✅ Analysis complete for: ${analysis.original.title}`);
      
      if (analysis.price_analysis) {
        console.log(`💰 Suggested price: ₪${analysis.price_analysis.suggested_price} (confidence: ${Math.round(analysis.price_analysis.confidence * 100)}%)`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  console.log('\n🎉 AI-Enhanced MCP Client Demo Complete!');
}

// Export for use as module
export { AIEnhancedMCPClient };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}