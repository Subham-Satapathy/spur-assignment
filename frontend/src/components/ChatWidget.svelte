<script>
  import { onMount } from 'svelte';
  import API_URL from '../config.js';

  export let isChatOpen = false;
  export let onClose;

  let messages = [];
  let inputMessage = '';
  let isLoading = false;
  let isLoadingHistory = false;
  let error = '';
  let conversationId = '';
  let messagesContainer;
  let questionCache = new Map();
  let failedMessage = null; // Store failed message for retry
  const CACHE_DURATION = 5 * 60 * 1000;
  const MAX_MESSAGE_LENGTH = 2000;

  onMount(async () => {
    conversationId = localStorage.getItem('conversationId') || '';
    
    if (conversationId) {
      isLoadingHistory = true;
      await loadConversationHistory();
      isLoadingHistory = false;
    }
  });

  $: if (isChatOpen && messages.length > 0) {
    setTimeout(() => scrollToBottom(), 200);
  }

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
      
      if (data.messages && data.messages.length > 0) {
        messages = data.messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp)
        }));
        
        if (isChatOpen) {
          setTimeout(() => scrollToBottom(), 200);
        }
      }
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

  function sendSuggestion(text) {
    inputMessage = text;
    sendMessage();
  }

  function retryLastMessage() {
    if (failedMessage) {
      inputMessage = failedMessage;
      failedMessage = null;
      error = '';
      sendMessage();
    }
  }

  async function sendMessage() {
    if (isLoading) return;

    const userMessage = inputMessage.trim();

    if (!userMessage) {
      error = 'Please enter a message before sending.';
      return;
    }

    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      error = `Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters. (Currently: ${userMessage.length})`;
      return;
    }

    inputMessage = '';
    error = '';

    messages = [...messages, {
      id: `temp-user-${Date.now()}-${Math.random()}`,
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
          id: `temp-ai-cached-${Date.now()}-${Math.random()}`,
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
        id: `temp-ai-${Date.now()}-${Math.random()}`,
        text: data.reply,
        sender: 'ai',
        timestamp: new Date()
      }];
      scrollToBottom();

    } catch (err) {
      console.error('Error sending message:', err);
      failedMessage = userMessage; // Store for retry
      
      // Provide user-friendly error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        error = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.message && err.message.includes('status: 400')) {
        error = 'Invalid message. Please check your input and try again.';
      } else if (err.message && err.message.includes('status: 429')) {
        error = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.message && err.message.includes('status: 500')) {
        error = 'Server error occurred. Our team has been notified. Please try again later.';
      } else if (err.message && err.message.includes('status: 503')) {
        error = 'Service temporarily unavailable. Please try again in a few moments.';
      } else if (err.message && err.message.includes('NetworkError')) {
        error = 'Network error. Please check your internet connection and try again.';
      } else if (err.message && err.message.includes('timeout')) {
        error = 'Request timed out. The server took too long to respond. Please try again.';
      } else {
        error = 'Sorry, we couldn\'t send your message. Please try again.';
      }
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

<div class="chat-widget">
  <div class="chat-container">
    <div class="chat-header">
      <h1>🛒 Spur Shop - Support Chat</h1>
      <button class="close-button-header" on:click={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="messages" bind:this={messagesContainer}>
      {#if isLoadingHistory}
        <div class="loading-history">
          <div class="loader-spinner"></div>
          <p>Loading conversation history...</p>
        </div>
      {:else if messages.length === 0}
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
      {:else}
        {#each messages as message (message.id)}
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
      {/if}
    </div>

    {#if error}
      <div class="error-banner">
        <span class="error-message">⚠️ {error}</span>
        {#if failedMessage}
          <button class="retry-button" on:click={retryLastMessage} type="button">
            🔄 Retry
          </button>
        {/if}
        <button class="dismiss-button" on:click={() => { error = ''; failedMessage = null; }} type="button">
          ✕
        </button>
      </div>
    {/if}

    <form class="chat-input" on:submit|preventDefault={sendMessage}>
      <div class="input-wrapper">
        <input
          type="text"
          bind:value={inputMessage}
          on:keypress={handleKeyPress}
          placeholder={isLoading ? 'Agent is typing...' : 'Type your message...'}
          disabled={isLoading}
          autocomplete="off"
          maxlength={MAX_MESSAGE_LENGTH}
        />
        {#if inputMessage.length > MAX_MESSAGE_LENGTH * 0.8}
          <div class="char-counter" class:warning={inputMessage.length > MAX_MESSAGE_LENGTH * 0.9}>
            {inputMessage.length}/{MAX_MESSAGE_LENGTH}
          </div>
        {/if}
      </div>
      <button type="submit" disabled={isLoading || !inputMessage.trim()}>
        {isLoading ? '...' : 'Send'}
      </button>
    </form>
  </div>
</div>

<style>
  .chat-widget {
    position: fixed;
    bottom: 100px;
    right: 30px;
    z-index: 1000;
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
    position: relative;
    z-index: 1;
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

  .messages {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #22252f;
    scroll-padding: 20px;
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
    margin: 0;
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
    margin-right: 4px;
  }

  .message.ai {
    align-self: flex-start;
    margin-left: 4px;
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

  .loading-history {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 16px;
  }

  .loading-history p {
    color: #6b6e7a;
    font-size: 14px;
    margin: 0;
  }

  .loader-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f0f1f3;
    border-top: 4px solid #5e5adb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .error-message {
    flex: 1;
    text-align: left;
  }

  .retry-button {
    background: #3fb574;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .retry-button:hover {
    background: #36a066;
  }

  .dismiss-button {
    background: transparent;
    color: #ff6b6b;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
    line-height: 1;
  }

  .dismiss-button:hover {
    background: rgba(255, 107, 107, 0.1);
  }

  .chat-input {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #1a1d2e;
    border-top: 1px solid #2d3040;
    align-items: center;
  }

  .input-wrapper {
    flex: 1;
    position: relative;
    min-width: 0;
    max-width: calc(100% - 94px);
  }

  .char-counter {
    position: absolute;
    right: 18px;
    bottom: 16px;
    font-size: 11px;
    color: #6b6e7a;
    background: #22252f;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .char-counter.warning {
    color: #ffb347;
  }

  .chat-input input {
    width: 100%;
    padding: 14px 18px;
    padding-right: 18px;
    box-sizing: border-box;
    border: 1px solid #353845;
    border-radius: 24px;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    background: #22252f;
    color: #e8e9ed;
  }

  .chat-input input::placeholder {
    color: #a0a3b0;
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
    flex-shrink: 0;
  }

  .chat-input button:hover:not(:disabled) {
    background: #36a066;
  }

  .chat-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

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
  }
</style>
