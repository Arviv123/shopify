/**
 * Shop AI Chat - Client-side implementation
 * Version: 3.0.0 - FINAL VERSION with all fixes
 *
 * This module handles the chat interface for the Shopify AI Chat application.
 * It manages the UI interactions, API communication, and message rendering.
 */
(function() {
  'use strict';

  console.log('🎉 Chat.js v3.0.0 loaded - All cache issues fixed!');

  /**
   * Utility function to escape RegExp special characters
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Application namespace to prevent global scope pollution
   */
  const ShopAIChat = {
    /**
     * UI-related elements and functionality
     */
    UI: {
      elements: {},
      isMobile: false,

      /**
       * Initialize UI elements and event listeners
       */
      init: function() {
        this.elements = {
          container: document.querySelector('.shop-ai-chat-container'),
          bubble: document.querySelector('.shop-ai-chat-bubble'),
          window: document.querySelector('.shop-ai-chat-window'),
          closeButton: document.querySelector('.shop-ai-chat-close'),
          messagesContainer: document.querySelector('.shop-ai-chat-messages'),
          input: document.querySelector('.shop-ai-chat-input input'),
          sendButton: document.querySelector('.shop-ai-chat-send')
        };

        this.checkMobile();
        this.bindEvents();
        this.displayWelcomeMessage();
      },

      /**
       * Check if the device is mobile
       */
      checkMobile: function() {
        this.isMobile = window.innerWidth <= 768;
      },

      /**
       * Bind event listeners to UI elements
       */
      bindEvents: function() {
        if (this.elements.bubble) {
          this.elements.bubble.addEventListener('click', () => this.toggleChat());
        }

        if (this.elements.closeButton) {
          this.elements.closeButton.addEventListener('click', () => this.closeChat());
        }

        if (this.elements.input) {
          this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ShopAIChat.Chat.send();
            }
          });

          this.elements.input.addEventListener('input', () => {
            this.updateSendButtonState();
          });
        }

        if (this.elements.sendButton) {
          this.elements.sendButton.addEventListener('click', () => ShopAIChat.Chat.send());
        }

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
          if (this.elements.window && this.elements.window.classList.contains('active') &&
              !this.elements.container.contains(e.target)) {
            this.closeChat();
          }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
          this.checkMobile();
        });
      },

      /**
       * Toggle chat window visibility
       */
      toggleChat: function() {
        if (this.elements.window) {
          const isActive = this.elements.window.classList.toggle('active');
          if (isActive) {
            this.elements.input?.focus();
            ShopAIChat.Chat.loadHistory();
          }
        }
      },

      /**
       * Close chat window
       */
      closeChat: function() {
        if (this.elements.window) {
          this.elements.window.classList.remove('active');
        }
      },

      /**
       * Update send button state based on input
       */
      updateSendButtonState: function() {
        const hasText = this.elements.input && this.elements.input.value.trim().length > 0;
        if (this.elements.sendButton) {
          this.elements.sendButton.disabled = !hasText;
        }
      },

      /**
       * Display welcome message
       */
      displayWelcomeMessage: function() {
        const welcomeMessage = window.shopChatConfig?.welcomeMessage || "👋 Hi there! How can I help you today?";
        this.addMessage('assistant', welcomeMessage);
      },

      /**
       * Add a message to the chat
       */
      addMessage: function(role, content, products = []) {
        if (!this.elements.messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('shop-ai-message', role);

        // Handle text content
        if (typeof content === 'string') {
          // Convert markdown-style links to clickable links
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          const processedContent = content.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

          messageElement.innerHTML = processedContent;
        } else {
          messageElement.textContent = content;
        }

        this.elements.messagesContainer.appendChild(messageElement);

        // Add products if provided
        if (products && products.length > 0) {
          this.addProductsDisplay(products);
        }

        this.scrollToBottom();
      },

      /**
       * Add products display to chat
       */
      addProductsDisplay: function(products) {
        if (!this.elements.messagesContainer || !products.length) return;

        const productsContainer = document.createElement('div');
        productsContainer.classList.add('shop-ai-products');

        products.forEach(product => {
          const productElement = document.createElement('div');
          productElement.classList.add('shop-ai-product');

          // Create product image
          const image = document.createElement('img');
          image.src = product.image_url || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
          image.alt = product.title || 'Product';
          image.loading = 'lazy';
          image.onerror = function() {
            this.src = 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
          };

          // Create product info
          const info = document.createElement('div');
          info.classList.add('product-info');

          const title = document.createElement('h4');
          title.textContent = product.title || 'Product';

          const price = document.createElement('div');
          price.classList.add('product-price');
          price.textContent = product.price || 'Price not available';

          const description = document.createElement('p');
          description.textContent = product.description || '';

          info.appendChild(title);
          info.appendChild(price);
          if (product.description) {
            info.appendChild(description);
          }

          productElement.appendChild(image);
          productElement.appendChild(info);

          // Make product clickable if URL is available
          if (product.url) {
            productElement.style.cursor = 'pointer';
            productElement.addEventListener('click', () => {
              window.open(product.url, '_blank');
            });
          }

          productsContainer.appendChild(productElement);
        });

        this.elements.messagesContainer.appendChild(productsContainer);
        this.scrollToBottom();
      },

      /**
       * Add typing indicator
       */
      addTypingIndicator: function() {
        if (!this.elements.messagesContainer) return;

        const typingElement = document.createElement('div');
        typingElement.classList.add('shop-ai-message', 'assistant', 'typing');
        typingElement.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        typingElement.id = 'typing-indicator';

        this.elements.messagesContainer.appendChild(typingElement);
        this.scrollToBottom();

        return typingElement;
      },

      /**
       * Remove typing indicator
       */
      removeTypingIndicator: function() {
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
          typingElement.remove();
        }
      },

      /**
       * Scroll to bottom of messages
       */
      scrollToBottom: function() {
        if (this.elements.messagesContainer) {
          this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }
      }
    },

    /**
     * Chat functionality
     */
    Chat: {
      conversationId: null,

      /**
       * Initialize chat system
       */
      init: function() {
        this.conversationId = this.generateConversationId();
        console.log('Chat initialized with conversation ID:', this.conversationId);
      },

      /**
       * Generate a unique conversation ID
       */
      generateConversationId: function() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      },

      /**
       * Send a message
       */
      send: function() {
        const input = ShopAIChat.UI.elements.input;
        if (!input) return;

        const userMessage = input.value.trim();
        if (!userMessage) return;

        // Add user message to chat
        ShopAIChat.UI.addMessage('user', userMessage);
        input.value = '';
        ShopAIChat.UI.updateSendButtonState();

        // Add typing indicator
        const typingIndicator = ShopAIChat.UI.addTypingIndicator();

        // Send message to server
        this.streamResponse(userMessage, typingIndicator);
      },

      /**
       * Stream response from server
       */
      streamResponse: async function(userMessage, typingIndicator) {
        try {
          const promptType = window.shopChatConfig?.promptType || "standardAssistant";
          const requestBody = JSON.stringify({
            message: userMessage,
            conversation_id: this.conversationId,
            prompt_type: promptType
          });

          const baseUrl = window.location.origin;
          const streamUrl = `${baseUrl}/chat`;
          const shopId = window.shopId;

          console.log('🌐 Sending request to:', streamUrl);

          const response = await fetch(streamUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
              'X-Shopify-Shop-Id': shopId
            },
            body: requestBody
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Remove typing indicator
          ShopAIChat.UI.removeTypingIndicator();

          // Handle streaming response
          await this.handleStreamingResponse(response);

        } catch (error) {
          console.error('Error in streaming:', error);
          ShopAIChat.UI.removeTypingIndicator();
          ShopAIChat.UI.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
      },

      /**
       * Handle streaming response
       */
      handleStreamingResponse: async function(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let currentProducts = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  assistantMessage += parsed.delta.text;
                  this.updateAssistantMessage(assistantMessage);
                } else if (parsed.type === 'products' && parsed.products) {
                  currentProducts = parsed.products;
                } else if (parsed.type === 'message_stop') {
                  if (currentProducts.length > 0) {
                    ShopAIChat.UI.addProductsDisplay(currentProducts);
                  }
                } else if (parsed.type === 'auth_required') {
                  ShopAIChat.UI.addMessage('assistant',
                    'You need to authorize the app to access your account. Please click the authorization link that appears in the chat.');
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error);
              }
            }
          }
        }
      },

      /**
       * Update assistant message during streaming
       */
      updateAssistantMessage: function(content) {
        let assistantMessageElement = document.querySelector('.shop-ai-message.assistant:last-child');

        if (!assistantMessageElement || assistantMessageElement.classList.contains('typing')) {
          assistantMessageElement = document.createElement('div');
          assistantMessageElement.classList.add('shop-ai-message', 'assistant');
          ShopAIChat.UI.elements.messagesContainer.appendChild(assistantMessageElement);
        }

        // Convert markdown-style links to clickable links
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const processedContent = content.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        assistantMessageElement.innerHTML = processedContent;
        ShopAIChat.UI.scrollToBottom();
      },

      /**
       * Load conversation history
       */
      loadHistory: function() {
        if (!this.conversationId) return;

        this.fetchChatHistory(this.conversationId, ShopAIChat.UI.elements.messagesContainer);
      },

      /**
       * Fetch chat history from server
       */
      fetchChatHistory: async function(conversationId, messagesContainer) {
        try {
          // Show a loading message
          const loadingMessage = document.createElement('div');
          loadingMessage.classList.add('shop-ai-message', 'assistant');
          loadingMessage.textContent = "Loading conversation history...";
          messagesContainer.appendChild(loadingMessage);

          // Fetch history from the server
          const baseUrl = window.location.origin;
          const historyUrl = `${baseUrl}/chat?history=true&conversation_id=${encodeURIComponent(conversationId)}`;
          console.log('Fetching history from:', historyUrl);

          const response = await fetch(historyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });

          // Remove loading message
          loadingMessage.remove();

          if (!response.ok) {
            console.error('Failed to fetch history:', response.status, response.statusText);
            return;
          }

          const historyData = await response.json();
          console.log('History data received:', historyData);

          if (historyData.messages && historyData.messages.length > 0) {
            // Clear existing messages except welcome message
            const welcomeMessage = messagesContainer.querySelector('.shop-ai-message.assistant');
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
              messagesContainer.appendChild(welcomeMessage);
            }

            // Add history messages
            historyData.messages.forEach(message => {
              if (message.role === 'user') {
                ShopAIChat.UI.addMessage('user', message.content);
              } else if (message.role === 'assistant') {
                ShopAIChat.UI.addMessage('assistant', message.content);
              }
            });
          }

        } catch (error) {
          console.error('Error fetching chat history:', error);
          // Remove loading message on error
          const loadingMessage = messagesContainer.querySelector('.shop-ai-message.assistant:last-child');
          if (loadingMessage && loadingMessage.textContent === "Loading conversation history...") {
            loadingMessage.remove();
          }
        }
      }
    },

    /**
     * Authentication handler
     */
    Auth: {
      /**
       * Check authentication status
       */
      checkAuthStatus: async function(conversationId) {
        let attemptCount = 0;
        const maxAttempts = 10; // Maximum number of polling attempts
        const pollInterval = 2000; // 2 seconds between checks

        const pollAuthStatus = async () => {
          if (attemptCount >= maxAttempts) {
            console.log('Max polling attempts reached, stopping');
            return;
          }

          attemptCount++;

          try {
            const baseUrl = window.location.origin;
            const tokenUrl = `${baseUrl}/auth/token-status?conversation_id=${encodeURIComponent(conversationId)}`;
            const response = await fetch(tokenUrl);

            if (!response.ok) {
              throw new Error('Token status check failed: ' + response.status);
            }

            const data = await response.json();

            if (data.status === 'authorized') {
              console.log('Authorization successful!');
              ShopAIChat.UI.addMessage('assistant',
                '✅ Authorization successful! You can now ask me about your orders and account information.');
              return;
            } else if (data.status === 'pending') {
              console.log('Authorization still pending, checking again...');
              setTimeout(pollAuthStatus, pollInterval);
            } else {
              console.log('Authorization failed or expired');
              ShopAIChat.UI.addMessage('assistant',
                '❌ Authorization failed or expired. Please try again.');
            }
          } catch (error) {
            console.error('Error checking auth status:', error);
            if (attemptCount < maxAttempts) {
              setTimeout(pollAuthStatus, pollInterval);
            }
          }
        };

        // Start polling
        pollAuthStatus();
      }
    },

    /**
     * Initialize the entire application
     */
    init: function() {
      console.log('🚀 Initializing Shop AI Chat v3.0.0');

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.UI.init();
          this.Chat.init();
        });
      } else {
        this.UI.init();
        this.Chat.init();
      }
    }
  };

  // Initialize the application when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    ShopAIChat.init();
  });

  // Also expose to global scope for debugging
  window.ShopAIChat = ShopAIChat;

})();

console.log('✅ Chat.js v3.0.0 fully loaded and ready!');