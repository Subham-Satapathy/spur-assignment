<script>
  export let isChatOpen = false;
  export let onClick;
</script>

<button class="chat-button" on:click={onClick} class:active={isChatOpen}>
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

<style>
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
    z-index: 1002;
  }

  .chat-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(63, 181, 116, 0.6);
  }

  .chat-button.active {
    background: #e74c3c;
    z-index: 1002;
  }

  .chat-button svg {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 640px) {
    .chat-button {
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
    }

    .chat-button.active {
      display: none;
    }
  }
</style>
