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
export declare class ShopifyClient {
    private client;
    private storeUrl;
    constructor(storeUrl: string, accessToken: string);
    searchProducts(query: string, limit?: number): Promise<Product[]>;
    getProduct(productId: string): Promise<Product>;
    createOrder(lineItems: LineItem[], customer: Customer, shippingAddress: ShippingAddress): Promise<Order>;
    listOrders(limit?: number, status?: string): Promise<Order[]>;
    executeGraphQL(query: string, variables?: any): Promise<any>;
    advancedProductSearch(query: string, limit?: number): Promise<any>;
    compareProducts(searchTerm: string): Promise<any>;
    private groupSimilarProducts;
    findBestDeals(limit?: number): Promise<Product[]>;
    searchByVendor(vendor: string, limit?: number): Promise<Product[]>;
    getProductsInPriceRange(minPrice: number, maxPrice: number, limit?: number): Promise<Product[]>;
}
//# sourceMappingURL=shopify-client.d.ts.map