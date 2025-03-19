import fs from 'fs';
import path from 'path';

// Constants for data directories and files
const DATA_DIR = './shared/data';
const SYNC_LOG_FILE = path.join(DATA_DIR, 'ebay-sync-log.txt');
const PRODUCTS_JSON_FILE = path.join(DATA_DIR, 'ebay-products.json');
const PRODUCTS_CSV_FILE = path.join(DATA_DIR, 'ebay-products.csv');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Log sync activity
 * @param message Message to log
 */
export function logSync(message: string) {
  ensureDataDir();
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(SYNC_LOG_FILE, logEntry);
    console.log(`eBay Sync: ${message}`);
  } catch (error) {
    console.error('Failed to write to sync log:', error);
  }
}

/**
 * Save product data to JSON file
 * @param products Products to save
 */
export async function saveProductsToJson(products: any[]): Promise<string> {
  ensureDataDir();
  
  try {
    fs.writeFileSync(
      PRODUCTS_JSON_FILE,
      JSON.stringify(products, null, 2)
    );
    logSync(`Saved ${products.length} products to JSON file`);
    return PRODUCTS_JSON_FILE;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Failed to save products to JSON - ${errorMessage}`);
    throw error;
  }
}

/**
 * Convert products to CSV format and save to file
 * @param products Products to save
 */
export async function saveProductsToCsv(products: any[]): Promise<string> {
  ensureDataDir();
  
  try {
    // Create CSV header
    const headers = ['ID', 'Title', 'Description', 'Price', 'Image URL'];
    
    // Create CSV rows
    const rows = products.map(product => {
      const id = product.itemId || product.sku || '';
      const title = product.title || '';
      const description = product.shortDescription || product.description || '';
      
      let price = '';
      if (product.price?.value) {
        price = product.price.value;
      } else if (product.offers && Array.isArray(product.offers) && product.offers.length > 0) {
        const offer = product.offers[0];
        if (offer.price?.value) {
          price = offer.price.value;
        }
      }
      
      const imageUrl = product.image?.imageUrl || '';
      
      // Escape CSV fields
      return [
        id,
        `"${title.replace(/"/g, '""')}"`,
        `"${description.replace(/"/g, '""')}"`,
        price,
        imageUrl
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Write to file
    fs.writeFileSync(PRODUCTS_CSV_FILE, csvContent);
    logSync(`Saved ${products.length} products to CSV file`);
    return PRODUCTS_CSV_FILE;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Failed to save products to CSV - ${errorMessage}`);
    throw error;
  }
}

/**
 * Get sync logs
 */
export function getSyncLogs(): string {
  try {
    if (fs.existsSync(SYNC_LOG_FILE)) {
      return fs.readFileSync(SYNC_LOG_FILE, 'utf8');
    }
    return 'No sync logs available.';
  } catch (error) {
    console.error('Failed to read sync logs:', error);
    return 'Error reading sync logs.';
  }
}