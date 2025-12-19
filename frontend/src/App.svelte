<script>
  import LandingPage from './components/LandingPage.svelte';
  import ChatWidget from './components/ChatWidget.svelte';
  import ChatButton from './components/ChatButton.svelte';

  let isChatOpen = false;

  function toggleChat() {
    isChatOpen = !isChatOpen;
  }
</script>

<LandingPage />
<ChatButton {isChatOpen} onClick={toggleChat} />
{#if isChatOpen}
  <ChatWidget {isChatOpen} onClose={toggleChat} />
{/if}

<style>
  :global(html) {
    overscroll-behavior: none;
    overscroll-behavior-y: none;
    background: #1a1d2e;
    overflow-x: hidden;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background: #1a1d2e;
    min-height: 100vh;
    overscroll-behavior: none;
    overscroll-behavior-y: none;
    overflow-x: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
</style>
