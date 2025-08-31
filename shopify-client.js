const axios = require('axios');

class ShopifyClient {
  constructor(storeUrl, accessToken) {
    this.storeUrl = storeUrl.replace(/\/$/, ''); // Remove trailing slash
    
    this.client = axios.create({
      baseURL: `${this.storeUrl}/admin/api/2024-10`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  async searchProducts(query, limit = 10) {
    try {
      // If query is empty, return all products
      if (!query || query.trim() === '') {
        const response = await this.client.get('/products.json', {
          params: {
            limit,
            fields: 'id,title,body_html,handle,product_type,vendor,tags,variants,images,options,status,created_at,updated_at'
          }
        });
        return response.data.products;
      }
      
      // For non-empty queries, get all products and filter client-side
      const response = await this.client.get('/products.json', {
        params: {
          limit: 250, // Get more products to search through
          fields: 'id,title,body_html,handle,product_type,vendor,tags,variants,images,options,status,created_at,updated_at'
        }
      });
      
      const products = response.data.products;
      const searchTerm = query.toLowerCase().trim();
      
      // Filter products based on title, product_type, vendor, tags, or body_html
      const filteredProducts = products.filter((product) => {
        return (
          product.title.toLowerCase().includes(searchTerm) ||
          product.product_type.toLowerCase().includes(searchTerm) ||
          product.vendor.toLowerCase().includes(searchTerm) ||
          product.tags.toLowerCase().includes(searchTerm) ||
          product.body_html.toLowerCase().includes(searchTerm)
        );
      });
      
      // Return only the requested limit
      return filteredProducts.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to search products: ${error}`);
    }
  }

  async getProduct(productId) {
    try {
      const response = await this.client.get(`/products/${productId}.json`);
      return response.data.product;
    } catch (error) {
      throw new Error(`Failed to get product: ${error}`);
    }
  }

  async listProducts(limit = 250) {
    try {
      const response = await this.client.get('/products.json', {
        params: {
          limit,
          fields: 'id,title,body_html,handle,product_type,vendor,tags,variants,images,options,status,created_at,updated_at'
        }
      });
      return response.data.products;
    } catch (error) {
      throw new Error(`Failed to list products: ${error}`);
    }
  }
}

module.exports = { ShopifyClient };