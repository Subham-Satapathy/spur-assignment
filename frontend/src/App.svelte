<script>
  import { onMount } from 'svelte';
  import API_URL from './config.js';

  let messages = [];
  let inputMessage = '';
  let isLoading = false;
  let error = '';
  let conversationId = '';
  let messagesContainer;
  let isChatOpen = false;
  let questionCache = new Map();
  const CACHE_DURATION = 5 * 60 * 1000;

  onMount(async () => {
    conversationId = localStorage.getItem('conversationId') || '';
    
    if (conversationId) {
      await loadConversationHistory();
    }
  });

  async function loadConversationHistory() {
    try {
      const response = await fetch(`${API_URL}/chat/conversation/${conversationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          localStorage.removeItem('conversationId');
          conversationId = '';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      messages = data.messages.map(msg => ({
        text: msg.text,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp)
      }));
      
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load conversation history:', err);
      localStorage.removeItem('conversationId');
      conversationId = '';
    }
  }

  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  function toggleChat() {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
      scrollToBottom();
    }
  }

  function sendSuggestion(text) {
    inputMessage = text;
    sendMessage();
  }

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    inputMessage = '';
    error = '';

    messages = [...messages, {
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    }];
    scrollToBottom();

    const normalizedQuestion = userMessage.toLowerCase().trim();
    const cached = questionCache.get(normalizedQuestion);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      cached.repeatCount = (cached.repeatCount || 1) + 1;
      questionCache.set(normalizedQuestion, cached);

      setTimeout(() => {
        let responseText = cached.answer;
        
        if (cached.repeatCount === 2) {
          responseText = "I see you're asking about this again. Here's the information:\n\n" + cached.answer + "\n\nNeed more details or have a specific concern?";
        } else if (cached.repeatCount === 3) {
          responseText = "You've asked this a few times. Let me know if you need clarification on any part:\n\n" + cached.answer + "\n\nFeel free to ask a more specific question!";
        } else if (cached.repeatCount > 3) {
          responseText = "I'm here to help! Here's the same info again:\n\n" + cached.answer + "\n\nIf something's unclear, try asking about a specific aspect (e.g., 'How long does shipping take?' or 'What's the return deadline?').";
        }

        messages = [...messages, {
          text: responseText,
          sender: 'ai',
          timestamp: new Date()
        }];
        scrollToBottom();
      }, 300);
      return;
    }

    isLoading = true;

    try {
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: conversationId || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.sessionId && !conversationId) {
        conversationId = data.sessionId;
        localStorage.setItem('conversationId', conversationId);
      }

      questionCache.set(normalizedQuestion, {
        answer: data.reply,
        timestamp: now,
        repeatCount: 1
      });

      messages = [...messages, {
        text: data.reply,
        sender: 'ai',
        timestamp: new Date()
      }];
      scrollToBottom();

    } catch (err) {
      error = err.message || 'Failed to send message. Please try again.';
      console.error('Error:', err);
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<!-- Landing Page -->
<div class="landing-page">
  <header class="hero">
    <div class="hero-content">
      <h1>🛒 Spur of the Moment Shop</h1>
      <p class="tagline">Your one-stop shop for spontaneous purchases!</p>
      <p class="subtitle">Browse our amazing deals and get instant support from our AI assistant</p>
    </div>
  </header>

  <main class="main-content">
    <section class="features">
      <div class="feature-card">
        <div class="icon">🚚</div>
        <h3>Fast Shipping</h3>
        <p>Free shipping on orders over $50</p>
      </div>
      <div class="feature-card">
        <div class="icon">↩️</div>
        <h3>Easy Returns</h3>
        <p>30-day return policy, no questions asked</p>
      </div>
      <div class="feature-card">
        <div class="icon">💳</div>
        <h3>Secure Payments</h3>
        <p>All major payment methods accepted</p>
      </div>
      <div class="feature-card">
        <div class="icon">🤖</div>
        <h3>24/7 AI Support</h3>
        <p>Get instant answers to your questions</p>
      </div>
    </section>

    <section class="products">
      <h2>Featured Products</h2>
      <div class="product-grid">
        <div class="product-card">
          <div class="product-image">📱</div>
          <h4>Gadgets</h4>
          <p>Latest tech devices</p>
        </div>
        <div class="product-card">
          <div class="product-image">👕</div>
          <h4>Fashion</h4>
          <p>Trendy clothing</p>
        </div>
        <div class="product-card">
          <div class="product-image">🏠</div>
          <h4>Home & Living</h4>
          <p>Decor and essentials</p>
        </div>
        <div class="product-card">
          <div class="product-image">⚽</div>
          <h4>Sports</h4>
          <p>Equipment & gear</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <p>&copy; 2025 Spur Shop. All rights reserved.</p>
  </footer>
</div>

<!-- Floating Chat Button -->
<button class="chat-button" on:click={toggleChat} class:active={isChatOpen}>
  {#if isChatOpen}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  {:else}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  {/if}
</button>

<!-- Chat Widget -->
{#if isChatOpen}
<div class="chat-widget">
  <div class="chat-container">
  <div class="chat-header">
    <h1>� Spur Shop - Support Chat</h1>    <button class="close-button-header" on:click={toggleChat}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>  </div>

  <div class="messages" bind:this={messagesContainer}>
    {#if messages.length === 0}
      <div class="empty-state">
        <p>👋 Hello! How can I help you today?</p>
        <p class="suggestions">Try asking about:</p>
        <ul class="suggestions-list">
          <li on:click={() => sendSuggestion('What are your shipping policies?')}>Shipping policies</li>
          <li on:click={() => sendSuggestion('How does the return and refund process work?')}>Return & refund process</li>
          <li on:click={() => sendSuggestion('What payment methods do you accept?')}>Payment methods</li>
          <li on:click={() => sendSuggestion('What are your support hours?')}>Support hours</li>
        </ul>
      </div>
    {/if}

    {#each messages as message (message.timestamp)}
      <div class="message {message.sender}">
        <div class="message-content">
          {message.text}
        </div>
        <div class="message-time">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    {/each}

    {#if isLoading}
      <div class="message ai loading">
        <div class="message-content">
          <span class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="error-banner">
      ⚠️ {error}
    </div>
  {/if}

  <form class="chat-input" on:submit|preventDefault={sendMessage}>
    <input
      type="text"
      bind:value={inputMessage}
      on:keypress={handleKeyPress}
      placeholder="Type your message..."
      disabled={isLoading}
      autocomplete="off"
    />
    <button type="submit" disabled={isLoading || !inputMessage.trim()}>
      {isLoading ? '...' : 'Send'}
    </button>
  </form>
  </div>
</div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background: #f5f5f5;
    min-height: 100vh;
  }

  /* Landing Page Styles */
  .landing-page {
    min-height: 100vh;
    background: #1a1d2e;
  }

  .hero {
    padding: 80px 20px;
    text-align: center;
    background: linear-gradient(135deg, rgba(63, 181, 116, 0.1) 0%, rgba(63, 181, 116, 0.05) 100%);
    border-bottom: 1px solid #2d3040;
  }

  .hero-content h1 {
    font-size: 48px;
    color: #e8e9ed;
    margin: 0 0 20px 0;
    font-weight: 700;
  }

  .tagline {
    font-size: 24px;
    color: #3fb574;
    margin: 0 0 10px 0;
    font-weight: 500;
  }

  .subtitle {
    font-size: 16px;
    color: #a0a3b0;
    margin: 0;
  }

  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 20px;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    margin-bottom: 60px;
  }

  .feature-card {
    background: #22252f;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid #2d3040;
    transition: all 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    border-color: #3fb574;
    box-shadow: 0 8px 25px rgba(63, 181, 116, 0.2);
  }

  .feature-card .icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  .feature-card h3 {
    color: #e8e9ed;
    margin: 0 0 10px 0;
    font-size: 20px;
  }

  .feature-card p {
    color: #a0a3b0;
    margin: 0;
    font-size: 14px;
  }

  .products h2 {
    color: #e8e9ed;
    text-align: center;
    font-size: 36px;
    margin: 0 0 40px 0;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .product-card {
    background: #22252f;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid #2d3040;
    transition: all 0.3s ease;
  }

  .product-card:hover {
    transform: translateY(-5px);
    border-color: #3fb574;
    box-shadow: 0 8px 25px rgba(63, 181, 116, 0.2);
  }

  .product-image {
    font-size: 64px;
    margin-bottom: 15px;
  }

  .product-card h4 {
    color: #e8e9ed;
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  .product-card p {
    color: #a0a3b0;
    margin: 0;
    font-size: 14px;
  }

  .footer {
    background: #0f1117;
    color: #6b6e7a;
    text-align: center;
    padding: 30px 20px;
    margin-top: 60px;
    border-top: 1px solid #2d3040;
  }

  .footer p {
    margin: 0;
  }

  /* Floating Chat Button */
  .chat-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #3fb574;
    color: white;
    border: none;
    box-shadow: 0 4px 20px rgba(63, 181, 116, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 1001;
  }

  .chat-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(63, 181, 116, 0.6);
  }

  .chat-button.active {
    background: #e74c3c;
    z-index: 1001;
  }

  .chat-button svg {
    width: 24px;
    height: 24px;
  }

  /* Chat Widget */
  .chat-widget {
    position: fixed;
    bottom: 100px;
    right: 30px;
    z-index: 999;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .chat-container {
    background: #22252f;
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
    width: 400px;
    height: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 0;
  }

  .chat-header {
    background: #3fb574;
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chat-header h1 {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    flex: 1;
  }

  .close-button-header {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    display: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: background 0.2s;
  }

  .close-button-header:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .close-button-header svg {
    width: 20px;
    height: 20px;
  }

  .chat-header p {
    display: none;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #22252f;
  }

  .empty-state {
    text-align: center;
    color: #8b8e98;
    padding: 60px 20px;
  }

  .empty-state p {
    margin: 0 0 20px 0;
    font-size: 15px;
  }

  .suggestions {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #a0a3b0;
  }

  .suggestions-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .suggestions-list li {
    padding: 10px 14px;
    background: #2d3040;
    border-radius: 8px;
    margin: 8px 0;
    font-size: 14px;
    color: #d1d3db;
    border: 1px solid #353845;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .suggestions-list li:hover {
    background: #353845;
    border-color: #3fb574;
    transform: translateX(4px);
  }

  .suggestions-list li:active {
    transform: translateX(2px);
  }

  .message {
    max-width: 75%;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.user {
    align-self: flex-end;
  }

  .message.ai {
    align-self: flex-start;
  }

  .message-content {
    padding: 12px 16px;
    border-radius: 16px;
    word-wrap: break-word;
    white-space: pre-wrap;
    font-size: 15px;
    line-height: 1.4;
  }

  .message.user .message-content {
    background: #3fb574;
    color: white;
    border-radius: 16px 16px 4px 16px;
  }

  .message.ai .message-content {
    background: #2d3040;
    color: #e8e9ed;
    border-radius: 16px 16px 16px 4px;
  }

  .message-time {
    font-size: 11px;
    color: #6b6e7a;
    margin-top: 4px;
    padding: 0 4px;
  }

  .message.user .message-time {
    text-align: right;
  }

  .typing-indicator {
    display: flex;
    gap: 5px;
    padding: 8px 0;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6b6e7a;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  .error-banner {
    background: #3d2626;
    color: #ff6b6b;
    padding: 12px 20px;
    text-align: center;
    font-size: 13px;
    border-top: 1px solid #4d3636;
  }

  .chat-input {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #1a1d2e;
    border-top: 1px solid #2d3040;
  }

  .chat-input input {
    flex: 1;
    padding: 14px 18px;
    border: 1px solid #353845;
    border-radius: 24px;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    background: #22252f;
    color: #e8e9ed;
  }

  .chat-input input::placeholder {
    color: #6b6e7a;
  }

  .chat-input input:focus {
    border-color: #3fb574;
  }

  .chat-input input:disabled {
    background: #1a1d2e;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .chat-input button {
    padding: 14px 20px;
    background: #3fb574;
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    min-width: 70px;
  }

  .chat-input button:hover:not(:disabled) {
    background: #36a066;
  }

  .chat-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Custom scrollbar */
  .messages::-webkit-scrollbar {
    width: 6px;
  }

  .messages::-webkit-scrollbar-track {
    background: #1a1d2e;
  }

  .messages::-webkit-scrollbar-thumb {
    background: #353845;
    border-radius: 3px;
  }

  .messages::-webkit-scrollbar-thumb:hover {
    background: #454860;
  }

  /* Responsive breakpoints */
  @media (max-width: 640px) {
    .chat-widget {
      bottom: 0;
      right: 0;
      left: 0;
      top: 0;
      z-index: 1000;
    }

    .chat-container {
      width: 100%;
      height: 100vh;
      border-radius: 0;
    }

    .close-button-header {
      display: flex;
    }

    .chat-button.active {
      display: none;
    }

    .hero-content h1 {
      font-size: 32px;
    }

    .tagline {
      font-size: 18px;
    }
  }

  @media (min-width: 768px) {
    .hero-content h1 {
      font-size: 56px;
    }
  }
</style>

