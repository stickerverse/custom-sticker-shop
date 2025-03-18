import axios from 'axios';
import { Product, InsertProduct } from '../../shared/schema';
import { storage } from '../storage';

// eBay API configuration
const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_SECRET = process.env.EBAY_SECRET;
const EBAY_SANDBOX_API_URL = 'https://api.sandbox.ebay.com';

// Token storage
let ebayToken: string | null = null;
let tokenExpiration: Date | null = null;

/**
 * Get OAuth token for eBay API
 */
async function getEbayToken(): Promise<string> {
  // Check if we have a valid token already
  if (ebayToken && tokenExpiration && new Date() < tokenExpiration) {
    return ebayToken;
  }

  try {
    const response = await axios({
      method: 'post',
      url: `${EBAY_SANDBOX_API_URL}/identity/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${EBAY_APP_ID || ''}:${EBAY_SECRET || ''}`).toString('base64')}`
      },
      data: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    // Store token and expiration
    ebayToken = response.data.access_token;
    const expiresIn = response.data.expires_in;
    tokenExpiration = new Date(Date.now() + expiresIn * 1000);
    
    return ebayToken || '';
  } catch (error) {
    console.error('Error getting eBay token:', error);
    throw new Error('Failed to authenticate with eBay API');
  }
}

/**
 * Get products from eBay account
 */
export async function getEbayProducts(): Promise<any[]> {
  try {
    const token = await getEbayToken();
    
    // For sandbox testing, we'll fetch "GetMyeBayBuying"
    const response = await axios({
      method: 'get',
      url: `${EBAY_SANDBOX_API_URL}/buy/browse/v1/item_summary/search?q=stickers&limit=10`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    return response.data.itemSummaries || [];
  } catch (error) {
    console.error('Error fetching eBay products:', error);
    throw new Error('Failed to fetch products from eBay');
  }
}

/**
 * Import products from eBay to our application
 */
export async function importEbayProductsToApp(): Promise<Product[]> {
  try {
    const ebayProducts = await getEbayProducts();
    const importedProducts: Product[] = [];
    
    for (const ebayProduct of ebayProducts) {
      // Convert eBay product format to our application format
      const insertProduct: InsertProduct = {
        title: ebayProduct.title,
        description: ebayProduct.shortDescription || ebayProduct.title,
        price: parseFloat(ebayProduct.price?.value) || 5.99,
        imageUrl: ebayProduct.image?.imageUrl || 'https://via.placeholder.com/300',
        categoryId: 1, // Default category
      };
      
      // Add product to our database
      const product = await storage.createProduct(insertProduct);
      importedProducts.push(product);
      
      // Add default options for the product
      const options = [
        { optionType: 'size', optionValue: 'small', priceModifier: 0.00 },
        { optionType: 'size', optionValue: 'medium', priceModifier: 2.00 },
        { optionType: 'size', optionValue: 'large', priceModifier: 4.00 },
        { optionType: 'material', optionValue: 'matte', priceModifier: 0.00 },
        { optionType: 'material', optionValue: 'glossy', priceModifier: 1.00 },
        { optionType: 'shape', optionValue: 'rectangle', priceModifier: 0.00 },
        { optionType: 'shape', optionValue: 'circle', priceModifier: 0.50 },
        { optionType: 'shape', optionValue: 'custom', priceModifier: 1.50 },
      ];
      
      // Note: In a real implementation, you would save these options to the database
      // This would need to be implemented in the storage.ts file
    }
    
    return importedProducts;
  } catch (error) {
    console.error('Error importing eBay products:', error);
    throw new Error('Failed to import products from eBay');
  }
}

/**
 * Fallback function to simulate eBay products if the API isn't working
 * This is for development and testing purposes only
 */
export async function getSimulatedEbayProducts(): Promise<Product[]> {
  // Create sample products based on typical eBay sticker listings
  const products: Product[] = [];
  
  // Use the storage function to actually create these products
  const product1 = await storage.createProduct({
    title: 'Custom Vinyl Name Decal',
    description: 'Personalized name sticker for laptops, water bottles and more. Available in various colors and sizes.',
    price: 7.99,
    imageUrl: 'https://i.imgur.com/1FZcQQk.jpg',
    categoryId: 1
  });
  products.push(product1);
  
  const product2 = await storage.createProduct({
    title: 'Waterproof Laptop Sticker Pack',
    description: 'Set of 50 trendy waterproof vinyl stickers. Perfect for laptops, skateboards, and luggage.',
    price: 12.99,
    imageUrl: 'https://i.imgur.com/MbKwZSm.jpg',
    categoryId: 1
  });
  products.push(product2);
  
  const product3 = await storage.createProduct({
    title: 'Custom Business Logo Stickers',
    description: 'Professional custom stickers featuring your business logo. Ideal for packaging, promotions, and branding.',
    price: 19.99,
    imageUrl: 'https://i.imgur.com/FV6jJVk.jpg',
    categoryId: 2
  });
  products.push(product3);
  
  const product4 = await storage.createProduct({
    title: 'Holographic Butterfly Stickers',
    description: 'Shimmering holographic butterfly stickers that catch the light. Perfect for decorations and crafts.',
    price: 8.99,
    imageUrl: 'https://i.imgur.com/OPjpOeB.jpg',
    categoryId: 3
  });
  products.push(product4);
  
  const product5 = await storage.createProduct({
    title: 'Car Window Decal Set',
    description: 'Durable outdoor vinyl decals for car windows. Weather-resistant and long-lasting.',
    price: 15.99,
    imageUrl: 'https://i.imgur.com/rIyiUPV.jpg',
    categoryId: 2
  });
  products.push(product5);
  
  return products;
}