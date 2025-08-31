// Connect Store Component

// Initialize connect tab
function initConnectTab() {
    loadConnectComponent();
}

// Load connect component
function loadConnectComponent() {
    const container = document.getElementById('connect-container');
    if (!container) return;

    container.innerHTML = `
        <div class="connect-form">
            <h2>🔗 חיבור חנות חדשה</h2>
            <p>חבר את החנות שלך כדי להתחיל לנהל מוצרים ולקבל הזמנות</p>
            
            <form id="connectForm" onsubmit="connectStore(event)">
                <div class="form-group">
                    <label for="storeName">שם החנות (אופציונלי)</label>
                    <input type="text" id="storeName" name="storeName" 
                           placeholder="השם שיוצג במערכת">
                </div>
                
                <div class="form-group">
                    <label for="storeUrl">כתובת החנות *</label>
                    <input type="url" id="storeUrl" name="storeUrl" required
                           placeholder="https://your-store.myshopify.com">
                    <small>הכתובת המלאה של החנות ב-Shopify</small>
                </div>
                
                <div class="form-group">
                    <label for="accessToken">Access Token *</label>
                    <input type="password" id="accessToken" name="accessToken" required
                           placeholder="shpat_...">
                    <small>מפתח הגישה של החנות מ-Shopify Admin</small>
                </div>
                
                <div class="form-group">
                    <label for="ownerEmail">אימייל בעל החנות (אופציונלי)</label>
                    <input type="email" id="ownerEmail" name="ownerEmail"
                           placeholder="owner@example.com">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn" id="connectBtn">
                        🔗 חבר חנות
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="testConnection()">
                        🧪 בדוק חיבור
                    </button>
                </div>
            </form>
            
            <div id="connectionResult"></div>
            
            <div class="help-section">
                <h3>💡 איך לקבל Access Token?</h3>
                <ol>
                    <li>היכנס לחנות שלך ב-Shopify Admin</li>
                    <li>עבור ל: Apps → Develop apps for your store</li>
                    <li>לחץ "Create an app"</li>
                    <li>הגדר הרשאות Admin API access</li>
                    <li>העתק את ה-Access Token</li>
                </ol>
            </div>
        </div>
    `;
}

// Connect store
async function connectStore(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('storeName') || '',
        storeUrl: formData.get('storeUrl'),
        accessToken: formData.get('accessToken'),
        ownerEmail: formData.get('ownerEmail') || ''
    };

    const connectBtn = document.getElementById('connectBtn');
    const resultDiv = document.getElementById('connectionResult');
    
    // Show loading
    connectBtn.disabled = true;
    connectBtn.textContent = '🔄 מחבר...';
    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div>מחבר לחנות...</div>';

    try {
        const result = await StoreAPI.connectStore(data);
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h3>✅ החנות חוברה בהצלחה!</h3>
                    <p><strong>מזהה חנות:</strong> ${result.storeId}</p>
                    <p>החנות זמינה כעת במערכת</p>
                </div>
            `;
            
            // Update stores list
            await loadStores();
            
            // Clear form
            event.target.reset();
            
            // Show success toast
            showToast('החנות חוברה בהצלחה! 🎉', 'success');
            
            // Optionally switch to stores tab
            setTimeout(() => {
                showTab('stores');
            }, 2000);
            
        } else {
            throw new Error(result.error || 'שגיאה לא ידועה');
        }
        
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-error">
                <h3>❌ החיבור נכשל</h3>
                <p>${escapeHtml(error.message)}</p>
                <small>בדוק את הפרטים ונסה שוב</small>
            </div>
        `;
        
        showToast('שגיאה בחיבור החנות', 'error');
        
    } finally {
        connectBtn.disabled = false;
        connectBtn.textContent = '🔗 חבר חנות';
    }
}

// Test connection without saving
async function testConnection() {
    const storeUrl = document.getElementById('storeUrl').value;
    const accessToken = document.getElementById('accessToken').value;
    
    if (!storeUrl || !accessToken) {
        showToast('אנא מלא את כתובת החנות ו-Access Token', 'warning');
        return;
    }
    
    const resultDiv = document.getElementById('connectionResult');
    
    // Show loading
    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div>בודק חיבור...</div>';
    
    try {
        const result = await StoreAPI.testConnection({
            storeUrl,
            accessToken
        });
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h3>✅ החיבור תקין!</h3>
                    <p>החנות זמינה ויכולה להתחבר למערכת</p>
                    ${result.storeInfo ? `<p><strong>שם החנות:</strong> ${escapeHtml(result.storeInfo.name || 'לא זמין')}</p>` : ''}
                </div>
            `;
            
            showToast('החיבור תקין! ✅', 'success');
            
        } else {
            throw new Error(result.error || 'החיבור נכשל');
        }
        
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-error">
                <h3>❌ בדיקת החיבור נכשלה</h3>
                <p>${escapeHtml(error.message)}</p>
                <small>בדוק את הפרטים ונסה שוב</small>
            </div>
        `;
        
        showToast('בדיקת החיבור נכשלה', 'error');
    }
}

// Make functions available globally
window.initConnectTab = initConnectTab;
window.connectStore = connectStore;
window.testConnection = testConnection;