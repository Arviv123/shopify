import axios from 'axios';
export class ShopifyClient {
    client;
    storeUrl;
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
            const filteredProducts = products.filter((product) => {
                return (product.title.toLowerCase().includes(searchTerm) ||
                    product.product_type.toLowerCase().includes(searchTerm) ||
                    product.vendor.toLowerCase().includes(searchTerm) ||
                    product.tags.toLowerCase().includes(searchTerm) ||
                    product.body_html.toLowerCase().includes(searchTerm));
            });
            // Return only the requested limit
            return filteredProducts.slice(0, limit);
        }
        catch (error) {
            throw new Error(`Failed to search products: ${error}`);
        }
    }
    async getProduct(productId) {
        try {
            const response = await this.client.get(`/products/${productId}.json`);
            return response.data.product;
        }
        catch (error) {
            throw new Error(`Failed to get product: ${error}`);
        }
    }
    async createOrder(lineItems, customer, shippingAddress) {
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
        }
        catch (error) {
            throw new Error(`Failed to create order: ${error}`);
        }
    }
    async listOrders(limit = 10, status) {
        try {
            const params = { limit };
            if (status && status !== 'any') {
                params.status = status;
            }
            const response = await this.client.get('/orders.json', { params });
            return response.data.orders;
        }
        catch (error) {
            throw new Error(`Failed to list orders: ${error}`);
        }
    }
    // GraphQL method for more advanced queries
    async executeGraphQL(query, variables) {
        try {
            const response = await this.client.post('/graphql.json', {
                query,
                variables
            });
            if (response.data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
            }
            return response.data.data;
        }
        catch (error) {
            throw new Error(`Failed to execute GraphQL query: ${error}`);
        }
    }
    // Advanced product search using GraphQL
    async advancedProductSearch(query, limit = 10) {
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
    async compareProducts(searchTerm) {
        try {
            const products = await this.searchProducts(searchTerm, 50);
            // Group by similar products (by keywords in title)
            const comparisons = this.groupSimilarProducts(products);
            return comparisons;
        }
        catch (error) {
            throw new Error(`Failed to compare products: ${error}`);
        }
    }
    groupSimilarProducts(products) {
        const groups = {};
        const priceAnalysis = {};
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
    async findBestDeals(limit = 10) {
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
        }
        catch (error) {
            throw new Error(`Failed to find best deals: ${error}`);
        }
    }
    // Search across vendors with price comparison
    async searchByVendor(vendor, limit = 20) {
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
        }
        catch (error) {
            throw new Error(`Failed to search by vendor: ${error}`);
        }
    }
    // Get products in price range
    async getProductsInPriceRange(minPrice, maxPrice, limit = 20) {
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
        }
        catch (error) {
            throw new Error(`Failed to get products in price range: ${error}`);
        }
    }
}
//# sourceMappingURL=shopify-client.js.map