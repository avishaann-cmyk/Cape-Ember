/**
 * Cape Ember Coffee Co. — Central asset registry
 *
 * All production image paths are defined here. Components import from this
 * file so path changes only need to happen in one place.
 *
 * Public-folder assets are served at the root in Create React App, so URLs
 * start with /assets/cape-ember/...
 *
 * IMPORTANT: The Fynbos lifestyle image contains the phrase "From our roastery"
 * as printed text inside the artwork. That phrase must NOT appear in any website
 * copy, alt text, captions or metadata — only the supplied image itself.
 */

const BASE = '/assets/cape-ember';

export const ASSETS = {
  // ── Lifestyle / hero images ───────────────────────────────────────────────
  fynbosLifestyle: {
    src: `${BASE}/cape-ember-fynbos-lifestyle.jpeg`,
    alt: 'Cape Ember Fynbos Roast surrounded by indigenous South African fynbos',
    width: 1080,
    height: 1080,
    link: '/products/fynbos-roast',
  },
  gardenRouteLifestyle: {
    src: `${BASE}/cape-ember-garden-route-lifestyle.jpeg`,
    alt: 'Cape Ember Garden Route Blend overlooking a South African coastal landscape',
    width: 1080,
    height: 1080,
    link: '/products/garden-route-blend',
  },
  emberReserveLifestyle: {
    src: `${BASE}/cape-ember-ember-reserve-lifestyle.jpeg`,
    alt: 'Cape Ember Ember Reserve dark roast inspired by South African mountain valleys',
    width: 1080,
    height: 1080,
    link: '/products/ember-reserve',
  },
  karooHorizonLifestyle: {
    src: `${BASE}/cape-ember-karoo-horizon-lifestyle.jpeg`,
    alt: 'Cape Ember Karoo Horizon coffee inspired by the open Karoo landscape',
    width: 1080,
    height: 1080,
    link: '/products/karoo-horizon',
  },

  // ── Collection / bundle images ────────────────────────────────────────────
  fourProductCollection: {
    src: `${BASE}/cape-ember-four-product-collection.jpeg`,
    alt: 'Cape Ember Coffee Co. collection of four landscape-inspired coffee bags',
    width: 1080,
    height: 1080,
    link: '/shop',
  },
  landscapeBundleBanner: {
    src: `${BASE}/cape-ember-landscape-bundle-banner.jpeg`,
    alt: 'Cape Ember Coffee Co. Landscape Range featuring four South African landscape-inspired coffees',
    width: 1080,
    height: 1080,
    link: '/products/landscape-bundle',
  },
};

/**
 * Ordered list used by the story carousel and any image slider component.
 */
export const LANDSCAPE_CAROUSEL = [
  ASSETS.fynbosLifestyle,
  ASSETS.gardenRouteLifestyle,
  ASSETS.karooHorizonLifestyle,
  ASSETS.emberReserveLifestyle,
];

/**
 * Per-product image lookup keyed by product ID.
 */
export const PRODUCT_IMAGES = {
  'fynbos-roast': ASSETS.fynbosLifestyle,
  'garden-route': ASSETS.gardenRouteLifestyle,
  'garden-route-blend': ASSETS.gardenRouteLifestyle,
  'ember-reserve': ASSETS.emberReserveLifestyle,
  'karoo-horizon': ASSETS.karooHorizonLifestyle,
  'landscape-bundle': ASSETS.landscapeBundleBanner,
};
