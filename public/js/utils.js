// Utility Functions

// Format date to Hebrew locale
function formatDate(dateString) {
    if (!dateString) return 'תאריך לא ידוע';
    try {
        return new Date(dateString).toLocaleString('he-IL');
    } catch {
        return 'תאריך לא תקין';
    }
}

// Format price with currency
function formatPrice(price, currency = 'ILS') {
    if (!price) return '₪0';
    return `₪${parseFloat(price).toFixed(2)}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Generate UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Debounce function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show toast notification
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            toast.style.backgroundColor = '#28a745';
            break;
        case 'error':
            toast.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            toast.style.backgroundColor = '#ffc107';
            toast.style.color = '#212529';
            break;
        default:
            toast.style.backgroundColor = '#007bff';
    }
    
    document.body.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Add CSS animations for toast
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Local storage helpers
const Storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
};

// Form validation helpers
const Validator = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    phone: (phone) => /^[\d\s\-\+\(\)]+$/.test(phone.replace(/\s/g, '')),
    url: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    required: (value) => value && value.toString().trim() !== ''
};

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('הועתק ללוח', 'success');
        return true;
    } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('הועתק ללוח', 'success');
            return true;
        } catch {
            showToast('שגיאה בהעתקה', 'error');
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// Export utilities
window.formatDate = formatDate;
window.formatPrice = formatPrice;
window.escapeHtml = escapeHtml;
window.generateUUID = generateUUID;
window.debounce = debounce;
window.showToast = showToast;
window.Storage = Storage;
window.Validator = Validator;
window.copyToClipboard = copyToClipboard;