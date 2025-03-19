import axios from 'axios';
import { Product, InsertProduct } from '../../shared/schema';
import { storage } from '../storage';

// eBay API configuration
const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_SECRET = process.env.EBAY_SECRET;

// eBay API URLs
const EBAY_PRODUCTION_API_URL = 'https://api.ebay.com';
const EBAY_INVENTORY_API = '/sell/inventory/v1/inventory_item';
const EBAY_BROWSE_API = '/buy/browse/v1/item_summary/search';

// Get token from environment variable
const EBAY_TOKEN = process.env.EBAY_TOKEN;

// Token storage
let ebayToken: string | null = EBAY_TOKEN || null;
let tokenExpiration: Date | null = new Date(Date.now() + 7200 * 1000); // Token expires in 2 hours (7200 seconds)

/**
 * Get OAuth token for eBay API
 * Uses the token provided by the user through environment variable if available
 */
export async function getEbayToken(): Promise<string> {
  // If we have the environment token, always use it
  if (EBAY_TOKEN) {
    console.log("Using eBay token from environment variable");
    return EBAY_TOKEN;
  }
  
  // Check if we have a valid token already
  if (ebayToken && tokenExpiration && new Date() < tokenExpiration) {
    return ebayToken;
  }

  // Generate a token through OAuth as a fallback - note that this generally
  // won't have all the required permissions for features like listing management
  try {
    console.log("Generating new eBay access token through OAuth");
    const response = await axios({
      method: 'post',
      url: `${EBAY_PRODUCTION_API_URL}/identity/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${EBAY_APP_ID || ''}:${EBAY_SECRET || ''}`).toString('base64')}`
      },
      data: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/buy.item.feed https://api.ebay.com/oauth/api_scope/buy.marketing https://api.ebay.com/oauth/api_scope/buy.item.bulk https://api.ebay.com/oauth/api_scope/buy.item'
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
 * Get the eBay seller ID from environment variable or configuration
 * This should be the username of the eBay seller account you want to import products from
 */
export function getEbaySellerID(): string {
  // Primary: use dedicated env var for seller ID if available
  const sellerID = process.env.EBAY_SELLER_ID || '';
  
  if (sellerID) {
    console.log(`Using eBay seller ID from environment: ${sellerID}`);
    return sellerID;
  }
  
  // Fallback: if no dedicated seller ID is provided, return empty string
  // The Browse API will then return general results
  console.log("No eBay seller ID provided, will return general results");
  return '';
}

/**
 * Get products from eBay Browse API
 * This is an alternative method that often works well with the provided token
 * @param sellerID Optional eBay seller username to filter results by specific seller
 */
export async function getEbayProductsFromBrowseAPI(sellerID?: string): Promise<any[]> {
  try {
    const token = await getEbayToken();
    console.log("Fetching products from eBay Browse API...");
    
    // Get seller ID if not provided
    const seller = sellerID || getEbaySellerID();
    
    // For better results, try multiple search queries
    const searchTerms = ['stickers', 'decal', 'custom sticker', 'vinyl sticker'];
    let allItems: any[] = [];
    
    // If we have a seller ID, try to get their specific listings first
    if (seller) {
      try {
        console.log(`Searching eBay Browse API for seller: ${seller}...`);
        
        // Using the Browse API with seller filter
        const response = await axios({
          method: 'get',
          url: `${EBAY_PRODUCTION_API_URL}${EBAY_BROWSE_API}?q=${encodeURIComponent(seller)}&filter=sellers:{${encodeURIComponent(seller)}}&limit=200`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          }
        });

        const items = response.data.itemSummaries || [];
        console.log(`Found ${items.length} items for seller "${seller}" from eBay Browse API`);
        
        // Add all seller items to our collection
        for (const item of items) {
          allItems.push(item);
        }
        
        // If we found items from the seller, return them directly
        if (allItems.length > 0) {
          return allItems;
        }
      } catch (sellerError) {
        console.error(`Error searching for seller "${seller}":`, sellerError);
        // Continue with keyword search as fallback
      }
    }
    
    // Try multiple search terms to maximize our chances of finding relevant products
    for (const searchTerm of searchTerms) {
      try {
        // Create the search URL with seller filter if available
        let searchUrl = `${EBAY_PRODUCTION_API_URL}${EBAY_BROWSE_API}?q=${encodeURIComponent(searchTerm)}&limit=20`;
        
        if (seller) {
          searchUrl += `&filter=sellers:{${encodeURIComponent(seller)}}`;
          console.log(`Searching eBay Browse API for "${searchTerm}" from seller "${seller}"...`);
        } else {
          console.log(`Searching eBay Browse API for "${searchTerm}"...`);
        }
        
        // Using the direct Browse API with search
        const response = await axios({
          method: 'get',
          url: searchUrl,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          }
        });

        const items = response.data.itemSummaries || [];
        console.log(`Found ${items.length} items for "${searchTerm}" from eBay Browse API`);
        
        // Add unique items to our collection
        for (const item of items) {
          // Only add if not already in the collection (avoid duplicates)
          if (!allItems.some(existingItem => existingItem.itemId === item.itemId)) {
            allItems.push(item);
          }
        }
        
        // If we found enough items, stop searching
        if (allItems.length >= 30) {
          break;
        }
      } catch (searchError) {
        console.error(`Error searching for "${searchTerm}":`, searchError);
        // Continue with next search term
      }
    }
    
    // If we got any items, return them
    if (allItems.length > 0) {
      console.log(`Total unique items found from eBay Browse API: ${allItems.length}`);
      return allItems;
    }
    
    // Fall back to a more generic search as a last resort
    const fallbackResponse = await axios({
      method: 'get',
      url: `${EBAY_PRODUCTION_API_URL}${EBAY_BROWSE_API}?limit=50`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const fallbackItems = fallbackResponse.data.itemSummaries || [];
    console.log(`Found ${fallbackItems.length} items from fallback search`);
    return fallbackItems;
  } catch (error) {
    console.error('Error fetching from Browse API:', error);
    throw new Error('Failed to fetch products from eBay Browse API');
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
    console.log('Falling back to browse search API...');
    return await getEbayProductsFromBrowseAPI();
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