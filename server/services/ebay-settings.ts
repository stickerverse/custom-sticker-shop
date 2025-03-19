import fs from 'fs';
import path from 'path';
import { logSync } from './ebay-sync';

// Settings storage file
const DATA_DIR = './shared/data';
const SETTINGS_FILE = path.join(DATA_DIR, 'ebay-settings.json');

// Default settings
const defaultSettings = {
  sellerID: '',
  lastUpdated: new Date().toISOString()
};

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logSync(`Created data directory: ${DATA_DIR}`);
  }
}

/**
 * Load eBay settings from file
 * @returns eBay settings object
 */
export function loadEbaySettings(): { sellerID: string, lastUpdated: string } {
  try {
    ensureDataDir();
    
    if (fs.existsSync(SETTINGS_FILE)) {
      const fileData = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(fileData);
      return {
        sellerID: settings.sellerID || '',
        lastUpdated: settings.lastUpdated || new Date().toISOString()
      };
    }
  } catch (error) {
    logSync(`Error loading eBay settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Return default settings if file doesn't exist or there's an error
  return defaultSettings;
}

/**
 * Save eBay settings to file
 * @param sellerID eBay seller ID
 * @returns Updated settings object
 */
export function saveEbaySettings(sellerID: string): { sellerID: string, lastUpdated: string } {
  try {
    ensureDataDir();
    
    const settings = {
      sellerID,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    logSync(`Saved eBay settings with seller ID: ${sellerID}`);
    
    return settings;
  } catch (error) {
    logSync(`Error saving eBay settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Get the current eBay seller ID
 * Priority:
 * 1. Environment variable EBAY_SELLER_ID
 * 2. Stored setting in ebay-settings.json
 * 3. Empty string (no filter)
 * @returns Seller ID string
 */
export function getEbaySellerID(): string {
  // First priority: environment variable
  const envSellerID = process.env.EBAY_SELLER_ID;
  if (envSellerID) {
    return envSellerID;
  }
  
  // Second priority: stored setting
  const settings = loadEbaySettings();
  return settings.sellerID;
}

/**
 * Express API endpoint handler to save eBay seller ID
 */
export async function saveEbaySellerIDHandler(req: Request, res: Response) {
  try {
    const { sellerID } = req.body;
    
    if (typeof sellerID !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }
    
    const settings = saveEbaySettings(sellerID.trim());
    
    return res.status(200).json({
      success: true,
      message: 'eBay seller ID saved successfully',
      settings
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Failed to save eBay seller ID - ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to save eBay seller ID',
      error: errorMessage
    });
  }
}