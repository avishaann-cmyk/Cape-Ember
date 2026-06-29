# Cape Ember Coffee Co. - Premium E-Commerce

## Original Problem Statement
Transform Cape Ember Coffee Co. into a premium, production-ready eCommerce experience that rivals and exceeds Shopify. The website should feel: Premium, Luxury, Warm, Modern, Elegant, Minimal, South African, Artisan.

## Critical Brand Positioning
**Cape Ember Coffee Co. is NOT a coffee roastery.**
- Cape Ember Coffee Co. **partners with experienced South African coffee roasters** to create exceptional coffees inspired by South Africa's landscapes
- Our focus is creating **memorable coffee experiences** that allow customers to explore South Africa from home, one cup at a time
- Every blend represents a **real South African destination** and is crafted to capture the feeling, beauty and character of that place

### ❌ DO NOT Use:
- "10 Years of Roasting"
- "We roast the coffee ourselves"
- Any fabricated history or unverifiable claims
- "Freshly Roasted within 48 hours"

### ✅ Use Instead:
- "Partners with experienced South African roasters"
- "Small-batch freshness"
- "Landscape inspired"
- "Premium coffee inspired by South African landscapes"

## Brand Guidelines
- **Logo**: Flame logo only (copper/gold gradient) with "Cape Ember" heading + "COFFEE CO." subtext
- **Colors**: Warm earthy tones - Background #FDFBF7, Primary #D05C23, Copper #C86333, Wood #8A5A44, Text #2C1A12
- **Typography**: Cormorant Garamond (serif) for headings, Outfit (sans-serif) for body
- **Feel**: Handcrafted, premium, South African coffee experience

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, Phosphor Icons
- **Backend**: FastAPI, MongoDB
- **Payments**: PayFast (LIVE), Stitch (pending credentials)
- **Hosting**: Emergent Platform

---

## Phase Completion Status

### ✅ Phase 1: Foundation & Branding (COMPLETE - June 27, 2026)
- [x] Premium design system (CSS variables, animations)
- [x] Flame logo + "Cape Ember Coffee Co." header branding
- [x] Sticky header with glassmorphism (shrinks on scroll)
- [x] Navigation: Shop, Our Story, Subscribe, Brew Guide + Search, Wishlist, Account, Cart
- [x] Luxury homepage hero with "Experience South Africa in Every Cup"
- [x] Products section with premium cards (roast tags, hover effects)
- [x] "From Landscape to Cup" story section (partnership messaging)
- [x] Customer testimonials with star ratings
- [x] Newsletter subscription section ("Join the Ember Circle")
- [x] Trust badges (Secure Checkout, Small-Batch Quality, Proudly South African, Nationwide Delivery)
- [x] Premium footer with logo, links, contact, WhatsApp CTA
- [x] Mobile responsive design
- [x] Cormorant Garamond + Outfit fonts
- [x] Framer Motion animations
- [x] Phosphor Icons

### ✅ Phase 2: Product Experience (COMPLETE - June 27, 2026)
- [x] Enhanced product pages with image gallery and zoom
- [x] Variant selection (Size & Grind options with prices)
- [x] Strength meter component with visual dots
- [x] Tasting notes with flavor intensity bars
- [x] Brewing guide tab with method cards (Ratio/Time/Temp)
- [x] Reviews tab with star ratings (MOCKED - backend needed)
- [x] Origin & Processing info display
- [x] Stock availability status with checkmark
- [x] Related products "You May Also Like" section
- [x] Breadcrumb navigation
- [x] Shop page advanced filtering (Category, Roast, Strength, Price)
- [x] Shop page search with live filtering
- [x] Shop page sorting (Featured, Price, Name, Newest)
- [x] Shop page grid/list view toggle
- [x] Active filter tags with clear option
- [x] Mobile filters drawer

### ✅ Phase 3: Checkout & Payments (COMPLETE - June 27, 2026)
- [x] Persistent cart with items, quantities, and totals
- [x] Coupon code input with Apply/Remove functionality
- [x] Free shipping progress bar (threshold R399)
- [x] "You've unlocked free shipping!" success message
- [x] VAT display (15% inclusive, South African model)
- [x] Upsell products section ("You Might Also Like")
- [x] Order summary sidebar with all totals
- [x] Guest checkout option with email input
- [x] Multi-step checkout (Information → Shipping → Payment)
- [x] Shipping address form with SA province dropdown
- [x] Order notes textarea
- [x] Subscribe & Save 15% option with frequency selector
- [x] PayFast payment integration (LIVE)
- [x] Test coupon: WELCOME10 (10% off, min R100)

### ✅ Phase 4: Customer & Admin (COMPLETE - June 27, 2026)
- [x] Admin Dashboard with revenue stats (Today, Week, Month, All Time)
- [x] Admin Orders management (list, filter, detail view, status updates)
- [x] Admin Customers list (search, order count, total spent)
- [x] Admin Inventory management (stock levels, low stock alerts, inline edit)
- [x] Admin Coupons management (create, delete, list with validity)
- [x] Admin authentication check (is_admin flag)
- [x] Admin user seeded on startup (admin@capeember.co.za)
- [ ] Customer wishlist (backend exists, frontend needs enhancement)
- [ ] Customer order history page

### ✅ Bug Fix: Cart Update/Delete (CRITICAL - June 29, 2026)
- [x] Fixed CartContext API endpoints (was using wrong URLs)
- [x] updateQuantity now calls PUT /api/cart/items/{item_id}
- [x] removeFromCart now calls DELETE /api/cart/items/{item_id}
- [x] Added proper Authorization + X-Session-ID headers
- [x] Fixed Order Summary to use backend-computed discount/total
- [x] Unified shipping cost (R65) between frontend and backend
- [x] Cart update (+/- quantity) verified working
- [x] Cart delete (trash icon) verified working
- [x] Coupon application and removal verified working

- [ ] Customer saved addresses management

### 🔲 Phase 5: SEO, Performance & Marketing
- [ ] Complete metadata and schema markup
- [ ] XML Sitemap generation
- [ ] Core Web Vitals optimization (target 95+)
- [ ] Image lazy loading and optimization
- [ ] Google Analytics 4 integration
- [ ] Meta Pixel integration
- [ ] Newsletter integration
- [ ] Abandoned cart recovery

---

## Copywriting Audit (COMPLETE - June 27, 2026)

### ✅ Homepage Updates
- Hero: "Experience South Africa in Every Cup" (removed "Roasted with Passion")
- Subtext: "From the wild fynbos coast to the vast Karoo plains — Cape Ember Coffee Co. brings together coffee, landscape, and ritual in one refined collection."
- CTAs: "Discover the Landscape Bundle" + "Explore Individual Blends"
- Features Strip: Small-Batch Freshness, Complimentary Delivery, Landscape Inspired, Proudly South African
- Story Section: "From Landscape to Cup" (removed "10+ Years of Excellence")
- Story Text: "Cape Ember Coffee Co. partners with experienced South African coffee roasters..."
- Newsletter: "Join the Ember Circle" + "Stay Close to New Roasts and Offers"
- Trust Badges: Secure Checkout, Small-Batch Quality, Proudly South African, Nationwide Delivery

### ✅ About Page Updates
- Hero: "Cape Ember Coffee Co. partners with experienced South African coffee roasters..."
- Story: Removed "roast them in small batches at our Cape Town roastery"
- Values: Quality First (partner with roasters), Landscape Inspired, Proudly South African, Coffee Experiences
- CTA: "Discover the Landscape Bundle"

### ✅ Subscriptions Page Updates
- Header: "The Ember Circle" (was "Subscribe & Save")
- Benefits: "Complimentary delivery" (was "Free delivery")
- FAQ: "Complimentary delivery on subscriptions", "fortnightly" (was "bi-weekly")

### ✅ Footer Updates
- Tagline: "Premium coffee inspired by South African landscapes. Experience the beauty of the Cape in every cup."

### ✅ Product Descriptions Updated (June 27, 2026)
- Fynbos Roast: "Inspired by the wild fynbos of the Cape Peninsula..."
- Garden Route Blend: "A tribute to South Africa's iconic Garden Route coast..."
- Ember Reserve: "Inspired by the rugged grandeur of the Drakensberg mountains..."
- Karoo Horizon: "From the vast, open plains of the Great Karoo..."
- Landscape Bundle: "Experience the complete Cape Ember journey..."
- All origins now show "South African Roasted" (removed specific country origins)

### ✅ Homepage Story Carousel (June 27, 2026)
- Added landscape image carousel with 5 South African images
- Auto-rotation every 5 seconds
- Navigation arrows on hover
- Dot indicators for manual navigation
- Location caption overlay (The Karoo, Karoo Horizon, Wild Coast, Garden Route, Wilderness)

---

## Payment Configuration

### PayFast (LIVE - Active)
- Merchant ID: 34064005
- Merchant Key: nfvifv037umoe
- Mode: Production
- Status: ✅ Working

### Stitch Payments (Pending)
- Client ID: test-383431e2-27c6-4550-8188-d403bb6d8e22
- Status: ❌ Credentials returning "invalid_client"
- Action: Contact Stitch support

---

## Key Files
- `/app/frontend/src/index.css` - Premium design system
- `/app/frontend/src/components/Navbar.js` - Premium header
- `/app/frontend/src/pages/HomePage.js` - Luxury homepage
- `/app/frontend/src/components/ProductCard.js` - Premium product cards
- `/app/frontend/src/components/Footer.js` - Premium footer
- `/app/design_guidelines.json` - Design tokens

---

## Next Tasks
1. **P2**: Email Templates Rewrite (Order Confirmation, Shipping, Welcome)
2. **P2**: SEO Enhancements - Add product-specific schema, sitemap
3. **P2**: Customer order history page enhancement
4. **P3**: Stitch Payments Integration (pending valid credentials)
