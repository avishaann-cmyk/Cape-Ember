const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('build/index.html not found. Run build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexPath, 'utf8');

const products = [
  {
    slug: 'fynbos-roast',
    name: 'Fynbos Roast',
    price: '149.00',
    weight: '250g',
    roast: 'Brazil Medium Roast',
    tasting: 'Smooth, Nutty, Balanced',
    story: 'Inspired by Cape fynbos landscapes, this cup is calm, smooth, and balanced for daily brewing.',
    grind: '250g Whole Bean | 250g Ground',
    stock: 'In stock',
    shipping: 'Nationwide shipping across South Africa. Free shipping over R399.',
    description: 'Fynbos Roast, 250g at R149. Brazil Medium Roast with smooth, nutty, balanced notes.',
    image: 'https://capeembercoffee.co.za/products/fynbos-roast'
  },
  {
    slug: 'garden-route-blend',
    name: 'Garden Route Blend',
    price: '149.00',
    weight: '250g',
    roast: 'Medium Roast',
    tasting: 'Smooth, Cocoa, Gentle Citrus',
    story: 'A coastal-inspired blend with mellow body and cocoa depth, crafted for all-day drinking.',
    grind: '250g Whole Bean | 250g Ground',
    stock: 'In stock',
    shipping: 'Nationwide shipping across South Africa. Free shipping over R399.',
    description: 'Garden Route Blend, 250g at R149. Medium Roast with smooth cocoa and gentle citrus.',
    image: 'https://capeembercoffee.co.za/products/garden-route-blend'
  },
  {
    slug: 'karoo-horizon',
    name: 'Karoo Horizon',
    price: '169.00',
    weight: '250g',
    roast: 'Light Roast',
    tasting: 'Floral, Blueberry, Bright',
    story: 'A bright landscape-inspired profile that highlights florals and blueberry sweetness.',
    grind: '250g Whole Bean | 250g Ground',
    stock: 'In stock',
    shipping: 'Nationwide shipping across South Africa. Free shipping over R399.',
    description: 'Karoo Horizon, 250g at R169. Light Roast with floral, blueberry, bright character.',
    image: 'https://capeembercoffee.co.za/products/karoo-horizon'
  },
  {
    slug: 'ember-reserve',
    name: 'Ember Reserve',
    price: '169.00',
    weight: '250g',
    roast: 'Colombia Dark Roast',
    tasting: 'Rich, Dark Chocolate, Intense',
    story: 'Our bold dark profile with deep chocolate intensity, built for espresso and rich brews.',
    grind: '250g Whole Bean | 250g Ground',
    stock: 'In stock',
    shipping: 'Nationwide shipping across South Africa. Free shipping over R399.',
    description: 'Ember Reserve, 250g at R169. Colombia Dark Roast with rich dark chocolate intensity.',
    image: 'https://capeembercoffee.co.za/products/ember-reserve'
  }
];

const pageConfigs = [
  {
    route: '/',
    title: 'Cape Ember Coffee Co. | South African Landscapes in Every Cup',
    description: 'Premium coffee crafted with trusted roasting partners. Shop Fynbos Roast, Garden Route Blend, Karoo Horizon, and Ember Reserve.',
    canonical: 'https://capeembercoffee.co.za/',
    type: 'website',
    html: '<h1>Cape Ember Coffee Co.</h1><p>South African landscapes in every cup. Crafted with trusted roasting partners.</p>' +
      '<ul><li>Fynbos Roast - 250g - R149</li><li>Garden Route Blend - 250g - R149</li><li>Karoo Horizon - 250g - R169</li><li>Ember Reserve - 250g - R169</li></ul>',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Cape Ember Coffee Co.',
      url: 'https://capeembercoffee.co.za',
      description: 'Premium coffee crafted with trusted roasting partners and inspired by South African landscapes.'
    }
  },
  {
    route: '/shop',
    title: 'Shop Premium Coffee | Cape Ember Coffee Co.',
    description: 'Shop four core coffees with consistent pricing, roast profiles, and grind options.',
    canonical: 'https://capeembercoffee.co.za/shop',
    type: 'website',
    html: '<h1>Shop Cape Ember Coffee</h1><p>Four core products only, with consistent pricing and profile details.</p>',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Cape Ember Coffee Shop',
      url: 'https://capeembercoffee.co.za/shop'
    }
  },
  {
    route: '/about',
    title: 'About Cape Ember Coffee Co. | Crafted With Trusted Roasting Partners',
    description: 'Learn how Cape Ember brings South African landscapes into every cup through trusted roasting partners.',
    canonical: 'https://capeembercoffee.co.za/about',
    type: 'article',
    html: '<h1>About Cape Ember Coffee Co.</h1><p>We are not a roastery. Our coffee is small-batch roasted by trusted partners.</p>',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Cape Ember Coffee Co.',
      url: 'https://capeembercoffee.co.za/about'
    }
  },
  {
    route: '/contact',
    title: 'Contact Cape Ember Coffee Co.',
    description: 'Contact Cape Ember for order support, coffee recommendations, and delivery help.',
    canonical: 'https://capeembercoffee.co.za/contact',
    type: 'website',
    html: '<h1>Contact Cape Ember Coffee Co.</h1><p>Reach us for order support and coffee guidance.</p>',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Cape Ember Coffee Co.',
      url: 'https://capeembercoffee.co.za/contact'
    }
  }
];

products.forEach((product) => {
  pageConfigs.push({
    route: `/products/${product.slug}`,
    title: `${product.name} | Cape Ember Coffee Co.`,
    description: product.description,
    canonical: `https://capeembercoffee.co.za/products/${product.slug}`,
    type: 'product',
    html: [
      `<h1>${product.name}</h1>`,
      `<p>Price: R${product.price}</p>`,
      `<p>Weight: ${product.weight}</p>`,
      `<p>Roast Level: ${product.roast}</p>`,
      `<p>Tasting Notes: ${product.tasting}</p>`,
      `<p>Product Story: ${product.story}</p>`,
      `<p>Grind Options: ${product.grind}</p>`,
      `<p>Stock Status: ${product.stock}</p>`,
      `<p>Shipping Note: ${product.shipping}</p>`,
      '<p>Add to Cart CTA: Add to Cart</p>'
    ].join(''),
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      sku: product.slug,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'ZAR',
        price: product.price,
        availability: 'https://schema.org/InStock',
        url: `https://capeembercoffee.co.za/products/${product.slug}`
      }
    }
  });
});

const upsertTag = (html, regex, replacement) => {
  if (regex.test(html)) {
    return html.replace(regex, replacement);
  }
  return html.replace('</head>', `  ${replacement}\n</head>`);
};

const updateSeoHtml = (config) => {
  let html = baseHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${config.title}</title>`);
  html = upsertTag(
    html,
    /<meta name="title"[^>]*>/i,
    `<meta name="title" content="${config.title}" />`
  );
  html = upsertTag(
    html,
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${config.description}" />`
  );
  html = upsertTag(
    html,
    /<meta property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${config.title}" />`
  );
  html = upsertTag(
    html,
    /<meta property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${config.description}" />`
  );
  html = upsertTag(
    html,
    /<meta property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${config.canonical}" />`
  );
  html = upsertTag(
    html,
    /<meta property="og:type"[^>]*>/i,
    `<meta property="og:type" content="${config.type}" />`
  );
  html = upsertTag(
    html,
    /<meta property="twitter:title"[^>]*>/i,
    `<meta property="twitter:title" content="${config.title}" />`
  );
  html = upsertTag(
    html,
    /<meta property="twitter:description"[^>]*>/i,
    `<meta property="twitter:description" content="${config.description}" />`
  );
  html = upsertTag(
    html,
    /<meta property="twitter:url"[^>]*>/i,
    `<meta property="twitter:url" content="${config.canonical}" />`
  );
  html = upsertTag(
    html,
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${config.canonical}" />`
  );

  html = upsertTag(
    html,
    /<meta name="robots"[^>]*>/i,
    '<meta name="robots" content="index, follow" />'
  );

  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">${JSON.stringify(config.schema)}</script>`
  );

  const seoBlock = `<div id="seo-static-content" style="display:none">${config.html}</div>`;
  if (html.includes('<div id="seo-static-content"')) {
    html = html.replace(/<div id="seo-static-content"[\s\S]*?<\/div>/i, seoBlock);
  } else {
    html = html.replace('<div id="root"></div>', `${seoBlock}\n        <div id="root"></div>`);
  }

  return html;
};

const writePage = (route, html) => {
  if (route === '/') {
    fs.writeFileSync(indexPath, html, 'utf8');
    return;
  }

  const cleanRoute = route.replace(/^\//, '');
  const filePath = path.join(buildDir, cleanRoute, 'index.html');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
};

pageConfigs.forEach((config) => {
  const pageHtml = updateSeoHtml(config);
  writePage(config.route, pageHtml);
});

console.log(`Generated ${pageConfigs.length} SEO static route pages.`);
