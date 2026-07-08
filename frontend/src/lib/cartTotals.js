export const DEFAULT_CART_RULES = {
  freeShippingThreshold: 399,
  shippingCost: 75,
  vatRate: 0.15,
};

export const computeCartTotals = (cart, rules = DEFAULT_CART_RULES) => {
  const items = cart?.items || [];
  const subtotal = Number(
    cart?.subtotal ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );

  const discount = Number(cart?.discount ?? 0);
  const shipping = Number(
    cart?.shipping ?? (subtotal >= rules.freeShippingThreshold ? 0 : rules.shippingCost)
  );

  const totalBeforeVatExtraction = subtotal - discount + shipping;
  const vat = Number(cart?.vat ?? (totalBeforeVatExtraction * rules.vatRate / (1 + rules.vatRate)));
  const total = Number(cart?.total ?? totalBeforeVatExtraction);

  return {
    subtotal,
    discount,
    shipping,
    vat,
    total,
    itemCount: Number(cart?.item_count ?? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)),
  };
};
