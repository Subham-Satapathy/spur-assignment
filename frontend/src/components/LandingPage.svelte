<div class="landing-page">
  <header class="hero">
    <div class="hero-content">
      <h1>Spur of the Moment Shop</h1>
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
    background: #000000;
    overscroll-behavior: none;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  .hero {
    padding: 80px 20px;
    text-align: center;
    background: #0a0a0a;
    border-bottom: 1px solid #1a1a1a;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
    flex-shrink: 0;
    position: relative;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .hero-content h1 {
    font-size: 48px;
    color: #ffffff;
    margin: 0 0 20px 0;
    font-weight: 800;
    line-height: 1.2;
  }

  .tagline {
    font-size: 24px;
    color: #ffffff;
    margin: 0 0 10px 0;
    font-weight: 600;
    line-height: 1.3;
  }

  .subtitle {
    font-size: 16px;
    color: #e0e0e0;
    margin: 0;
    line-height: 1.5;
  }

  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 20px;
    flex: 1;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
    margin-bottom: 60px;
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    .features {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
  }

  @media (min-width: 1025px) {
    .features {
      grid-template-columns: repeat(4, 1fr);
      gap: 30px;
    }
  }

  .feature-card {
    background: #0a0a0a;
    padding: 30px;
    border-radius: 16px;
    text-align: center;
    border: 1px solid #1a1a1a;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.02);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .feature-card:hover {
    transform: translateY(-8px);
    border-color: #333333;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  }

  .feature-card:hover::before {
    opacity: 1;
  }

  .feature-card .icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  .feature-card h3 {
    color: #ffffff;
    margin: 0 0 10px 0;
    font-size: 20px;
    font-weight: 600;
  }

  .feature-card p {
    color: #cccccc;
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .products h2 {
    color: #ffffff;
    text-align: center;
    font-size: 36px;
    margin: 0 0 40px 0;
    font-weight: 700;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 20px;
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
  }

  @media (min-width: 1025px) {
    .product-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
  }

  .product-card {
    background: #0a0a0a;
    padding: 30px;
    border-radius: 16px;
    text-align: center;
    border: 1px solid #1a1a1a;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .product-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.02);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .product-card:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: #333333;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  }

  .product-card:hover::before {
    opacity: 1;
  }

  .product-image {
    font-size: 64px;
    margin-bottom: 15px;
  }

  .product-card h4 {
    color: #ffffff;
    margin: 0 0 10px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .product-card p {
    color: #cccccc;
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .footer {
    background: #000000;
    color: #999999;
    text-align: center;
    padding: 30px 20px;
    padding-bottom: 100px;
    margin-top: auto;
    border-top: 1px solid #1a1a1a;
  }

  .footer p {
    margin: 0;
    font-size: 14px;
  }

  @media (max-width: 640px) {
    .hero {
      padding: 50px 16px;
    }

    .hero-content h1 {
      font-size: 32px;
      margin: 0 0 16px 0;
    }

    .tagline {
      font-size: 18px;
      margin: 0 0 12px 0;
    }

    .subtitle {
      font-size: 15px;
    }

    .main-content {
      padding: 40px 16px;
    }

    .features {
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 40px;
    }

    .feature-card {
      padding: 24px;
    }

    .feature-card .icon {
      font-size: 40px;
    }

    .products h2 {
      font-size: 28px;
      margin: 0 0 30px 0;
    }

    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .product-card {
      padding: 20px;
    }

    .product-image {
      font-size: 48px;
    }

    .footer {
      padding: 24px 16px;
      padding-bottom: 90px;
      margin-top: auto;
      font-size: 13px;
    }
  }

  @media (min-width: 768px) {
    .hero-content h1 {
      font-size: 64px;
    }

    .tagline {
      font-size: 28px;
    }

    .subtitle {
      font-size: 18px;
    }
  }
</style>
