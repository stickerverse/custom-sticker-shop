/**
 * Server-side utilities for consistent price calculations
 * This ensures pricing logic is the same between client and server
 */

/**
 * Calculate the price for an item
 * @param item Item with product and options
 * @param quantity Number of items
 * @returns Price in cents
 */
export function calculateItemPrice(item: any, quantity = 1): number {
  // Check for custom unit price first (from customization)
  const customUnitPrice = item.options?.unitPrice ? parseInt(item.options.unitPrice) : null;
  
  // Fall back to product price if no custom price, default to 500 cents ($5.00) if neither available
  const basePrice = customUnitPrice || (item.product?.price || 500);
  
  // Apply option modifiers if available
  let totalPrice = basePrice;
  
  // Apply material multiplier if present
  if (item.options?.materialMultiplier) {
    const multiplier = parseFloat(item.options.materialMultiplier);
    if (!isNaN(multiplier) && multiplier > 0) {
      totalPrice = Math.round(totalPrice * multiplier);
    }
  }
  
  // Apply finish price modifier if present
  if (item.options?.finishPriceModifier) {
    const modifier = parseInt(item.options.finishPriceModifier);
    if (!isNaN(modifier)) {
      totalPrice += modifier;
    }
  }
  
  // Apply complexity multiplier if present
  if (item.options?.complexityMultiplier) {
    const multiplier = parseFloat(item.options.complexityMultiplier);
    if (!isNaN(multiplier) && multiplier > 0) {
      totalPrice = Math.round(totalPrice * multiplier);
    }
  }
  
  // Calculate final price with quantity and ensure we're working with whole cents
  return Math.round(totalPrice * quantity);
}

/**
 * Format price in cents to currency string
 * @param cents Price in cents
 * @param currency Currency code
 * @returns Formatted price string
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}