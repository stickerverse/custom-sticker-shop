import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Product, InsertProduct } from '../../shared/schema';
import { storage } from '../storage';
import { getEbayToken, getEbayProductsFromBrowseAPI, getEbayProducts } from './ebay';

// File paths for export
const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_FILE_PATH = path.join(DATA_DIR, 'ebay_products.json');
const CSV_FILE_PATH = path.join(DATA_DIR, 'ebay_products.csv');
const LOG_FILE_PATH = path.join(DATA_DIR, 'sync_log.txt');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Save product data to JSON file
 * @param products Products to save
 */
export async function saveProductsToJson(products: any[]): Promise<string> {
  ensureDataDir();
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(products, null, 2));
  return JSON_FILE_PATH;
}

/**
 * Convert products to CSV format and save to file
 * @param products Products to save
 */
export async function saveProductsToCsv(products: any[]): Promise<string> {
  ensureDataDir();
  
  // Define CSV headers
  const headers = ['Product ID', 'Title', 'Price', 'Quantity', 'Description', 'Image URL'];
  
  // Map product data to CSV rows
  const rows = products.map(product => {
    // Extract data based on eBay API response format
    const id = product.itemId || product.sku || '';
    const title = product.title || 
                product.product?.title || 
                product.inventoryItem?.product?.title || '';
                
    const description = product.shortDescription || 
                      product.description || 
                      product.product?.description || '';
                      
    const imageUrl = product.image?.imageUrl || 
                    product.product?.imageUrls?.[0] || 
                    product.inventoryItem?.product?.imageUrls?.[0] || '';
                    
    let price = '0.00';
    if (product.price?.value) {
      price = product.price.value;
    } else if (product.offers && Array.isArray(product.offers) && product.offers.length > 0) {
      const offer = product.offers[0];
      if (offer.price?.value) {
        price = offer.price.value;
      }
    }
    
    const quantity = product.availableQuantity || 
                    product.quantity || 
                    '1';
    
    return [id, title, price, quantity, description, imageUrl].map(value => {
      // Escape quotes in CSV values
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n');
  
  // Write to file
  fs.writeFileSync(CSV_FILE_PATH, csv);
  
  return CSV_FILE_PATH;
}

/**
 * Log sync activity
 * @param message Message to log
 */
export function logSync(message: string) {
  ensureDataDir();
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(LOG_FILE_PATH, logMessage);
  console.log(logMessage.trim());
}

/**
 * Fetch products from eBay, save to files, and import to database
 */
export async function syncEbayProducts(): Promise<{
  products: Product[];
  jsonPath: string;
  csvPath: string;
}> {
  try {
    logSync('Starting eBay product sync...');
    
    // Attempt to get products from inventory API first
    let ebayProducts: any[] = [];
    try {
      logSync('Attempting to fetch products from eBay Inventory API...');
      ebayProducts = await getEbayProducts();
      logSync(`Retrieved ${ebayProducts.length} products from Inventory API`);
    } catch (error) {
      logSync('Inventory API failed, falling back to Browse API...');
      ebayProducts = await getEbayProductsFromBrowseAPI();
      logSync(`Retrieved ${ebayProducts.length} products from Browse API`);
    }
    
    if (ebayProducts.length === 0) {
      throw new Error('No products retrieved from eBay APIs');
    }
    
    // Save raw eBay data to files
    const jsonPath = await saveProductsToJson(ebayProducts);
    const csvPath = await saveProductsToCsv(ebayProducts);
    
    logSync(`Saved raw eBay data to JSON: ${jsonPath}`);
    logSync(`Saved raw eBay data to CSV: ${csvPath}`);
    
    // Import products to our database
    const importedProducts = await importEbayProductsToDatabase(ebayProducts);
    
    logSync(`Successfully imported ${importedProducts.length} products to database`);
    
    return {
      products: importedProducts,
      jsonPath,
      csvPath
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: eBay sync failed - ${errorMessage}`);
    throw error;
  }
}

/**
 * Import eBay products to database
 * @param ebayProducts Products from eBay API
 */
async function importEbayProductsToDatabase(ebayProducts: any[]): Promise<Product[]> {
  const importedProducts: Product[] = [];
  
  for (const ebayProduct of ebayProducts) {
    try {
      // Extract product details using the same logic as in ebay.ts
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logSync(`ERROR: Failed to import product - ${errorMessage}`);
    }
  }
  
  return importedProducts;
}

/**
 * Download eBay products as JSON file
 */
export async function getEbayProductsJsonDownload(): Promise<string> {
  try {
    // Check if JSON file exists, if not create it
    if (!fs.existsSync(JSON_FILE_PATH)) {
      await syncEbayProducts();
    }
    
    return JSON_FILE_PATH;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Failed to prepare JSON download - ${errorMessage}`);
    throw error;
  }
}

/**
 * Download eBay products as CSV file
 */
export async function getEbayProductsCsvDownload(): Promise<string> {
  try {
    // Check if CSV file exists, if not create it
    if (!fs.existsSync(CSV_FILE_PATH)) {
      await syncEbayProducts();
    }
    
    return CSV_FILE_PATH;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Failed to prepare CSV download - ${errorMessage}`);
    throw error;
  }
}

/**
 * Get sync logs
 */
export function getSyncLogs(): string {
  ensureDataDir();
  
  if (!fs.existsSync(LOG_FILE_PATH)) {
    return '';
  }
  
  return fs.readFileSync(LOG_FILE_PATH, 'utf8');
}