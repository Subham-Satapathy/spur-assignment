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

<style>
  .landing-page {
    min-height: 100vh;
    height: 100%;
    background: #1a1d2e;
    overscroll-behavior: none;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
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

  @media (max-width: 640px) {
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
