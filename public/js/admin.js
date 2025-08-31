// Admin Component

// Initialize admin tab
function initAdminTab() {
    loadAdminComponent();
}

// Load admin component
function loadAdminComponent() {
    const container = document.getElementById('admin-container');
    if (!container) return;

    container.innerHTML = `
        <div class="admin-panel">
            <h2>🧼 ניהול מערכת</h2>
            <p>כלים לניהול ואיפוס המערכת</p>
            
            <div class="admin-section">
                <div class="card">
                    <h3>🔄 איפוס מערכת</h3>
                    <p>מחיקת כל הנתונים והגדרות המערכת</p>
                    <div class="admin-actions">
                        <button class="btn btn-danger" onclick="confirmReset()">
                            🗑️ איפוס מלא
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <h3>📊 מידע מערכת</h3>
                    <div id="systemInfo">
                        <div class="loading">
                            <div class="spinner"></div>
                            טוען מידע...
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🔧 כלי עזר</h3>
                    <div class="admin-actions">
                        <button class="btn btn-secondary" onclick="exportData()">
                            💾 יצוא נתונים
                        </button>
                        <button class="btn btn-secondary" onclick="clearCache()">
                            🧹 נקה Cache
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="adminResult"></div>
        </div>
    `;
    
    // Load system info
    loadSystemInfo();
}

// Load system information
async function loadSystemInfo() {
    const infoDiv = document.getElementById('systemInfo');
    if (!infoDiv) return;
    
    try {
        // Get system status
        const storesCount = stores ? stores.length : 0;
        const aiStatus = currentAIConfig && currentAIConfig.provider !== 'none' ? 'פעיל' : 'לא פעיל';
        const conversationCount = conversationHistory ? conversationHistory.length : 0;
        
        infoDiv.innerHTML = `
            <div class="system-stats">
                <div class="stat-item">
                    <strong>🏪 חנויות מחוברות:</strong> ${storesCount}
                </div>
                <div class="stat-item">
                    <strong>🤖 סטטוס AI:</strong> ${aiStatus}
                </div>
                <div class="stat-item">
                    <strong>💬 הודעות צ'אט:</strong> ${conversationCount}
                </div>
                <div class="stat-item">
                    <strong>⏰ זמן הפעלה:</strong> ${getUptime()}
                </div>
                <div class="stat-item">
                    <strong>🌐 דפדפן:</strong> ${getBrowserInfo()}
                </div>
            </div>
        `;
        
    } catch (error) {
        infoDiv.innerHTML = `
            <div class="alert alert-error">
                שגיאה בטעינת מידע המערכת: ${error.message}
            </div>
        `;
    }
}

// Get uptime since page load
function getUptime() {
    const uptime = Date.now() - (window.startTime || Date.now());
    const minutes = Math.floor(uptime / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours} שעות, ${minutes % 60} דקות`;
    } else {
        return `${minutes} דקות`;
    }
}

// Get browser information
function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'לא ידוע';
}

// Confirm reset
function confirmReset() {
    const confirmation = confirm(`⚠️ אזהרה!

איפוס המערכת ימחק:
• כל החנויות המחוברות
• הגדרות AI
• היסטוריית צ'אט
• הגדרות אחרות

האם אתה בטוח שברצונך להמשיך?`);

    if (confirmation) {
        const doubleConfirm = confirm('🔴 אישור אחרון - פעולה זו בלתי הפיכה!\n\nהאם אתה בטוח לחלוטין?');
        
        if (doubleConfirm) {
            performReset();
        }
    }
}

// Perform system reset
async function performReset() {
    const resultDiv = document.getElementById('adminResult');
    
    try {
        resultDiv.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                מבצע איפוס מערכת...
            </div>
        `;
        
        const result = await AdminAPI.resetServer();
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h3>✅ איפוס הושלם בהצלחה</h3>
                    <p>המערכת אופסה לחלוטין</p>
                    <button class="btn" onclick="location.reload()">🔄 רענן דף</button>
                </div>
            `;
            
            // Clear local data
            stores = [];
            conversationHistory = [];
            currentOrder = null;
            currentAIConfig = {};
            
            // Clear local storage
            localStorage.clear();
            
            showToast('המערכת אופסה בהצלחה', 'success');
            
            // Auto-refresh after 3 seconds
            setTimeout(() => {
                location.reload();
            }, 3000);
            
        } else {
            throw new Error(result.error || 'איפוס נכשל');
        }
        
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-error">
                <h3>❌ איפוס נכשל</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
        
        showToast('שגיאה באיפוס המערכת', 'error');
    }
}

// Export data
function exportData() {
    try {
        const data = {
            stores: stores,
            aiConfig: currentAIConfig,
            conversationHistory: conversationHistory.slice(-50), // Last 50 messages
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopify-system-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        showToast('נתונים יוצאו בהצלחה', 'success');
        
    } catch (error) {
        showToast('שגיאה ביצוא נתונים: ' + error.message, 'error');
    }
}

// Clear cache
function clearCache() {
    try {
        // Clear local storage
        const importantKeys = ['ai-config', 'stores-cache'];
        importantKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Clear session storage
        sessionStorage.clear();
        
        showToast('Cache נוקה בהצלחה', 'success');
        
        // Optionally reload system info
        setTimeout(() => {
            loadSystemInfo();
        }, 1000);
        
    } catch (error) {
        showToast('שגיאה בניקוי Cache: ' + error.message, 'error');
    }
}

// Set start time for uptime calculation
if (!window.startTime) {
    window.startTime = Date.now();
}

// Make functions available globally
window.initAdminTab = initAdminTab;
window.confirmReset = confirmReset;
window.exportData = exportData;
window.clearCache = clearCache;