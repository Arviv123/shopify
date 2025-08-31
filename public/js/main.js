// Main Application Logic
let currentTab = 'stores';
let stores = [];
let currentAIConfig = {};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application starting...');
    
    // Load initial data
    loadStores();
    loadComponents();
    
    // Set default tab
    showTab('stores');
});

// Tab management
function showTab(tabName) {
    console.log('showTab called with:', tabName);
    currentTab = tabName;
    
    // Remove active class from all tabs and hide all content
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));

    // Find the clicked tab and make it active
    const clickedTab = Array.from(document.querySelectorAll('.tab')).find(tab => 
        tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(tabName)
    );
    
    if (clickedTab) {
        clickedTab.classList.add('active');
    }

    // Show the selected tab content
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }

    // Tab-specific initialization
    switch (tabName) {
        case 'stores':
            initStoresTab();
            break;
        case 'chat':
            // Ensure stores are loaded before initializing chat
            loadStores().then(() => {
                initChatTab();
            }).catch(error => {
                console.error('Error loading stores for chat:', error);
                initChatTab(); // Initialize anyway
            });
            break;
        case 'connect':
            initConnectTab();
            break;
        case 'ai-config':
            initAIConfigTab();
            break;
        case 'admin':
            initAdminTab();
            break;
    }
}

// Load all components
async function loadComponents() {
    try {
        console.log('Loading components...');
        
        // Load stores component
        if (window.loadStoresComponent) {
            await window.loadStoresComponent();
        }
        
        // Load chat component
        if (window.loadChatComponent) {
            await window.loadChatComponent();
        }
        
        // Load other components...
        
        console.log('Components loaded successfully');
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Show loading state
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                טוען...
            </div>
        `;
    }
}

// Show error state
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-error">
                <h3>❌ שגיאה</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Show empty state
function showEmptyState(containerId, title, description, actionText = null, actionCallback = null) {
    const container = document.getElementById(containerId);
    if (container) {
        let actionHtml = '';
        if (actionText && actionCallback) {
            actionHtml = `<button class="btn" onclick="${actionCallback}">${actionText}</button>`;
        }
        
        container.innerHTML = `
            <div class="empty-state">
                <h3>${title}</h3>
                <p>${description}</p>
                ${actionHtml}
            </div>
        `;
    }
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('he-IL');
}

function formatPrice(price, currency = 'ILS') {
    return `₪${price}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}