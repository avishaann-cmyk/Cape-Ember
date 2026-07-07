/**
 * Accessibility and Performance Utilities
 */

// Set page title and meta description for SEO
export const setPageMeta = (title, description, image) => {
  // Update title
  document.title = title;
  
  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = description;
  }
  
  // Update OG tags for social sharing
  if (image) {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.content = image;
    }
  }
};

// Improve image loading performance
export const getOptimizedImageUrl = (url, width = 'auto', quality = 75) => {
  if (!url) return null;
  
  // If using Unsplash or similar CDN with params support
  if (url.includes('unsplash.com')) {
    return `${url}?w=${width}&q=${quality}&auto=format`;
  }
  
  // For custom URLs, suggest lazy loading in component
  return url;
};

// Announce dynamic content changes for screen readers
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    announcement.remove();
  }, 3000);
};

// Format price for accessibility
export const formatPriceAccessible = (price) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(price);
};

// Create skip to main content link functionality
export const addSkipLink = () => {
  const skipLink = document.querySelector('a.skip-to-main');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.querySelector('main');
      main?.focus();
      main?.scrollIntoView({ behavior: 'smooth' });
    });
  }
};

export default {
  setPageMeta,
  getOptimizedImageUrl,
  announceToScreenReader,
  formatPriceAccessible,
  addSkipLink
};
