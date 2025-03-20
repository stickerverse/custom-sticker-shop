import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function to get the correct price for an item
 * Consistently handles price calculations across the application
 * 
 * @param item Cart item or product with price information
 * @param quantity Quantity of items (default: 1)
 * @returns Price in cents, rounded to whole numbers
 */
export function calculateItemPrice(item: any, quantity = 1) {
  // Check for custom unit price first (from customization)
  const customUnitPrice = item.options?.unitPrice ? parseInt(item.options.unitPrice) : null;
  
  // Fall back to product price if no custom price
  const productPrice = item.price || (item.product?.price);
  
  // Default to 500 cents ($5.00) if neither custom price nor product price available
  const unitPrice = customUnitPrice || productPrice || 500;
  
  // Use Math.round to ensure we're working with whole cents (no fractional cents)
  return Math.round(unitPrice * quantity);
}

/**
 * Formats a price in cents to a currency string
 * 
 * @param cents Price in cents
 * @param currency Currency code (default: USD)
 * @returns Formatted price string (e.g., "$5.00")
 */
export function formatCurrency(cents: number, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(cents / 100);
}
