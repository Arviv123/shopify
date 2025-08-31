import axios, { AxiosInstance } from 'axios';

export interface Product {
  id: string;
  title: string;
  body_html: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string;
  variants: ProductVariant[];
  images: ProductImage[];
  options: ProductOption[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
  inventory_management: string;
  barcode: string;
  compare_at_price: string;
  fulfillment_service: string;
  inventory_policy: string;
  option1: string;
  option2: string;
  option3: string;
  taxable: boolean;
  requires_shipping: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  variant_ids: string[];
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

export interface LineItem {
  variantId: string;
  quantity: number;
}

export interface Customer {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface ShippingAddress {
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip?: string;
}

export interface Order {
  id: string;
  order_number: string;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: any[];
  shipping_address: any;
  billing_address: any;
  customer: any;
}

export class ShopifyClient {
  private client: AxiosInstance;
  private storeUrl: string;

  constructor(storeUrl: string, accessToken: string) {
    this.storeUrl = storeUrl.replace(/\/$/, ''); // Remove trailing slash
    
    this.client = axios.create({
      baseURL: `${this.storeUrl}/admin/api/2024-10`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
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
      // This is more reliable than Shopify's search which can be restrictive
      const response = await this.client.get('/products.json', {
        params: {
          limit: 250, // Get more products to search through
          fields: 'id,title,body_html,handle,product_type,vendor,tags,variants,images,options,status,created_at,updated_at'
        }
      });
      
      const products = response.data.products;
      const searchTerm = query.toLowerCase().trim();
      
      // Filter products based on title, product_type, vendor, tags, or body_html
      const filteredProducts = products.filter((product: Product) => {
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

  async getProduct(productId: string): Promise<Product> {
    try {
      const response = await this.client.get(`/products/${productId}.json`);
      return response.data.product;
    } catch (error) {
      throw new Error(`Failed to get product: ${error}`);
    }
  }

  async createOrder(
    lineItems: LineItem[],
    customer: Customer,
    shippingAddress: ShippingAddress
  ): Promise<Order> {
    try {
      const orderData = {
        order: {
          line_items: lineItems.map(item => ({
            variant_id: item.variantId,
            quantity: item.quantity
          })),
          customer: {
            email: customer.email,
            first_name: customer.firstName,
            last_name: customer.lastName
          },
          shipping_address: {
            first_name: customer.firstName,
            last_name: customer.lastName,
            address1: shippingAddress.address1,
            address2: shippingAddress.address2,
            city: shippingAddress.city,
            province: shippingAddress.province,
            country: shippingAddress.country,
            zip: shippingAddress.zip
          },
          billing_address: {
            first_name: customer.firstName,
            last_name: customer.lastName,
            address1: shippingAddress.address1,
            address2: shippingAddress.address2,
            city: shippingAddress.city,
            province: shippingAddress.province,
            country: shippingAddress.country,
            zip: shippingAddress.zip
          }
        }
      };

      const response = await this.client.post('/orders.json', orderData);
      return response.data.order;
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  async listOrders(limit: number = 10, status?: string): Promise<Order[]> {
    try {
      const params: any = { limit };
      if (status && status !== 'any') {
        params.status = status;
      }

      const response = await this.client.get('/orders.json', { params });
      return response.data.orders;
    } catch (error) {
      throw new Error(`Failed to list orders: ${error}`);
    }
  }

  // GraphQL method for more advanced queries
  async executeGraphQL(query: string, variables?: any): Promise<any> {
    try {
      const response = await this.client.post('/graphql.json', {
        query,
        variables
      });
      
      if (response.data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }
      
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to execute GraphQL query: ${error}`);
    }
  }

  // Advanced product search using GraphQL
  async advancedProductSearch(query: string, limit: number = 10): Promise<any> {
    const graphqlQuery = `
      query searchProducts($query: String!, $first: Int!) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              description
              handle
              productType
              vendor
              tags
              status
              createdAt
              updatedAt
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                    inventoryQuantity
                    weight
                    weightUnit
                    barcode
                    compareAtPrice
                    requiresShipping
                    taxable
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    id
                    src: url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    `;

    return this.executeGraphQL(graphqlQuery, { query, first: limit });
  }

  // Price comparison functionality
  async compareProducts(searchTerm: string): Promise<any> {
    try {
      const products = await this.searchProducts(searchTerm, 50);
      
      // Group by similar products (by keywords in title)
      const comparisons = this.groupSimilarProducts(products);
      
      return comparisons;
    } catch (error) {
      throw new Error(`Failed to compare products: ${error}`);
    }
  }

  private groupSimilarProducts(products: Product[]): any {
    const groups: { [key: string]: Product[] } = {};
    const priceAnalysis: { [key: string]: any } = {};

    // Group products by category/type
    products.forEach(product => {
      const category = product.product_type.toLowerCase();
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });

    // Analyze prices for each category
    Object.keys(groups).forEach(category => {
      const categoryProducts = groups[category];
      const prices = categoryProducts.map(p => parseFloat(p.variants[0]?.price || '0'));
      
      priceAnalysis[category] = {
        count: categoryProducts.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        products: categoryProducts.map(p => ({
          id: p.id,
          title: p.title,
          price: parseFloat(p.variants[0]?.price || '0'),
          vendor: p.vendor,
          sku: p.variants[0]?.sku
        })).sort((a, b) => a.price - b.price)
      };
    });

    return priceAnalysis;
  }

  // Find best deals across all products
  async findBestDeals(limit: number = 10): Promise<Product[]> {
    try {
      const allProducts = await this.searchProducts('', 100);
      
      // Calculate deal scores (lower price = better deal in category)
      const productsWithScores = allProducts.map(product => {
        const price = parseFloat(product.variants[0]?.price || '0');
        return {
          ...product,
          dealScore: price > 0 ? 1 / price : 0 // Simple scoring: cheaper = better
        };
      });

      // Sort by deal score and return top deals
      return productsWithScores
        .sort((a, b) => b.dealScore - a.dealScore)
        .slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to find best deals: ${error}`);
    }
  }

  // Search across vendors with price comparison
  async searchByVendor(vendor: string, limit: number = 20): Promise<Product[]> {
    try {
      const allProducts = await this.searchProducts('', 200);
      
      // Filter by vendor and sort by price
      return allProducts
        .filter(product => product.vendor.toLowerCase().includes(vendor.toLowerCase()))
        .sort((a, b) => {
          const priceA = parseFloat(a.variants[0]?.price || '0');
          const priceB = parseFloat(b.variants[0]?.price || '0');
          return priceA - priceB;
        })
        .slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to search by vendor: ${error}`);
    }
  }

  // Get products in price range
  async getProductsInPriceRange(minPrice: number, maxPrice: number, limit: number = 20): Promise<Product[]> {
    try {
      const allProducts = await this.searchProducts('', 200);
      
      return allProducts
        .filter(product => {
          const price = parseFloat(product.variants[0]?.price || '0');
          return price >= minPrice && price <= maxPrice;
        })
        .sort((a, b) => {
          const priceA = parseFloat(a.variants[0]?.price || '0');
          const priceB = parseFloat(b.variants[0]?.price || '0');
          return priceA - priceB;
        })
        .slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get products in price range: ${error}`);
    }
  }
}