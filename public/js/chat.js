// Chat Component

let conversationHistory = [];
let currentOrder = null;

// Initialize chat tab
async function initChatTab() {
    await loadChatComponent();
    await loadStores(); // Make sure stores are loaded
    populateStoreSelect(); // Populate dropdown
}

// Load chat component
function loadChatComponent() {
    const container = document.getElementById('chat-container');
    if (!container) return;

    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-header">
                <h2>💬 צ'אט מכירות חכם</h2>
                <p>חפש מוצרים, השווה מחירים והזמן ישירות</p>
            </div>
            
            <div class="chat-controls">
                <div class="form-group store-select">
                    <label for="storeSelect">בחר חנות:</label>
                    <select id="storeSelect">
                        <option value="">כל החנויות</option>
                    </select>
                </div>
                
                <div class="search-type">
                    <label>
                        <input type="radio" name="searchType" value="search" checked>
                        חיפוש
                    </label>
                    <label>
                        <input type="radio" name="searchType" value="compare">
                        השוואה
                    </label>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <div class="message bot">
                    שלום! 👋 אני כאן לעזור לך למצוא מוצרים מהחנויות המחוברות שלך.
                    <br><br>
                    💡 טיפים:
                    <br>• חפש מוצרים לפי שם, קטגוריה או מותג
                    <br>• השווה מחירים בין חנויות שונות  
                    <br>• הזמן ישירות דרך הצ'אט
                </div>
            </div>
            
            <div class="chat-input-container">
                <div class="chat-input-group">
                    <input type="text" 
                           id="chatInput" 
                           class="chat-input" 
                           placeholder="הקלד כאן לחיפוש מוצרים..."
                           onkeypress="handleChatKeyPress(event)">
                    <button id="sendBtn" 
                            class="send-btn" 
                            onclick="sendMessage()">
                        שלח
                    </button>
                </div>
            </div>
        </div>
    `;

    // Populate store select after a delay to ensure DOM is ready
    setTimeout(() => {
        populateStoreSelect();
    }, 100);
}

// Populate store select dropdown
function populateStoreSelect() {
    const storeSelect = document.getElementById('storeSelect');
    if (!storeSelect) {
        console.log('Store select element not found');
        return;
    }

    console.log('Populating store select with stores:', stores);

    // Clear existing options except "all stores"
    storeSelect.innerHTML = '<option value="">כל החנויות</option>';

    // Add connected stores
    if (stores && stores.length > 0) {
        stores.forEach(store => {
            const option = document.createElement('option');
            option.value = store.id;
            option.textContent = store.name || extractStoreName(store.url || store.storeUrl);
            storeSelect.appendChild(option);
            console.log('Added store option:', option.textContent, 'with ID:', option.value);
        });
    } else {
        console.log('No stores found to populate');
    }
}

// Extract store name from URL (moved from stores.js)
function extractStoreName(url) {
    if (!url) return 'חנות לא מזוהה';
    try {
        const domain = new URL(url).hostname;
        return domain.replace('.myshopify.com', '').replace('www.', '');
    } catch {
        return 'חנות לא מזוהה';
    }
}

// Handle chat input key press
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Clear input and disable send button
    input.value = '';
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    // Add user message
    addMessage(message, 'user');

    // Get search parameters
    const storeId = document.getElementById('storeSelect').value;
    const searchType = document.querySelector('input[name="searchType"]:checked').value;

    try {
        // Add loading message
        addMessage('🔍 מחפש...', 'bot');

        let response;
        if (searchType === 'search') {
            response = await ChatAPI.search(message, storeId);
        } else {
            response = await ChatAPI.compare(message);
        }

        // Remove loading message
        removeLastBotMessage();

        if (response.success) {
            // Display AI response
            if (response.aiResponse) {
                addMessage(response.aiResponse, 'bot');
            }

            // Display products if found
            if (response.products && response.products.length > 0) {
                displaySearchResults(response, searchType);
            } else if (!response.aiResponse || response.aiResponse === null) {
                addMessage('לא נמצאו מוצרים עבור החיפוש שלך 😕<br>נסה חיפוש אחר או בדוק שהחנויות מחוברות כראוי.', 'bot');
            }
        } else {
            addMessage('❌ שגיאה: ' + response.error, 'bot');
        }

    } catch (error) {
        // Remove loading message
        removeLastBotMessage();
        addMessage('❌ שגיאה בחיפוש: ' + error.message, 'bot');
    } finally {
        sendBtn.disabled = false;
    }
}

// Add message to chat
function addMessage(content, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = content;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add to conversation history
    conversationHistory.push({
        content,
        sender,
        timestamp: new Date()
    });
}

// Remove last bot message (used for removing loading messages)
function removeLastBotMessage() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messages = messagesContainer.querySelectorAll('.message.bot');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.textContent.includes('🔍 מחפש...')) {
        lastMessage.remove();
    }
}

// Display search results
function displaySearchResults(response, searchType) {
    const { products, totalStores } = response;
    
    let html = `✅ נמצאו ${products.length} מוצרים מ-${totalStores} חנויות:<br><br>`;
    
    products.forEach(product => {
        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 15px; margin: 10px 0; background: #f8f9fa;">
                <strong>${escapeHtml(product.title)}</strong><br>
                <span style="color: #667eea; font-size: 18px; font-weight: bold;">₪${product.price}</span><br>
                <small style="color: #666;">📦 ${escapeHtml(product.vendor)} | 🏪 ${escapeHtml(product.storeName)}</small><br>
                <button onclick="orderProduct('${product.id}', '${product.storeId}', '${escapeHtml(product.title)}', '${product.price}')" 
                        class="order-btn" style="margin-top: 10px;">
                    🛒 הזמן עכשיו
                </button>
            </div>
        `;
    });
    
    addMessage(html, 'bot');
}

// Order product (simplified for now)
async function orderProduct(productId, storeId, title, price) {
    addMessage(`🔄 מעבד הזמנה עבור ${title}...`, 'bot');
    
    try {
        // This would open the customer details popup
        showCustomerDetailsPopup(productId, storeId, title, price);
    } catch (error) {
        addMessage(`❌ שגיאה בהזמנה: ${error.message}`, 'bot');
    }
}

// Show customer details popup for order
function showCustomerDetailsPopup(productId, storeId, title, price) {
    const popupHTML = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>פרטי הזמנה - ${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: "Segoe UI", Tahoma, Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px; 
            direction: rtl; 
            min-height: 100vh;
        }
        .container { 
            max-width: 500px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            padding: 40px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.2); 
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .product-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .product-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .product-price {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #374151;
        }
        .form-group input, .form-group textarea {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        .required {
            color: #dc2626;
        }
        .btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 0;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .checkbox-group {
            display: flex;
            align-items: flex-start;
            margin: 20px 0;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin-left: 10px;
            margin-top: 3px;
        }
        .checkbox-group label {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🛒 השלמת פרטי הזמנה</h2>
            <p>אנא מלא את הפרטים הבאים לביצוע ההזמנה</p>
        </div>
        
        <div class="product-info">
            <div class="product-title">${title}</div>
            <div class="product-price">₪${price}</div>
        </div>
        
        <form id="orderForm" onsubmit="submitOrder(event)">
            <div class="form-group">
                <label for="fullName">שם מלא <span class="required">*</span></label>
                <input type="text" id="fullName" name="fullName" required>
            </div>
            
            <div class="form-group">
                <label for="email">כתובת מייל <span class="required">*</span></label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="phone">מספר טלפון <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required placeholder="050-1234567">
            </div>
            
            <div class="form-group">
                <label for="address">כתובת למשלוח <span class="required">*</span></label>
                <textarea id="address" name="address" rows="3" required placeholder="רחוב, מספר בית, עיר, מיקוד"></textarea>
            </div>
            
            <div class="form-group">
                <label for="quantity">כמות</label>
                <input type="number" id="quantity" name="quantity" value="1" min="1" max="10">
            </div>
            
            <div class="form-group">
                <label for="notes">הערות (אופציונלי)</label>
                <textarea id="notes" name="notes" rows="2" placeholder="הערות מיוחדות להזמנה"></textarea>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="terms" name="terms" required>
                <label for="terms">אני מסכים/ה לתנאי השימוש ומדינות הפרטיות <span class="required">*</span></label>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="marketing" name="marketing">
                <label for="marketing">אני מסכים/ה לקבל עדכונים שיווקיים במייל (אופציונלי)</label>
            </div>
            
            <button type="submit" class="btn btn-primary">
                🚀 בצע הזמנה ועבור לתשלום
            </button>
            
            <button type="button" class="btn btn-secondary" onclick="window.close()">
                ❌ ביטול
            </button>
        </form>
        
        <div id="loading" class="loading">
            <h3>🔄 יוצר הזמנה...</h3>
            <p>אנא המתן, יוצר הזמנה ב-Shopify...</p>
        </div>
    </div>

    <script>
        async function submitOrder(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const customerData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                quantity: parseInt(formData.get('quantity')),
                notes: formData.get('notes'),
                marketing: formData.get('marketing') === 'on'
            };
            
            // Show loading
            document.getElementById('orderForm').style.display = 'none';
            document.getElementById('loading').style.display = 'block';
            
            try {
                // Send order to parent window
                window.opener.postMessage({
                    type: 'create_order',
                    productId: '${productId}',
                    storeId: '${storeId}',
                    title: '${title}',
                    price: '${price}',
                    customerData: customerData
                }, '*');
                
                // Close popup
                window.close();
                
            } catch (error) {
                alert('שגיאה ביצירת ההזמנה: ' + error.message);
                document.getElementById('orderForm').style.display = 'block';
                document.getElementById('loading').style.display = 'none';
            }
        }
    </script>
</body>
</html>`;
    
    // Open popup window
    const popup = window.open('', 'customer_details', 'width=600,height=800,scrollbars=yes,resizable=no');
    popup.document.write(popupHTML);
    popup.document.close();
}

// Listen for customer form submission and process order
window.addEventListener('message', async function(event) {
    if (event.data.type === 'create_order') {
        await processOrderWithCustomerData(event.data);
    } else if (event.data.type === 'payment_completed') {
        handlePaymentComplete(event.data.order);
    }
});

// Process order with customer data
async function processOrderWithCustomerData(orderData) {
    addMessage(`🔄 יוצר הזמנה אמיתית ב-Shopify עבור ${orderData.title}...`, 'bot');
    
    try {
        // Create real order in Shopify with customer data
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: orderData.productId,
                storeId: orderData.storeId,
                productTitle: orderData.title,
                productPrice: orderData.price,
                quantity: orderData.customerData.quantity || 1,
                customerInfo: {
                    email: orderData.customerData.email,
                    firstName: orderData.customerData.fullName.split(' ')[0] || 'לקוח',
                    lastName: orderData.customerData.fullName.split(' ').slice(1).join(' ') || 'חדש',
                    phone: orderData.customerData.phone,
                    address: orderData.customerData.address,
                    notes: orderData.customerData.notes,
                    marketing: orderData.customerData.marketing
                }
            })
        });

        const orderResult = await response.json();
        console.log('Order creation result:', orderResult);

        if (orderResult.success) {
            currentOrder = {
                trackingId: orderResult.trackingId,
                orderNumber: orderResult.orderNumber,
                title: orderData.title,
                price: orderData.price,
                total: orderResult.total
            };
            
            addMessage(`
                ✅ <strong>הזמנה נוצרה בהצלחה ב-Shopify!</strong><br>
                📧 <strong>אישור הזמנה נשלח למייל:</strong> ${orderResult.customerEmail}<br>
                📦 <strong>מספר הזמנה:</strong> #${orderResult.orderNumber}<br>
                🛒 <strong>מוצר:</strong> ${orderData.title}<br>
                💰 <strong>סכום לתשלום:</strong> ₪${orderResult.total}<br><br>
                <button onclick="openPayPalDemo()" style="background: #0070ba; color: white; border: none; padding: 15px 25px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    💳 שלם עם PayPal (Demo)
                </button>
            `, 'bot');
            
        } else {
            addMessage(`❌ שגיאה ביצירת ההזמנה: ${orderResult.error}`, 'bot');
        }
        
    } catch (error) {
        console.error('Order creation error:', error);
        addMessage(`❌ שגיאה ביצירת ההזמנה: ${error.message}`, 'bot');
    }
}

// PayPal Demo Payment Window
function openPayPalDemo() {
    if (!currentOrder) {
        addMessage('❌ אין הזמנה פעילה', 'bot');
        return;
    }

    // Create demo PayPal popup window
    const popupHTML = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PayPal Demo - תשלום</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; background: #f7f9fa; padding: 20px; direction: rtl; }
        .container { max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .paypal-logo { text-align: center; font-size: 32px; font-weight: bold; color: #0070ba; margin-bottom: 20px; }
        .demo-badge { background: #ff6b35; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; text-align: center; margin-bottom: 20px; }
        .order-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .total { font-size: 24px; font-weight: bold; color: #0070ba; text-align: center; margin: 20px 0; }
        .btn { width: 100%; padding: 15px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 10px 0; }
        .btn-paypal { background: #0070ba; color: white; }
        .btn-cancel { background: #6c757d; color: white; }
        .btn:hover { opacity: 0.9; }
        .loading { display: none; text-align: center; padding: 20px; }
        .success { display: none; text-align: center; color: #28a745; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="paypal-logo">PayPal</div>
        <div class="demo-badge">🧪 Demo Mode - תשלום מדומה</div>
        
        <div id="payment-form">
            <div class="order-summary">
                <h3>סיכום ההזמנה</h3>
                <p><strong>מספר הזמנה:</strong> #${currentOrder.orderNumber}</p>
                <p><strong>מוצר:</strong> ${currentOrder.title}</p>
                <p><strong>כמות:</strong> 1</p>
            </div>
            <div class="total">₪${currentOrder.total}</div>
            <button class="btn btn-paypal" onclick="processPayment()">💳 שלם עכשיו</button>
            <button class="btn btn-cancel" onclick="window.close()">❌ ביטול</button>
        </div>
        
        <div id="loading" class="loading">
            <h3>מעבד תשלום...</h3>
            <p>אנא המתן...</p>
        </div>
        
        <div id="success" class="success">
            <h3>✅ התשלום הושלם בהצלחה!</h3>
            <p>החלון יסגר תוך 3 שניות...</p>
        </div>
    </div>

    <script>
        function processPayment() {
            document.getElementById("payment-form").style.display = "none";
            document.getElementById("loading").style.display = "block";
            
            setTimeout(() => {
                fetch("/api/orders/${currentOrder.trackingId}/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentMethod: "paypal_demo" })
                }).then(response => response.json()).then(result => {
                    document.getElementById("loading").style.display = "none";
                    document.getElementById("success").style.display = "block";
                    window.opener.postMessage({ type: "payment_completed", order: result.order }, "*");
                    setTimeout(() => { window.close(); }, 3000);
                });
            }, 2000);
        }
    </script>
</body>
</html>`;

    // Open popup window
    const popup = window.open('', 'paypal_demo', 'width=500,height=700,scrollbars=no,resizable=no');
    popup.document.write(popupHTML);
    popup.document.close();
}

// Handle payment completion
function handlePaymentComplete(order) {
    addMessage(`
        🎉 <strong>התשלום הושלם בהצלחה!</strong><br>
        📦 <strong>מספר הזמנה:</strong> #${order.orderNumber}<br>
        💳 <strong>סכום ששולם:</strong> ₪${order.total}<br>
        📅 <strong>תאריך תשלום:</strong> ${new Date(order.paidAt).toLocaleString('he-IL')}<br><br>
        <button onclick="checkOrderStatus('${currentOrder.trackingId}')" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            📋 בדוק סטטוס הזמנה
        </button>
    `, 'bot');

    // Update conversation history with order info
    conversationHistory.push({
        role: 'system',
        content: `הזמנה #${order.orderNumber} שולמה בהצלחה עבור ${currentOrder.title}`,
        orderInfo: {
            orderNumber: order.orderNumber,
            productTitle: currentOrder.title,
            total: order.total,
            paidAt: order.paidAt,
            paymentMethod: 'PayPal Demo'
        },
        timestamp: new Date()
    });
}

// Check order status
async function checkOrderStatus(trackingId) {
    try {
        addMessage('🔍 בודק סטטוס ההזמנה...', 'bot');
        const response = await fetch(`/api/orders/${trackingId}/status`);
        const result = await response.json();
        
        if (result.success) {
            const order = result.order;
            const statusEmoji = {
                'pending_payment': '⏳',
                'paid': '✅',
                'shipped': '🚚',
                'delivered': '📦'
            };
            
            let html = `📋 <strong>סטטוס הזמנה #${order.orderNumber}</strong><br>`;
            html += `${statusEmoji[order.status] || '📦'} <strong>סטטוס:</strong> ${getStatusText(order.status)}<br>`;
            html += `🛒 <strong>מוצר:</strong> ${order.productTitle}<br>`;
            html += `💰 <strong>סכום:</strong> ₪${order.total}<br>`;
            html += `📅 <strong>נוצר:</strong> ${new Date(order.createdAt).toLocaleString('he-IL')}<br>`;
            if (order.paidAt) {
                html += `💳 <strong>שולם:</strong> ${new Date(order.paidAt).toLocaleString('he-IL')}<br>`;
            }
            
            addMessage(html, 'bot');
        } else {
            addMessage('❌ לא ניתן לבדוק את סטטוס ההזמנה: ' + result.error, 'bot');
        }
    } catch (error) {
        addMessage('❌ שגיאה בבדיקת הסטטוס: ' + error.message, 'bot');
    }
}

// Get status text in Hebrew
function getStatusText(status) {
    const statusTexts = {
        'pending_payment': 'ממתין לתשלום',
        'paid': 'שולם',
        'processing': 'בעיבוד',
        'shipped': 'נשלח',
        'delivered': 'נמסר'
    };
    return statusTexts[status] || status;
}

// Make functions available globally
window.initChatTab = initChatTab;
window.loadChatComponent = loadChatComponent;
window.populateStoreSelect = populateStoreSelect;
window.handleChatKeyPress = handleChatKeyPress;
window.sendMessage = sendMessage;
window.addMessage = addMessage;
window.orderProduct = orderProduct;
window.openPayPalDemo = openPayPalDemo;
window.checkOrderStatus = checkOrderStatus;