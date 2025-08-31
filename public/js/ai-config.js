// AI Configuration Component

// Initialize AI config tab
function initAIConfigTab() {
    loadAIConfigComponent();
    loadAIConfig();
    loadAIStatus();
}

// Load AI config component
function loadAIConfigComponent() {
    const container = document.getElementById('ai-config-container');
    if (!container) return;

    container.innerHTML = `
        <div class="ai-config">
            <h2>🤖 הגדרות AI</h2>
            <p>קבע את הגדרות הבינה המלאכותית לחוויית צ'אט משופרת</p>
            
            <form id="aiConfigForm" onsubmit="saveAIConfig(event)">
                <div class="form-group">
                    <label for="aiProvider">ספק AI</label>
                    <select id="aiProvider" name="aiProvider" onchange="updateAIForm()">
                        <option value="none">בטל AI (מצב ידני)</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="gemini-free">Google Gemini FREE</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="ollama">Ollama (מקומי)</option>
                    </select>
                </div>
                
                <div class="form-group" id="modelGroup">
                    <label for="aiModel">מודל</label>
                    <select id="aiModel" name="aiModel">
                        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    </select>
                </div>
                
                <div class="api-keys-section">
                    <div class="form-group" id="anthropicKey" style="display: none;">
                        <label for="anthropic-key">Anthropic API Key</label>
                        <input type="password" id="anthropic-key" placeholder="sk-ant-...">
                    </div>
                    
                    <div class="form-group" id="openaiKey" style="display: none;">
                        <label for="openai-key">OpenAI API Key</label>
                        <input type="password" id="openai-key" placeholder="sk-...">
                    </div>
                    
                    <div class="form-group" id="geminiFreeKey" style="display: none;">
                        <label for="gemini-free-key">Google AI API Key</label>
                        <input type="password" id="gemini-free-key" placeholder="AIzaSy...">
                    </div>
                    
                    <div class="form-group" id="deepseekKey" style="display: none;">
                        <label for="deepseek-key">DeepSeek API Key</label>
                        <input type="password" id="deepseek-key" placeholder="sk-...">
                    </div>
                    
                    <div class="form-group" id="ollamaUrl" style="display: none;">
                        <label for="ollama-url">Ollama Server URL</label>
                        <input type="url" id="ollama-url" value="http://localhost:11434" placeholder="http://localhost:11434">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn">💾 שמור הגדרות</button>
                    <button type="button" class="btn btn-secondary" onclick="testAIConnection()">🧪 בדוק חיבור</button>
                </div>
            </form>
            
            <div id="aiConfigResult"></div>
            
            <div id="aiStatus" class="ai-status"></div>
            
            <div class="help-section">
                <h3>💡 הדרכה</h3>
                <ul>
                    <li><strong>Anthropic Claude:</strong> מומלץ לחוויה הטובה ביותר</li>
                    <li><strong>OpenAI GPT:</strong> אלטרנטיבה מעולה</li>
                    <li><strong>Google Gemini FREE:</strong> בחינם עם הגבלות</li>
                    <li><strong>DeepSeek:</strong> אופציה חסכונית</li>
                    <li><strong>Ollama:</strong> הרצה מקומית ללא עלות</li>
                </ul>
            </div>
        </div>
    `;
}

// Update AI form based on provider selection
function updateAIForm() {
    const provider = document.getElementById('aiProvider').value;
    const modelSelect = document.getElementById('aiModel');
    
    // Hide all API key inputs
    const keyGroups = ['anthropicKey', 'openaiKey', 'geminiFreeKey', 'deepseekKey', 'ollamaUrl'];
    keyGroups.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    
    // Show relevant API key input and update models
    switch (provider) {
        case 'anthropic':
            document.getElementById('anthropicKey').style.display = 'block';
            modelSelect.innerHTML = `
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            `;
            break;
            
        case 'openai':
            document.getElementById('openaiKey').style.display = 'block';
            modelSelect.innerHTML = `
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            `;
            break;
            
        case 'gemini-free':
            document.getElementById('geminiFreeKey').style.display = 'block';
            modelSelect.innerHTML = `
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-pro">Gemini Pro</option>
            `;
            break;
            
        case 'deepseek':
            document.getElementById('deepseekKey').style.display = 'block';
            modelSelect.innerHTML = `
                <option value="deepseek-chat">DeepSeek Chat</option>
            `;
            break;
            
        case 'ollama':
            document.getElementById('ollamaUrl').style.display = 'block';
            modelSelect.innerHTML = `
                <option value="llama2">Llama 2</option>
                <option value="mistral">Mistral</option>
                <option value="codellama">Code Llama</option>
            `;
            break;
            
        default:
            modelSelect.innerHTML = '<option value="">AI מבוטל</option>';
    }
}

// Load AI configuration
async function loadAIConfig() {
    try {
        const config = await AIAPI.getConfig();
        
        if (config) {
            document.getElementById('aiProvider').value = config.provider || 'anthropic';
            updateAIForm();
            document.getElementById('aiModel').value = config.model || 'claude-3-sonnet-20240229';
            
            // Load API keys
            if (config.anthropicKey) document.getElementById('anthropic-key').value = config.anthropicKey;
            if (config.openaiKey) document.getElementById('openai-key').value = config.openaiKey;
            if (config.geminiFreeKey) document.getElementById('gemini-free-key').value = config.geminiFreeKey;
            if (config.deepseekKey) document.getElementById('deepseek-key').value = config.deepseekKey;
            if (config.ollamaUrl) document.getElementById('ollama-url').value = config.ollamaUrl;
            
            currentAIConfig = config;
            showAIResult('✅ הגדרות נטענו בהצלחה', 'success');
        } else {
            showAIResult('ℹ️ אין הגדרות שמורות', 'info');
        }
        
    } catch (error) {
        showAIResult(`❌ שגיאה בטעינת הגדרות: ${error.message}`, 'error');
    }
}

// Save AI configuration
async function saveAIConfig(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const config = {
        provider: formData.get('aiProvider'),
        model: formData.get('aiModel'),
        anthropicKey: document.getElementById('anthropic-key').value,
        openaiKey: document.getElementById('openai-key').value,
        geminiFreeKey: document.getElementById('gemini-free-key').value,
        deepseekKey: document.getElementById('deepseek-key').value,
        ollamaUrl: document.getElementById('ollama-url').value
    };

    try {
        showAIResult('💾 שומר הגדרות...', 'loading');
        
        const result = await AIAPI.saveConfig(config);
        
        if (result.success) {
            showAIResult('✅ הגדרות נשמרו בהצלחה!', 'success');
            currentAIConfig = config;
            await loadAIStatus();
            showToast('הגדרות AI נשמרו', 'success');
        } else {
            throw new Error(result.error || 'שמירה נכשלה');
        }
        
    } catch (error) {
        showAIResult(`❌ שגיאה בשמירה: ${error.message}`, 'error');
        showToast('שגיאה בשמירת הגדרות', 'error');
    }
}

// Test AI connection
async function testAIConnection() {
    const provider = document.getElementById('aiProvider').value;
    const model = document.getElementById('aiModel').value;
    
    if (provider === 'none') {
        showAIResult('⚠️ לא ניתן לבדוק חיבור כאשר AI מבוטל', 'warning');
        return;
    }
    
    let apiKey;
    switch (provider) {
        case 'anthropic':
            apiKey = document.getElementById('anthropic-key').value;
            break;
        case 'openai':
            apiKey = document.getElementById('openai-key').value;
            break;
        case 'gemini-free':
            apiKey = document.getElementById('gemini-free-key').value;
            break;
        case 'deepseek':
            apiKey = document.getElementById('deepseek-key').value;
            break;
        case 'ollama':
            apiKey = document.getElementById('ollama-url').value;
            break;
    }
    
    if (!apiKey) {
        showAIResult('❌ אנא הכנס מפתח API או URL', 'error');
        return;
    }
    
    try {
        showAIResult('🧪 בודק חיבור...', 'loading');
        
        const result = await AIAPI.testConnection({
            provider,
            model,
            apiKey
        });
        
        if (result.success) {
            showAIResult(`✅ החיבור הצליח! מודל: ${model}`, 'success');
            updateAIStatus('online');
            showToast('חיבור AI תקין', 'success');
        } else {
            throw new Error(result.error || 'החיבור נכשל');
        }
        
    } catch (error) {
        showAIResult(`❌ החיבור נכשל: ${error.message}`, 'error');
        updateAIStatus('offline');
        showToast('חיבור AI נכשל', 'error');
    }
}

// Load AI status
async function loadAIStatus() {
    try {
        const status = await AIAPI.getStatus();
        updateAIStatus(status.active ? 'online' : 'offline');
    } catch (error) {
        updateAIStatus('offline');
    }
}

// Update AI status display
function updateAIStatus(status) {
    const statusDiv = document.getElementById('aiStatus');
    if (!statusDiv) return;
    
    let statusHTML = '';
    switch (status) {
        case 'online':
            statusHTML = `
                <div class="alert alert-success">
                    🟢 AI פעיל<br>
                    <small>מודל: ${currentAIConfig.model || 'לא ידוע'}</small>
                </div>
            `;
            break;
        case 'offline':
            statusHTML = `
                <div class="alert alert-error">
                    🔴 AI לא פעיל<br>
                    <small>בדוק הגדרות ומפתח API</small>
                </div>
            `;
            break;
        case 'testing':
            statusHTML = `
                <div class="alert alert-info">
                    🟡 בודק חיבור...
                </div>
            `;
            break;
    }
    
    statusDiv.innerHTML = statusHTML;
}

// Show AI result
function showAIResult(message, type) {
    const resultDiv = document.getElementById('aiConfigResult');
    if (!resultDiv) return;
    
    let className = 'alert';
    switch (type) {
        case 'success':
            className += ' alert-success';
            break;
        case 'error':
            className += ' alert-error';
            break;
        case 'warning':
            className += ' alert-warning';
            break;
        case 'loading':
            resultDiv.innerHTML = `<div class="loading"><div class="spinner"></div>${message}</div>`;
            return;
        default:
            className += ' alert-info';
    }
    
    resultDiv.innerHTML = `<div class="${className}">${message}</div>`;
    
    // Auto-clear after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            resultDiv.innerHTML = '';
        }, 5000);
    }
}

// Make functions available globally
window.initAIConfigTab = initAIConfigTab;
window.updateAIForm = updateAIForm;
window.saveAIConfig = saveAIConfig;
window.testAIConnection = testAIConnection;