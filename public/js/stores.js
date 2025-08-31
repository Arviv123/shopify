// Stores Component

// Load stores data
async function loadStores() {
    try {
        const response = await StoreAPI.getStores();
        stores = response.stores || [];
        console.log('Stores loaded:', stores);
    } catch (error) {
        console.error('Error loading stores:', error);
        stores = [];
    }
}

// Initialize stores tab
function initStoresTab() {
    loadStoresComponent();
}

// Load stores component HTML
async function loadStoresComponent() {
    const container = document.getElementById('stores-container');
    if (!container) return;

    showLoading('stores-container');

    try {
        await loadStores();
        renderStoresComponent();
    } catch (error) {
        showError('stores-container', 'שגיאה בטעינת החנויות');
    }
}

// Render stores component
function renderStoresComponent() {
    const container = document.getElementById('stores-container');
    if (!container) return;

    if (stores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🏪 אין חנויות מחוברות</h3>
                <p>התחל על ידי חיבור החנות הראשונה שלך</p>
                <button class="btn" onclick="showTab('connect')">🔗 חבר חנות חדשה</button>
            </div>
        `;
        return;
    }

    let html = `
        <div class="stores-header">
            <h2>החנויות המחוברות שלך</h2>
            <p>נהל את כל החנויות שלך ממקום אחד</p>
        </div>
        <div class="stores-grid">
    `;

    stores.forEach(store => {
        html += createStoreCard(store);
    });

    html += `
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <button class="btn" onclick="showTab('connect')">
                🔗 חבר חנות נוספת
            </button>
        </div>
    `;

    container.innerHTML = html;
}

// Create store card HTML
function createStoreCard(store) {
    const storeUrl = store.url || store.storeUrl || '#';
    const storeName = store.name || extractStoreName(storeUrl);
    const createdAt = store.createdAt ? formatDate(store.createdAt) : 'תאריך לא ידוע';
    const status = store.connected !== false ? 'connected' : 'disconnected';
    const statusText = status === 'connected' ? 'מחובר' : 'מנותק';
    const statusClass = status === 'connected' ? 'status-connected' : 'status-disconnected';

    return `
        <div class="store-card">
            <div class="store-header">
                <div class="store-name">🏪 ${escapeHtml(storeName)}</div>
                <div class="store-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="store-details">
                <p><strong>🌐 כתובת:</strong> ${escapeHtml(storeUrl)}</p>
                <p><strong>📅 נוצר:</strong> ${createdAt}</p>
                ${store.owner ? `<p><strong>👤 בעלים:</strong> ${escapeHtml(store.owner)}</p>` : ''}
            </div>
            
            <div class="store-actions">
                <button class="btn btn-secondary" onclick="viewStoreDetails('${store.id}')">
                    📊 פרטים
                </button>
                <button class="btn" onclick="testStoreConnection('${store.id}')">
                    🔄 בדוק חיבור
                </button>
                <button class="btn btn-danger" onclick="disconnectStore('${store.id}')">
                    ❌ נתק
                </button>
            </div>
        </div>
    `;
}

// Extract store name from URL
function extractStoreName(url) {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('.myshopify.com', '').replace('www.', '');
    } catch {
        return 'חנות לא מזוהה';
    }
}

// View store details
function viewStoreDetails(storeId) {
    const store = stores.find(s => s.id === storeId);
    if (!store) {
        alert('חנות לא נמצאה');
        return;
    }

    const details = `
פרטי חנות:
━━━━━━━━━━━━━━
🏪 שם: ${store.name || extractStoreName(store.url)}
🌐 כתובת: ${store.url}
📅 נוצר: ${store.createdAt ? formatDate(store.createdAt) : 'תאריך לא ידוע'}
🆔 מזהה: ${store.id}
${store.owner ? `👤 בעלים: ${store.owner}` : ''}
━━━━━━━━━━━━━━
    `.trim();

    alert(details);
}

// Test store connection
async function testStoreConnection(storeId) {
    const store = stores.find(s => s.id === storeId);
    if (!store) {
        alert('חנות לא נמצאה');
        return;
    }

    try {
        // Show loading state for this store
        const storeCard = document.querySelector(`[onclick*="'${storeId}'"]`).closest('.store-card');
        const originalActions = storeCard.querySelector('.store-actions').innerHTML;
        
        storeCard.querySelector('.store-actions').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                בודק חיבור...
            </div>
        `;

        const result = await StoreAPI.testConnection({
            storeUrl: store.url,
            accessToken: store.accessToken // This might not be available in the frontend
        });

        if (result.success) {
            alert('✅ החיבור לחנות תקין!');
        } else {
            alert('❌ החיבור לחנות נכשל: ' + result.error);
        }
        
        // Restore original actions
        storeCard.querySelector('.store-actions').innerHTML = originalActions;
        
    } catch (error) {
        alert('❌ שגיאה בבדיקת החיבור: ' + error.message);
        
        // Restore original actions on error
        const storeCard = document.querySelector(`[onclick*="'${storeId}'"]`).closest('.store-card');
        storeCard.querySelector('.store-actions').innerHTML = originalActions;
    }
}

// Disconnect store
async function disconnectStore(storeId) {
    const store = stores.find(s => s.id === storeId);
    if (!store) {
        alert('חנות לא נמצאה');
        return;
    }

    const storeName = store.name || extractStoreName(store.url);
    if (!confirm(`האם אתה בטוח שברצונך לנתק את החנות "${storeName}"?`)) {
        return;
    }

    try {
        await StoreAPI.disconnectStore(storeId);
        
        // Remove store from local array
        stores = stores.filter(s => s.id !== storeId);
        
        // Re-render component
        renderStoresComponent();
        
        alert('✅ החנות נותקה בהצלחה');
        
    } catch (error) {
        alert('❌ שגיאה בניתוק החנות: ' + error.message);
    }
}

// Make functions available globally
window.loadStores = loadStores;
window.initStoresTab = initStoresTab;
window.loadStoresComponent = loadStoresComponent;
window.viewStoreDetails = viewStoreDetails;
window.testStoreConnection = testStoreConnection;
window.disconnectStore = disconnectStore;