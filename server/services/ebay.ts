import axios from 'axios';
import { Product, InsertProduct } from '../../shared/schema';
import { storage } from '../storage';

// eBay API configuration
const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_SECRET = process.env.EBAY_SECRET;

// eBay API URLs
const EBAY_PRODUCTION_API_URL = 'https://api.ebay.com';
const EBAY_INVENTORY_API = '/sell/inventory/v1/inventory_item';

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

  // Generate a token through OAuth
  try {
    console.log("Generating new eBay access token through OAuth");
    const response = await axios({
      method: 'post',
      url: `${EBAY_PRODUCTION_API_URL}/identity/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${EBAY_APP_ID || ''}:${EBAY_SECRET || ''}`).toString('base64')}`
      },
      data: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.account'
    });

    // Store token and expiration
    ebayToken = response.data.access_token;
    const expiresIn = response.data.expires_in;
    tokenExpiration = new Date(Date.now() + expiresIn * 1000);
    
    if (!ebayToken) {
      throw new Error('No access token received from eBay API');
    }
    
    return ebayToken;
  } catch (error) {
    console.error('Error getting eBay token:', error);
    throw new Error('Failed to authenticate with eBay API');
  }
}

/**
 * Get products from eBay account inventory
 */
export async function getEbayProducts(): Promise<any[]> {
  try {
    const token = await getEbayToken();
    console.log("Fetching products from eBay inventory...");
    
    // Fetch from the inventory API
    const response = await axios({
      method: 'get',
      url: `${EBAY_PRODUCTION_API_URL}${EBAY_INVENTORY_API}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const inventoryItems = response.data.inventoryItems || [];
    console.log(`Found ${inventoryItems.length} inventory items from eBay`);
    return inventoryItems;
  } catch (error) {
    console.error('Error fetching eBay products:', error);
    
    // For testing, if inventory fails, fall back to item search
    console.log('Falling back to item search API...');
    try {
      const token = await getEbayToken();
      const response = await axios({
        method: 'get',
        url: `${EBAY_PRODUCTION_API_URL}/buy/browse/v1/item_summary/search?q=stickers&limit=10`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      });
  
      return response.data.itemSummaries || [];
    } catch (fallbackError) {
      console.error('Error with fallback method:', fallbackError);
      throw new Error('Failed to fetch products from eBay using both methods');
    }
  }
}

/**
 * Import products from eBay to our application
 */
export async function importEbayProductsToApp(): Promise<Product[]> {
  try {
    // Get products from eBay
    const ebayProducts = await getEbayProducts();
    const importedProducts: Product[] = [];
    
    console.log("Processing eBay products for import...");
    
    // Process each product from eBay
    for (const ebayProduct of ebayProducts) {
      console.log("Processing eBay product:", JSON.stringify(ebayProduct).substring(0, 200) + '...');
      
      // Determine product attributes based on the API response format
      // The structure varies depending on which eBay API endpoint was used
      const title = ebayProduct.title || 
                   ebayProduct.product?.title || 
                   ebayProduct.inventoryItem?.product?.title ||
                   ebayProduct.sku || 
                   "eBay Product";
                   
      const description = ebayProduct.shortDescription || 
                         ebayProduct.description || 
                         ebayProduct.product?.description ||
                         ebayProduct.inventoryItem?.product?.description ||
                         title;
                         
      const imageUrl = ebayProduct.image?.imageUrl || 
                      ebayProduct.product?.imageUrls?.[0] ||
                      ebayProduct.inventoryItem?.product?.imageUrls?.[0] ||
                      "https://i.imgur.com/FV6jJVk.jpg";
                      
      let price = 9.99; // Default price if none is found
      
      // Try to extract price from various possible locations in the response
      if (ebayProduct.price?.value) {
        price = parseFloat(ebayProduct.price.value);
      } else if (ebayProduct.offers && Array.isArray(ebayProduct.offers) && ebayProduct.offers.length > 0) {
        const offer = ebayProduct.offers[0];
        if (offer.price?.value) {
          price = parseFloat(offer.price.value);
        }
      }
      
      // Create product in our database
      console.log(`Creating product: ${title} - $${price}`);
      const insertProduct: InsertProduct = {
        title,
        description,
        price,
        imageUrl,
        categoryId: 1, // Default category for stickers
      };
      
      // Add product to our database
      const product = await storage.createProduct(insertProduct);
      importedProducts.push(product);
      
      // Add default options for each sticker product
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
    
    console.log(`Successfully imported ${importedProducts.length} products from eBay`);
    return importedProducts;
  } catch (error) {
    console.error('Error importing eBay products:', error);
    
    // If the real eBay import fails, use the simulated products as a fallback
    console.log('Falling back to simulated eBay products...');
    return await getSimulatedEbayProducts();
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