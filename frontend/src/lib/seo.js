const upsertMeta = (selector, attributes) => {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });
};

const upsertCanonical = (url) => {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    document.head.appendChild(node);
  }
  node.setAttribute('href', url);
};

export const setPageSEO = ({ title, description, canonicalPath, image, type = 'website' }) => {
  if (title) {
    document.title = title;
    upsertMeta('meta[name="title"]', { name: 'title', content: title });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="twitter:title"]', { property: 'twitter:title', content: title });
  }

  if (description) {
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="twitter:description"]', { property: 'twitter:description', content: description });
  }

  if (canonicalPath) {
    const canonicalUrl = `https://capeembercoffee.co.za${canonicalPath}`;
    upsertCanonical(canonicalUrl);
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="twitter:url"]', { property: 'twitter:url', content: canonicalUrl });
  }

  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });

  if (image) {
    const absoluteImage = image.startsWith('http')
      ? image
      : `https://capeembercoffee.co.za${image.startsWith('/') ? image : `/${image}`}`;
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: absoluteImage });
    upsertMeta('meta[property="twitter:image"]', { property: 'twitter:image', content: absoluteImage });
  }
};
