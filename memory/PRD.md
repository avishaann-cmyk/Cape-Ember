# Cape Ember Coffee Co. - E-commerce Platform PRD

## Original Problem Statement
Build a premium Cape Ember Coffee e-commerce website inspired by capeembercoffee.co.za with:
- PayFast payment integration (South African payment gateway)
- User accounts with order history
- Subscription/recurring orders
- WhatsApp order notifications
- AI product recommendations

## Architecture

### Tech Stack
- **Frontend**: React 19, TailwindCSS, Radix UI components
- **Backend**: FastAPI (Python), Motor (async MongoDB driver)
- **Database**: MongoDB
- **Payments**: PayFast (sandbox mode)
- **AI**: OpenAI GPT-4o via Emergent LLM Key

### File Structure
```
/app
├── backend/
│   ├── server.py         # Main FastAPI application
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main app with routing
│   │   ├── contexts/     # AuthContext, CartContext
│   │   ├── components/   # Navbar, Footer, ProductCard, AuthModal
│   │   └── pages/        # Home, Shop, Product, Cart, Checkout, Account, etc.
│   └── .env
└── design_guidelines.json # Design system
```

## User Personas
1. **Coffee Enthusiast**: Wants premium SA coffee, values quality and origin story
2. **Subscription Customer**: Needs regular delivery, wants convenience
3. **Gift Buyer**: Looking for bundles and gift options

## Core Requirements (Static)
- [x] Product catalog with 4 individual blends + 1 bundle
- [x] User authentication (register/login with JWT)
- [x] Shopping cart with quantity management
- [x] Checkout with PayFast payment
- [x] Order management and history
- [x] Subscription system (weekly/biweekly/monthly)
- [x] WhatsApp integration for notifications
- [x] AI product recommendations
- [x] Newsletter subscription
- [x] Responsive design with SA-inspired aesthetic

## What's Been Implemented (Jan 2026)

### Product Images Updated (Jan 2026)
- Integrated real Cape Ember product photography:
  - Fynbos Roast - Medium Roast from Brazil
  - Garden Route Blend - House Blend
  - Ember Reserve - Premium Dark Roast from Colombia
  - Karoo Horizon - Limited Release Light Roast from Ethiopia
  - Landscape Bundle - All 4 blends with mountain backdrop
- AI-generated lifestyle backgrounds for hero sections:
  - Homepage: Dramatic Drakensberg mountain scene (Ember Reserve style)
  - About Page: Karoo desert sunrise landscape
  - Generated backgrounds served from /api/images/products/{product_id}
- Product cards use actual branded packaging photos

### Backend API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product details
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/{id}` - Remove from cart
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `POST /api/payfast/create-payment` - Generate PayFast payment
- `POST /api/payfast/itn` - PayFast ITN webhook
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - Get user subscriptions
- `PUT /api/subscriptions/{id}/pause` - Pause subscription
- `PUT /api/subscriptions/{id}/resume` - Resume subscription
- `DELETE /api/subscriptions/{id}` - Cancel subscription
- `POST /api/recommendations` - AI recommendations
- `POST /api/newsletter/subscribe` - Newsletter signup

### Frontend Pages
- Homepage with hero, featured bundle, product grid, features
- Shop page with product filtering
- Product detail page with quantity selector
- Cart page with item management
- Checkout page with shipping form and PayFast integration
- Payment success/cancel pages
- Account page with orders, subscriptions, profile tabs
- Subscriptions page with FAQ
- About page with brand story

### Design System
- Theme: Organic & Earthy (Light)
- Primary: Terracotta (#A94826)
- Background: #FAFAF7
- Typography: Cormorant Garamond (headings) + Manrope (body)
- Sharp edges, minimal shadows, subtle animations

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Complete e-commerce flow
- [x] Payment integration (PayFast LIVE mode)
- [x] User authentication
- [x] Real product images integrated
- [x] Frontend-Backend API compatibility (fixed June 2026)

### P1 (Important)
- [ ] Stitch Payments integration (second payment gateway)
- [ ] Enhanced Product Catalog (categories, filters, sorting, search)
- [ ] Advanced Checkout Flow (guest checkout, shipping details, coupons, VAT)
- [ ] Admin Dashboard (sales analytics, order management, inventory, user roles)
- [ ] Enhanced Product Pages (image gallery, tasting notes, reviews)

### P2 (Nice to Have)
- [ ] Customer Accounts Expansion (order history, saved addresses, wishlist, reorder)
- [ ] Marketing & SEO (newsletter, abandoned cart, Meta Pixel, sitemap)
- [ ] Product reviews and ratings
- [ ] Discount codes / coupons
- [ ] Inventory management
- [ ] Social login (Google)

### P3 (Future)
- [ ] Mobile app (React Native)
- [ ] Loyalty program
- [ ] Gift cards
- [ ] Multi-language support (Afrikaans)
- [ ] Security & Performance Optimizations (CSRF, XSS, rate limiting, lazy loading)

## Changelog

### June 27, 2026
- **Bug Fix**: Fixed 500 Server Error caused by frontend-backend API mismatch
  - Updated HomePage, ShopPage, ProductDetailPage, SubscriptionsPage to handle new API response format `{products: [...]}`
  - Updated ProductCard component to use `images` array instead of `image_url`
  - Added `getImageUrl` helper functions to extract primary image from images array
  - Added `productWeight` helper to get weight from variants array

## Next Tasks
1. Implement Stitch Payments as second payment gateway (playbook available)
2. Build Admin Dashboard for order management
3. Add product categories and filtering
4. Enhanced checkout with VAT calculation
