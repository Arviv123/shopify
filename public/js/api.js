// API Communication Layer

class API {
    static async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(endpoint, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async get(endpoint) {
        return this.request(endpoint);
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Store API
class StoreAPI {
    static async getStores() {
        return API.get('/api/stores');
    }

    static async connectStore(storeData) {
        return API.post('/api/stores/connect', storeData);
    }

    static async disconnectStore(storeId) {
        return API.delete(`/api/stores/${storeId}`);
    }

    static async testConnection(connectionData) {
        return API.post('/api/test-connection', connectionData);
    }
}

// Chat API
class ChatAPI {
    static async search(query, storeId = '') {
        return API.post('/api/chat/search', { query, storeId });
    }

    static async compare(searchTerm) {
        return API.post('/api/chat/compare', { searchTerm });
    }
}

// Order API
class OrderAPI {
    static async createOrder(orderData) {
        return API.post('/api/orders/create', orderData);
    }

    static async getOrderStatus(trackingId) {
        return API.get(`/api/orders/${trackingId}/status`);
    }

    static async payOrder(trackingId, paymentData) {
        return API.post(`/api/orders/${trackingId}/pay`, paymentData);
    }
}

// AI API
class AIAPI {
    static async getConfig() {
        return API.get('/api/ai/config');
    }

    static async saveConfig(config) {
        return API.post('/api/ai/config', config);
    }

    static async testConnection(testData) {
        return API.post('/api/ai/test', testData);
    }

    static async getStatus() {
        return API.get('/api/ai/status');
    }
}

// Admin API
class AdminAPI {
    static async resetServer() {
        return API.post('/api/admin/reset');
    }

    static async getResetStatus() {
        return API.get('/api/admin/reset');
    }
}

// Export APIs
window.StoreAPI = StoreAPI;
window.ChatAPI = ChatAPI;
window.OrderAPI = OrderAPI;
window.AIAPI = AIAPI;
window.AdminAPI = AdminAPI;